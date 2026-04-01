"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { getToday } from "@/lib/utils/date";

export function usePageView() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const today = getToday();

    supabase
      .from("page_views")
      .upsert(
        { user_id: user.id, visited_date: today },
        { onConflict: "user_id,visited_date", ignoreDuplicates: true },
      )
      .then(() => {});
  }, [user]);
}
