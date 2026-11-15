import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_PROJECT_REF') &&
  !supabaseAnonKey.includes('YOUR_SUPABASE')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const configuredRedirectBase = import.meta.env.VITE_QR_REDIRECT_BASE_URL as string | undefined;

export const getRedirectUrl = (code: string) => {
  const base = configuredRedirectBase?.trim() ||
    (supabaseUrl ? `${supabaseUrl}/functions/v1/redirect` : '');
  if (!base) throw new Error('Supabase redirect URL is not configured.');
  const url = new URL(base);
  url.searchParams.set('code', code);
  return url.toString();
};
