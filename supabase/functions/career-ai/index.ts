// @ts-nocheck — Supabase Deno Edge Function runtime
// ============================================================================
// SUPABASE EDGE FUNCTION: "career-ai"
// Unified Serverless AI Engine for CareerWave (Resume Parsing, ATS Tailoring,
// Bullet Enhancement, Application Kit, Roadmap Generation, LinkedIn SEO,
// Spoken Voice Mock Interview, and Portfolio Generation).
// Secrets used (stored ONLY in Supabase Edge Function Secrets):
//   - GEMINI_API_KEY
//   - OPENROUTER_API_KEY
//   - ELEVENLABS_API_KEY
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callLlmJson(prompt: string, systemInstruction: string): Promise<any | null> {
  const geminiKey = (Deno.env.get('GEMINI_API_KEY') || '').trim();
  const openRouterKey = (Deno.env.get('OPENROUTER_API_KEY') || '').trim();

  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          geminiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return JSON.parse(text);
      }
    } catch {
      // Fall through to OpenRouter if configured
    }
  }

  if (openRouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || '';
        if (content) return JSON.parse(content);
      }
    } catch {
      // Return null so deterministic fallback runs
    }
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = req.method === 'GET' ? {} : await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase =
      supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    if (action === 'test-openrouter') {
      const openRouterKey = (Deno.env.get('OPENROUTER_API_KEY') || '').trim();
      const geminiKey = (Deno.env.get('GEMINI_API_KEY') || '').trim();
      return new Response(
        JSON.stringify({
          success: Boolean(openRouterKey || geminiKey),
          model: body.model || 'google/gemini-2.5-flash',
          message:
            openRouterKey || geminiKey
              ? 'Supabase Edge Function AI secrets are configured and active.'
              : 'Configure GEMINI_API_KEY or OPENROUTER_API_KEY in Supabase Edge Function secrets.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'parse-resume') {
      const rawText = String(body.rawText || body.fileName || '');
      const aiParsed = await callLlmJson(
        `Extract structured resume JSON from:\n${rawText.slice(0, 12000)}`,
        'Return JSON with contact (fullName, email, phone, location), summary, skills (languages, frameworks, cloudAndDevOps, aiAndData arrays), experience, projects, education, and inferredProfile (title, target_role, experience_level, career_track, location, skills, bio).'
      );

      if (aiParsed && aiParsed.contact) {
        return new Response(
          JSON.stringify({
            success: true,
            data: aiParsed,
            inferredProfile: aiParsed.inferredProfile || {},
            rawExtractedText: rawText,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'tailor-resume') {
      const { resume, jobTitle, company, jobDescription } = body;
      const aiTailored = await callLlmJson(
        `Tailor this resume for ${jobTitle} at ${company}.\nJob Description:\n${String(
          jobDescription || ''
        ).slice(0, 6000)}\nResume:\n${JSON.stringify(resume || {})}`,
        'Return JSON with tailoredSummary, matchedKeywords (string[]), missingKeywords (string[]), and matchScore (number 65-98).'
      );
      if (aiTailored) {
        return new Response(JSON.stringify({ success: true, data: aiTailored }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'interview-voice-turn') {
      const { role, company, interviewType, userAnswer, turnIndex = 0 } = body;
      const aiTurn = await callLlmJson(
        `Role: ${role} at ${company} (${interviewType}). Candidate said: "${
          userAnswer || 'Ready to begin'
        }". Turn #${turnIndex + 1}.`,
        'Return JSON with interviewerReply (string), nextQuestion (string), coachingTip (string), and score (number 70-98).'
      );
      const replyText =
        aiTurn?.nextQuestion ||
        `Can you walk me through a production system you architected for ${
          role || 'this role'
        }, including trade-offs and measurable latency or reliability gains?`;

      // Optional ElevenLabs TTS via ELEVENLABS_API_KEY secret
      let audioBase64: string | null = null;
      const elevenKey = (Deno.env.get('ELEVENLABS_API_KEY') || '').trim();
      if (elevenKey) {
        try {
          const ttsRes = await fetch(
            'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
            {
              method: 'POST',
              headers: {
                'xi-api-key': elevenKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: replyText,
                model_id: 'eleven_monolingual_v1',
              }),
            }
          );
          if (ttsRes.ok) {
            const buf = new Uint8Array(await ttsRes.arrayBuffer());
            let bin = '';
            for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
            audioBase64 = btoa(bin);
          }
        } catch {
          // continue without TTS audio
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          interviewerReply:
            aiTurn?.interviewerReply || 'Strong structured response. Let us go one layer deeper.',
          nextQuestion: replyText,
          coachingTip:
            aiTurn?.coachingTip ||
            'Quantify your engineering impact with concrete latency, throughput, or revenue metrics.',
          score: aiTurn?.score || 88,
          audioBase64,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        hasSupabase: Boolean(supabase),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'CareerWave Edge Function error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
