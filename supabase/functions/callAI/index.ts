// @ts-nocheck — Supabase Deno Edge Function runtime
// ============================================================================
// SUPABASE EDGE FUNCTION: "callAI"
// Shared AI Gateway for CareerWave:
// - Primary Provider: OpenRouter (https://openrouter.ai/api/v1/chat/completions)
//   using OPENROUTER_API_KEY secret, Authorization Bearer header, HTTP-Referer,
//   X-Title: "CareerWave", and provider.data_collection = "deny".
// - Dynamic Model Waterfall stored in public.app_settings ('ai_provider_config'):
//   Default order:
//     1. nvidia/nemotron-3-ultra-550b-a55b:free
//     2. google/gemma-4-31b-it:free
//     3. openrouter/free
// - Optional Fallback: Google Gemini (GEMINI_API_KEY secret) when enabled in app_settings.
// - Features:
//   * SHA-256 input + promptVersion caching in public.ai_response_cache
//   * Per-user plan limit verification and usage_events logging (provider, model,
//     tokens_in, tokens_out, latency_ms, status, error_message)
//   * JSON output enforcement, malformed JSON extraction/repair, schema validation,
//     and automatic retry on the next model in the waterfall
//   * Admin actions: 'refresh-free-models', 'test-model', 'forced-failure-test'
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_OPENROUTER_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-31b-it:free',
  'openrouter/free',
];

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function extractAndRepairJson(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty AI response text');
  }
  let cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Locate first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Repair trailing commas and unescaped control characters
    const repaired = cleaned
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u0000-\u0019]+/g, ' ');
    return JSON.parse(repaired);
  }
}

