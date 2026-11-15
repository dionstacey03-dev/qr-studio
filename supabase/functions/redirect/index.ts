import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonError = (status: number, message: string) =>
  new Response(message, { status, headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' } });

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'GET') return jsonError(405, 'Method not allowed');

  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  if (!/^[A-Za-z0-9_-]{8,20}$/.test(code)) return jsonError(400, 'Invalid QR link');

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return jsonError(503, 'Redirect service is not configured');

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ua = request.headers.get('user-agent') || '';
  const device = /iPad|Tablet/i.test(ua) ? 'tablet' :
    /Mobile|Android|iPhone|iPod/i.test(ua) ? 'mobile' :
    /Windows|Macintosh|Linux/i.test(ua) ? 'desktop' : 'other';
  const browser = /Edg\//i.test(ua) ? 'edge' :
    /Firefox\//i.test(ua) ? 'firefox' :
    /Chrome\//i.test(ua) && !/Edg\//i.test(ua) ? 'chrome' :
    /Safari\//i.test(ua) && !/Chrome\//i.test(ua) ? 'safari' : 'other';

  const { data: destination, error } = await admin.rpc('record_qr_scan', {
    p_code: code,
    p_device: device,
    p_browser: browser,
  });

  if (error) {
    console.error('QR scan recording failed:', error.message);
    return jsonError(503, 'Unable to resolve this QR link');
  }
  if (typeof destination !== 'string') return jsonError(404, 'QR link not found or deactivated');

  let target: URL;
  try {
    target = new URL(destination);
  } catch {
    return jsonError(410, 'QR destination is invalid');
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return jsonError(410, 'QR destination protocol is not supported');
  }

  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: target.toString(), 'Cache-Control': 'no-store' },
  });
});
