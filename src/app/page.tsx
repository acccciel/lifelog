"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getToday, getTodayModuleCount } from "@/lib/services";

const MODULES = [
  { id: "meal", emoji: "🍚", label: "饮食", desc: "吃了什么？拍下来", color: "bg-cream-light" },
  { id: "mood", emoji: "😊", label: "心情", desc: "今天感觉怎么样", color: "bg-pink-light" },
  { id: "exercise", emoji: "🏃", label: "运动", desc: "动了多少？", color: "bg-mint-light" },
  { id: "work", emoji: "💼", label: "工作", desc: "今天做了什么", color: "bg-ice-light" },
  { id: "study", emoji: "📚", label: "学习", desc: "学了什么新东西", color: "bg-lavender-light" },
  { id: "sleep", emoji: "😴", label: "睡眠", desc: "昨晚睡得好吗", color: "bg-ice-light" },
];

function getTodayStr() {
  const d = new Date();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`;
}

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [dateStr] = useState(getTodayStr);
  const [moduleCount, setModuleCount] = useState(0);

  // 检查登录状态
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // 加载今日已记录数
  useEffect(() => {
    if (user) {
      getTodayModuleCount().then(setModuleCount);
    }
  }, [user]);

  // 未登录时显示空白（避免闪烁）
  if (loading || !user) return null;

  const handleNav = (path: string) => router.push(path);

  return (
    <div className="mobile-frame flex flex-col px-5 pb-8 pt-6">
      {/* ===== 顶部标题 ===== */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            LifeLog ✦
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-white/70 px-3 py-1.5 text-xs text-text-secondary shadow-sm"
            onClick={signOut}
          >
            退出
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-light/40 text-lg"
          >
            👤
          </button>
        </div>
      </div>

      {/* ===== 今日总览卡片 ===== */}
      <div className="card-y2k glass mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
              今日概况
            </p>
            <p className="mt-1 text-lg font-semibold text-text-primary">
              {moduleCount === 0
                ? "今天还没有记录 ✨"
                : `已记录 ${moduleCount}/6 个模块 🌟`}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-star-yellow/30 px-3 py-1.5">
            <span className="star-highlight text-sm">⭐</span>
            <span className="text-sm font-bold text-text-primary">{moduleCount}</span>
          </div>
        </div>
      </div>

      {/* ===== 六大模块网格 ===== */}
      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            type="button"
            className={`card-y2k ${mod.color}/40 flex cursor-pointer flex-col items-start gap-2 text-left active:scale-[0.97]`}
            onClick={() => handleNav(`/${mod.id}`)}
          >
            <span className="text-3xl">{mod.emoji}</span>
            <div>
              <p className="font-bold text-text-primary">{mod.label}</p>
              <p className="text-xs text-text-secondary">{mod.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ===== 底部日历 + 报告入口 ===== */}
      <div className="mt-auto space-y-2 pt-6">
        <button
          type="button"
          className="card-y2k flex w-full cursor-pointer items-center justify-between bg-gradient-to-r from-mint-light/50 to-ice-light/50 active:scale-[0.98]"
          onClick={() => handleNav("/calendar")}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="font-semibold text-text-primary">日历 · 历史记录</span>
          </div>
          <span className="text-lg">→</span>
        </button>
        <button
          type="button"
          className="card-y2k flex w-full cursor-pointer items-center justify-between bg-gradient-to-r from-pink-light/50 to-lavender-light/50 active:scale-[0.98]"
          onClick={() => handleNav("/report")}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <span className="font-semibold text-text-primary">今日报告</span>
          </div>
          <span className="text-lg">→</span>
        </button>
      </div>
    </div>
  );
}