function validateAgainstSchema(data: any, requiredKeys?: string[]): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(requiredKeys) || requiredKeys.length === 0) return true;
  for (const key of requiredKeys) {
    if (!(key in data) || data[key] === undefined) {
      return false;
    }
  }
  return true;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const body = req.method === 'GET' ? {} : await req.json().catch(() => ({}));
    const action = String(body.action || 'completion').trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase =
      supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    const openRouterKey = (Deno.env.get('OPENROUTER_API_KEY') || '').trim();
    const geminiKey = (Deno.env.get('GEMINI_API_KEY') || '').trim();

    // Load dynamic model configuration from public.app_settings
    let configuredModels = [...DEFAULT_OPENROUTER_MODELS];
    let geminiFallbackEnabled = true;
    let dataCollectionPolicy = 'deny';

    if (supabase) {
      const { data: settingRow } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'ai_provider_config')
        .maybeSingle();
      if (settingRow?.value) {
        if (
          Array.isArray(settingRow.value.openrouter_models) &&
          settingRow.value.openrouter_models.length > 0
        ) {
          configuredModels = settingRow.value.openrouter_models;
        }
        if (typeof settingRow.value.gemini_fallback_enabled === 'boolean') {
          geminiFallbackEnabled = settingRow.value.gemini_fallback_enabled;
        }
        if (settingRow.value.data_collection) {
          dataCollectionPolicy = settingRow.value.data_collection;
        }
      }
    }

    // =========================================================================
    // ADMIN ACTION 1: Refresh Public OpenRouter Free Models List
    // =========================================================================
    if (action === 'refresh-free-models') {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'HTTP-Referer': 'https://career-wave-s.vercel.app',
          'X-Title': 'CareerWave',
        },
      });
      if (!res.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `OpenRouter models endpoint returned HTTP ${res.status}`,
          }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const payload = await res.json();
      const allModels = Array.isArray(payload?.data) ? payload.data : [];
      const freeModels = allModels
        .filter(
          (m: any) =>
            String(m.id || '').endsWith(':free') || String(m.id || '') === 'openrouter/free'
        )
        .map((m: any) => {
          const supportedParams: string[] = Array.isArray(m.supported_parameters)
            ? m.supported_parameters
            : [];
          const supportsJson =
            supportedParams.includes('response_format') ||
            supportedParams.includes('structured_outputs') ||
            /nemotron|gemma|llama|qwen|mistral|deepseek|openrouter\/free/i.test(String(m.id));
          return {
            id: m.id,
            name: m.name || m.id,
            context_length: m.context_length || 32768,
            supportsJsonOutput: supportsJson,
          };
        });

      return new Response(
        JSON.stringify({
          success: true,
          models: freeModels,
          configuredModels,
          geminiFallbackEnabled,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // ADMIN ACTION 2: Test Specific Model (Latency + Valid JSON Output Check)
    // =========================================================================
    if (action === 'test-model') {
      const targetModel = String(body.model || configuredModels[0]).trim();
      const t0 = Date.now();

      if (!openRouterKey) {
        return new Response(
          JSON.stringify({
            success: false,
            model: targetModel,
            latencyMs: Date.now() - t0,
            validJson: false,
            error: 'OPENROUTER_API_KEY secret is not configured in Supabase.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const testRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://career-wave-s.vercel.app',
          'X-Title': 'CareerWave',
        },
        body: JSON.stringify({
          model: targetModel,
          temperature: 0,
          response_format: { type: 'json_object' },
          provider: {
            data_collection: 'deny',
          },
          messages: [
            {
              role: 'system',
              content: 'Respond strictly with valid JSON: {"status":"ok","provider":"openrouter"}',
            },
            { role: 'user', content: 'Return status JSON.' },
          ],
        }),
      });

      const latencyMs = Date.now() - t0;
      const testJson = await testRes.json().catch(() => ({}));

      if (!testRes.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            model: targetModel,
            latencyMs,
            validJson: false,
            error:
              testJson?.error?.message ||
              `OpenRouter returned HTTP ${testRes.status} for ${targetModel}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const content = testJson?.choices?.[0]?.message?.content || '';
      let parsed: any = null;
      let validJson = false;
      try {
        parsed = extractAndRepairJson(content);
        validJson = Boolean(parsed && typeof parsed === 'object');
      } catch {
        validJson = false;
      }

      return new Response(
        JSON.stringify({
          success: validJson,
          model: testJson?.model || targetModel,
          latencyMs,
          validJson,
          sampleOutput: parsed,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // STANDARD AI TASK EXECUTION (WITH WATERFALL, CACHE, QUOTA & TELEMETRY)
    // =========================================================================
    const task = String(body.task || 'resume_parse').trim();
    const promptVersion = String(body.promptVersion || 'v3.2.0').trim();
    const systemPrompt = String(
      body.systemPrompt ||
        'You are a high-precision JSON extraction and career intelligence engine. Return ONLY valid JSON matching the requested schema.'
    );
    const userPrompt = String(body.prompt || body.userPrompt || '');
    const requiredKeys: string[] = Array.isArray(body.requiredKeys) ? body.requiredKeys : [];
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0;
    const userId = body.userId || null;
    const feature: string = body.feature || 'resume_tailoring';
    const forceFirstModelFailure = Boolean(body.forceFirstModelFailure);

    if (!userPrompt.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Prompt cannot be empty.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Check SHA-256 Cache in public.ai_response_cache
    const cacheKey = await sha256Hex(`${task}::${promptVersion}::${systemPrompt}::${userPrompt}`);
    if (supabase && !body.skipCache && !forceFirstModelFailure) {
      const { data: cachedHit } = await supabase
        .from('ai_response_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .maybeSingle();

      if (cachedHit?.response_json) {
        return new Response(
          JSON.stringify({
            success: true,
            fromCache: true,
            provider: cachedHit.provider,
            model: cachedHit.model,
            promptVersion,
            latencyMs: Date.now() - startedAt,
            data: cachedHit.response_json,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Check User Quota if userId is provided
    if (supabase && userId && body.enforceQuota) {
      const { data: quotaCheck } = await supabase.rpc('check_and_record_ai_usage', {
        _user_id: userId,
        _feature: feature,
        _tokens_in: Math.ceil(userPrompt.length / 4),
        _tokens_out: 450,
        _estimated_cost: 0,
      });
      if (quotaCheck && quotaCheck.allowed === false) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'QUOTA_EXCEEDED',
            error: `Monthly ${feature} limit reached (${quotaCheck.used}/${quotaCheck.total_limit}). Please upgrade your plan.`,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const attemptsTrace: Array<{
      provider: string;
      model: string;
      status: string;
      latencyMs: number;
      error?: string;
    }> = [];

    const modelsToTry = forceFirstModelFailure
      ? ['invalid/forced-failure-model:free', ...configuredModels]
      : [...configuredModels];

    let finalParsedData: any = null;
    let answeredProvider = '';
    let answeredModel = '';
    let tokensIn = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    let tokensOut = 0;

    // 3. Try OpenRouter Models Waterfall
    if (openRouterKey) {
      for (let i = 0; i < modelsToTry.length; i++) {
        const candidateModel = modelsToTry[i];
        const remainingModels = modelsToTry.slice(i + 1);
        const attemptStart = Date.now();

        try {
          if (candidateModel === 'invalid/forced-failure-model:free') {
            throw new Error('Forced primary model failure for fallback verification test');
          }

          const supportsJsonFormat = !/gemma-3-4b|tinyllama/i.test(candidateModel);
          const reqPayload: Record<string, any> = {
            model: candidateModel,
            models: [candidateModel, ...remainingModels].slice(0, 3),
            temperature,
            provider: {
              data_collection: dataCollectionPolicy,
              allow_fallbacks: true,
            },
            messages: [
              {
                role: 'system',
                content: `${systemPrompt}\nIMPORTANT: Output ONLY valid raw JSON. Do not include markdown fences or conversational text.`,
              },
              { role: 'user', content: userPrompt },
            ],
          };

          if (supportsJsonFormat) {
            reqPayload.response_format = { type: 'json_object' };
          }

          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://career-wave-s.vercel.app',
              'X-Title': 'CareerWave',
            },
            body: JSON.stringify(reqPayload),
          });

          const attemptLatency = Date.now() - attemptStart;
          const orJson = await orRes.json().catch(() => ({}));

          if (orRes.status === 429) {
            attemptsTrace.push({
              provider: 'openrouter',
              model: candidateModel,
              status: 'rate_limited_429',
              latencyMs: attemptLatency,
              error: orJson?.error?.message || 'HTTP 429 Rate Limit',
            });
            await sleep(450);
            continue;
          }

          if (!orRes.ok) {
            const errMsg =
              orJson?.error?.message || `OpenRouter HTTP ${orRes.status} on ${candidateModel}`;
            attemptsTrace.push({
              provider: 'openrouter',
              model: candidateModel,
              status: 'error',
              latencyMs: attemptLatency,
              error: errMsg,
            });
            continue;
          }

          const content = orJson?.choices?.[0]?.message?.content || '';
          const parsed = extractAndRepairJson(content);

          if (!validateAgainstSchema(parsed, requiredKeys)) {
            attemptsTrace.push({
              provider: 'openrouter',
              model: candidateModel,
              status: 'schema_validation_failed',
              latencyMs: attemptLatency,
              error: `Missing required schema keys: ${requiredKeys.join(', ')}`,
            });
            continue;
          }

          finalParsedData = parsed;
          answeredProvider = 'openrouter';
          answeredModel = orJson?.model || candidateModel;
          tokensIn = orJson?.usage?.prompt_tokens || tokensIn;
          tokensOut = orJson?.usage?.completion_tokens || Math.ceil(content.length / 4);

          attemptsTrace.push({
            provider: 'openrouter',
            model: answeredModel,
            status: 'success',
            latencyMs: attemptLatency,
          });
          break;
        } catch (err: any) {
          attemptsTrace.push({
            provider: 'openrouter',
            model: candidateModel,
            status: 'exception',
            latencyMs: Date.now() - attemptStart,
            error: err?.message || 'Model call failed',
          });
        }
      }
    }

    // 4. Optional Fallback to Google Gemini if OpenRouter Waterfall did not succeed
    if (!finalParsedData && geminiFallbackEnabled && geminiKey) {
      const gemStart = Date.now();
      try {
        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
            geminiKey
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        const gemLatency = Date.now() - gemStart;
        const gemJson = await gemRes.json().catch(() => ({}));

        if (gemRes.ok) {
          const text = gemJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = extractAndRepairJson(text);
          if (validateAgainstSchema(parsed, requiredKeys)) {
            finalParsedData = parsed;
            answeredProvider = 'gemini';
            answeredModel = 'gemini-2.5-flash';
            tokensOut = Math.ceil(text.length / 4);
            attemptsTrace.push({
              provider: 'gemini',
              model: 'gemini-2.5-flash',
              status: 'success',
              latencyMs: gemLatency,
            });
          }
        } else {
          attemptsTrace.push({
            provider: 'gemini',
            model: 'gemini-2.5-flash',
            status: 'error',
            latencyMs: gemLatency,
            error: gemJson?.error?.message || `Gemini HTTP ${gemRes.status}`,
          });
        }
      } catch (err: any) {
        attemptsTrace.push({
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          status: 'exception',
          latencyMs: Date.now() - gemStart,
          error: err?.message || 'Gemini fallback failed',
        });
      }
    }

    const totalLatencyMs = Date.now() - startedAt;

    // 5. Log telemetry to public.usage_events
    if (supabase) {
      try {
        await supabase.from('usage_events').insert({
          user_id: userId || undefined,
          feature: [
            'resume_tailoring',
            'ai_job_match',
            'mock_interview',
            'linkedin_generation',
            'portfolio_generation',
          ].includes(feature)
            ? feature
            : 'resume_tailoring',
          provider: answeredProvider || 'openrouter',
          model: answeredModel || configuredModels[0],
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          latency_ms: totalLatencyMs,
          status: finalParsedData ? 'success' : 'failed',
          error_message: finalParsedData
            ? null
            : attemptsTrace.map((a) => `${a.model}: ${a.error}`).join(' | '),
          estimated_cost: 0,
          metadata: {
            task,
            promptVersion,
            attempts: attemptsTrace,
          },
        });
      } catch {
        // non-fatal telemetry write
      }
    }

    if (!finalParsedData) {
      const noProviderConfigured = !openRouterKey && !geminiKey;
      const noModelUnderPrivacyPolicy = attemptsTrace.some((a) =>
        /data policy|data_collection|no endpoints found/i.test(String(a.error || ''))
      );

      const userFriendlyMessage = noProviderConfigured
        ? 'AI service is not configured yet. Please add OPENROUTER_API_KEY in Supabase Edge Function secrets.'
        : noModelUnderPrivacyPolicy
        ? 'No free OpenRouter model is currently available under the strict data_collection: "deny" privacy policy. Try refreshing the free models list in Admin Settings.'
        : 'AI is busy, try again in a minute.';

      return new Response(
        JSON.stringify({
          success: false,
          error: userFriendlyMessage,
          attempts: attemptsTrace,
          latencyMs: totalLatencyMs,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Save valid result to public.ai_response_cache
    if (supabase) {
      try {
        await supabase.from('ai_response_cache').upsert({
          cache_key: cacheKey,
          task,
          prompt_version: promptVersion,
          provider: answeredProvider,
          model: answeredModel,
          response_json: finalParsedData,
          created_at: new Date().toISOString(),
        });
      } catch {
        // ignore cache write failure
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fromCache: false,
        provider: answeredProvider,
        model: answeredModel,
        promptVersion,
        latencyMs: totalLatencyMs,
        attempts: attemptsTrace,
        data: finalParsedData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'AI is busy, try again in a minute.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
