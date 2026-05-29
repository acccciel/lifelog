"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface ModuleLayoutProps {
  emoji: string;
  title: string;
  subtitle?: string;
  gradient: string;
  children: ReactNode;
}

export default function ModuleLayout({
  emoji,
  title,
  subtitle,
  gradient,
  children,
}: ModuleLayoutProps) {
  const router = useRouter();

  return (
    <div className="mobile-frame flex min-h-dvh flex-col px-5 pb-8 pt-4">
      {/* ===== 顶部 ===== */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-base shadow-sm active:scale-90"
          onClick={() => router.back()}
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{title}</h1>
            {subtitle && (
              <p className="text-xs text-text-secondary">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* ===== 内容区 ===== */}
      <div className={`card-y2k ${gradient} flex-1`}>{children}</div>

      {/* ===== 底部时间提示 ===== */}
      <p className="mt-3 text-center text-xs text-text-secondary">
        记录时间将自动保存
      </p>
    </div>
  );
}