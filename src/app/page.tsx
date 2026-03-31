"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { DESIGN_PRESETS } from "@/constants/design-presets";

type AuthMode = "idle" | "login" | "signup";
const LANDING_CARD_TITLES = [
  "토익 900점 따기",
  "산업 기사 자격증 취득하기",
  "매일 운동 30분",
] as const;
const LANDING_CARD_META = [
  { days: 2, total: "5:42:10", dday: "D-21", month: "3월" },
  { days: 4, total: "8:15:40", dday: "D-35", month: "3월" },
  { days: 3, total: "1:38:20", dday: "D-12", month: "3월" },
] as const;
const LANDING_HEATMAP_OPACITY = [
  [0.2, 0.35, 0.55, 0.75, 0.4, 0.25, 0.65, 0.85, 0.45, 0.2],
  [0.25, 0.5, 0.2, 0.7, 0.9, 0.45, 0.3, 0.8, 0.5, 0.35],
] as const;

export default function LandingPage() {
  const {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    autoLoginEnabled,
    setAutoLoginEnabled,
  } =
    useAuth();
  const router = useRouter();

  const [authMode, setAuthMode] = useState<AuthMode>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [loading, router, user]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (authMode === "login") {
        await signInWithEmail(email, password);
        router.replace("/home");
      } else {
        await signUpWithEmail(email, password);
        setMessage("인증 이메일을 확인해주세요.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage("비밀번호 재설정 이메일을 확인해주세요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <motion.div
      className="flex flex-col min-h-screen px-6 py-12 bg-[#f5f5f7]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 상단 여백 */}
      <div className="flex-1" />

      {/* 로고 & 타이틀 */}
      <div className="text-center mb-10">
        <div className="mb-3 flex justify-center">
          <Image
            src="/favicon.svg"
            alt="TodoWallet 로고"
            width={44}
            height={44}
            priority
          />
        </div>
        <h1 className="text-[2rem] font-bold tracking-tight text-gray-900 mb-2">
          TodoWallet
        </h1>
        <p className="text-[15px] text-gray-500 font-medium">
          노력은 눈에 보여야 계속된다
        </p>
      </div>

      {/* 카드 목업 프리뷰 (작은 가로형 + 겹침) */}
      <div className="relative h-[300px] mb-8">
        {DESIGN_PRESETS.slice(0, 3).map((preset, i) => (
          <div
            key={preset.id}
            className={`absolute left-1/2 w-[290px] rounded-2xl shadow-lg ${preset.patternClass ?? ""}`}
            style={{
              background: preset.gradient,
              aspectRatio: "1.6 / 1",
              opacity: i === 0 ? 1 : 0.94,
              transform: `translateX(-50%) translateY(${i * 58}px) rotate(${(i - 1) * 2.8}deg) scale(${1 - i * 0.045})`,
              zIndex: 30 - i,
            }}
          >
            <div className="px-5 pt-3 pb-5 h-full flex flex-col" style={{ color: preset.textColor }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold truncate flex-1 mr-3">
                  {LANDING_CARD_TITLES[i]}
                </h3>
                <span className="text-xs opacity-70 whitespace-nowrap">{LANDING_CARD_META[i].days}일째</span>
              </div>

              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xl font-bold tracking-tight font-mono tabular-nums">
                  {LANDING_CARD_META[i].total}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10">
                  {LANDING_CARD_META[i].dday}
                </span>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] opacity-75">◀</span>
                <span className="text-[11px] font-medium opacity-85">{LANDING_CARD_META[i].month}</span>
                <span className="text-[11px] opacity-75">▶</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {LANDING_HEATMAP_OPACITY.map((row, ri) => (
                  <div key={ri} className="flex gap-1.5">
                    {row.map((opacity, j) => (
                      <div
                        key={`${ri}-${j}`}
                        className="w-[8px] h-[8px] rounded-full"
                        style={{
                          backgroundColor: preset.accentColor,
                          opacity,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 인증 버튼 */}
      <div className="space-y-3 mb-6">
        <button
          onClick={signInWithGoogle}
          className="pressable touch-target w-full h-[52px] bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-3 text-[15px] font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google로 시작하기
        </button>

        <button
          onClick={() => {
            setAuthMode(authMode === "idle" ? "login" : "idle");
            setError("");
            setMessage("");
          }}
          className="pressable touch-target w-full h-[52px] bg-gray-900 rounded-xl flex items-center justify-center gap-2 text-[15px] font-medium text-white hover:bg-gray-800 active:bg-gray-700 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
          </svg>
          이메일로 시작하기
        </button>
      </div>

      {/* 이메일 폼 */}
      {authMode !== "idle" && (
        <form onSubmit={handleEmailAuth} className="space-y-3 mb-6">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-[48px] px-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-[48px] px-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
          />

          {error && (
            <p className="text-[13px] text-red-500 px-1">{error}</p>
          )}
          {message && (
            <p className="text-[13px] text-green-600 px-1">{message}</p>
          )}

          <label className="flex items-center gap-2 px-1 select-none">
            <input
              type="checkbox"
              checked={autoLoginEnabled}
              onChange={(e) => setAutoLoginEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
            />
            <span className="text-[13px] text-gray-600">자동 로그인</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="pressable touch-target w-full h-[48px] bg-gray-900 rounded-xl text-[15px] font-medium text-white hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                처리 중...
              </>
            ) : (
              authMode === "login"
                ? "로그인"
                : "회원가입"
            )}
          </button>

          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setError("");
                setMessage("");
              }}
              className="text-[13px] text-gray-500 hover:text-gray-700"
            >
              {authMode === "login" ? "회원가입" : "로그인"}
            </button>
            {authMode === "login" && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[13px] text-gray-500 hover:text-gray-700"
                >
                  비밀번호 찾기
                </button>
              </>
            )}
          </div>
        </form>
      )}

      {/* 하단 여백 */}
      <div className="flex-1" />
    </motion.div>
  );
}
