"use client";

import { useToastContext } from "@/components/ui/ToastProvider";

export function useToast() {
  const { showToast } = useToastContext();
  return { showToast };
}
