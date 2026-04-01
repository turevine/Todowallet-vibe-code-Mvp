"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const AUTO_LOGIN_KEY = "todowallet_auto_login_enabled";
const ACTIVE_SESSION_KEY = "todowallet_active_session";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoLoginEnabled, setAutoLoginEnabledState] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const savedAutoLogin = localStorage.getItem(AUTO_LOGIN_KEY) === "1";
    setAutoLoginEnabledState(savedAutoLogin);

    // sessionStorage는 탭마다 비어 있어서, 여기서 강제 signOut 하면
    // (자동 로그인 미체크 + 새 탭/직접 URL) 유효한 세션도 끊겨 카드 생성 등이 실패합니다.
    // 자동 로그인 여부는 저장만 하고, 세션은 Supabase가 쿠키/스토리지로 유지합니다.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        sessionStorage.setItem(ACTIVE_SESSION_KEY, "1");
      }
      setUser(user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        sessionStorage.setItem(ACTIVE_SESSION_KEY, "1");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    sessionStorage.setItem(ACTIVE_SESSION_KEY, "1");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    sessionStorage.setItem(ACTIVE_SESSION_KEY, "1");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    sessionStorage.setItem(ACTIVE_SESSION_KEY, "1");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const setAutoLoginEnabled = useCallback((enabled: boolean) => {
    setAutoLoginEnabledState(enabled);
    if (enabled) {
      localStorage.setItem(AUTO_LOGIN_KEY, "1");
    } else {
      localStorage.setItem(AUTO_LOGIN_KEY, "0");
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    // 모든 사용자 데이터 삭제 (cascade 또는 수동)
    await supabase.from("time_logs").delete().eq("user_id", user.id);
    await supabase.from("page_views").delete().eq("user_id", user.id);
    await supabase.from("project_cards").delete().eq("user_id", user.id);
    await supabase.auth.signOut();
  }, [user]);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    deleteAccount,
    autoLoginEnabled,
    setAutoLoginEnabled,
  };
}
