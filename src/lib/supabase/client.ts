import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저용 Supabase 클라이언트 (싱글톤).
 * 모듈 최상단에서 즉시 생성하지 않아, `next build` 프리렌더 시 env 미설정으로 터지는 것을 막습니다.
 * 프로덕션/로컬 실행 시에는 Vercel·`.env.local`에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 필요.
 */
export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase URL/anon key가 없습니다. Vercel 프로젝트 Settings → Environment Variables에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가하세요.",
    );
  }
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
