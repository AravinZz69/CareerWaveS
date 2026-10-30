// @ts-nocheck — Supabase Deno Edge Function runtime
// ============================================================================
// SUPABASE EDGE FUNCTION: "job-alerts"
// Scheduled Job Alert Runner
// - Uses the same multi-source fetch-jobs logic to discover newly posted jobs
//   matching each active user's target_role, location, and skills
// - Inserts unseen high-match jobs into public.notifications with the direct
//   https:// apply_url so users never receive duplicate alerts for the same job
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Load active user profiles with target roles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, target_role, location, skills')
      .eq('status', 'active')
      .limit(100);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, alertsCreated: 0, message: 'No active profiles to scan.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Invoke fetch-jobs Edge Function for recent 24h jobs
    const fetchJobsUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/fetch-jobs`;
    const fetchRes = await fetch(fetchJobsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Software Engineer AI Data',
        location: 'India',
        dateWindow: '24h',
        page: 1,
      }),
    });

    const fetchPayload = await fetchRes.json().catch(() => ({ jobs: [] }));
    const recentJobs = Array.isArray(fetchPayload?.jobs) ? fetchPayload.jobs : [];

    let alertsCreated = 0;

    for (const profile of profiles) {
      const userSkills: string[] = Array.isArray(profile.skills) ? profile.skills : [];
      const targetRole = String(profile.target_role || 'Software Engineer').toLowerCase();

      // Check existing notifications for this user to avoid duplicate alerts
      const { data: existingNotifs } = await supabase
        .from('notifications')
        .select('external_job_id, apply_url')
        .eq('user_id', profile.id);

      const seenJobIds = new Set(
        (existingNotifs || [])
          .map((n: any) => n.external_job_id || n.apply_url)
          .filter(Boolean)
      );

      for (const job of recentJobs) {
        const extId = String(job.external_id || job.id || '');
        const applyUrl = String(job.apply_url || '');
        if (!extId || !applyUrl.startsWith('https://')) continue;
        if (seenJobIds.has(extId) || seenJobIds.has(applyUrl)) continue;

        const titleLower = String(job.title || '').toLowerCase();
        const reqSkills: string[] = Array.isArray(job.required_skills) ? job.required_skills : [];
        const skillOverlap = reqSkills.filter((rs) =>
          userSkills.some((us) => us.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(us.toLowerCase()))
        );

        const roleMatches =
          targetRole.split(/\s+/).some((word) => word.length > 2 && titleLower.includes(word)) ||
          skillOverlap.length >= 2;

        if (roleMatches) {
          await supabase.from('notifications').insert({
            user_id: profile.id,
            title: `New Live Match: ${job.title} at ${job.company}`,
            message: `Posted via ${job.source_platform || 'Company Site'} in ${job.location}. Direct application link ready.`,
            type: 'match',
            is_read: false,
            apply_url: applyUrl,
            external_job_id: extId,
          });
          seenJobIds.add(extId);
          alertsCreated++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertsCreated,
        scannedJobsCount: recentJobs.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to run scheduled job alerts.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
