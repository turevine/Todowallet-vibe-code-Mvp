import type { ReactNode } from "react";

/** 빌드 시 정적 프리렌더를 건너뛰어 AuthGuard/Supabase 관련 SSR 이슈를 피합니다. */
export const dynamic = "force-dynamic";

export default function CardsNewLayout({ children }: { children: ReactNode }) {
  return children;
}
