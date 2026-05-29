"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getMonthData, getToday } from "@/lib/services";
import type { MonthDayInfo } from "@/lib/services";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function formatMonthTitle(year: number, month: number) {
  return `${year}年 ${month}月`;
}

export default function CalendarPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<MonthDayInfo[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [highlightedCount, setHighlightedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    loadMonth(year, month);
  }, [user, authLoading, year, month]);

  const loadMonth = async (y: number, m: number) => {
    setLoading(true);
    const data = await getMonthData(y, m);
    setDays(data.days);
    setTotalRecords(data.totalRecords);
    setHighlightedCount(data.highlightedCount);
    setLoading(false);
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const goToday = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  // 本月1号是星期几（0=日，1=一...）
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=日
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 转为周一=0

  const todayStr = getToday();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  if (authLoading) return null;

  return (
    <div className="mobile-frame min-h-dvh px-5 pb-10 pt-4">
      {/* 顶部 */}
      <div className="mb-6 flex items-center gap-3">
        <button type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-base shadow-sm active:scale-90"
          onClick={() => router.back()}>
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary">📅 历史记录</h1>
          <p className="text-xs text-text-secondary">回顾你的每一天</p>
        </div>
      </div>

      {/* 月导航 */}
      <div className="card-y2k glass mb-5">
        <div className="mb-4 flex items-center justify-between">
          <button type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-sm text-text-secondary shadow-sm active:scale-90"
            onClick={prevMonth}>
            ◀
          </button>
          <button type="button"
            className="text-lg font-bold text-text-primary"
            onClick={goToday}>
            {formatMonthTitle(year, month)}
          </button>
          <button type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-sm text-text-secondary shadow-sm active:scale-90"
            onClick={nextMonth}>
            ▶
          </button>
        </div>

        {/* 统计 */}
        <div className="mb-4 flex items-center justify-center gap-4 text-xs text-text-secondary">
          <span>📋 记录 {totalRecords} 天</span>
          {highlightedCount > 0 && <span>⭐ 高亮 {highlightedCount} 天</span>}
        </div>

        {/* 星期 */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="py-1 text-center text-[10px] font-medium text-text-secondary">
              {w}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-text-secondary">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* 空白占位 */}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* 每个日期 */}
            {days.map((d) => {
              const isToday = d.date === todayStr;
              const hasRec = d.hasRecords || d.isHighlighted;

              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={!hasRec}
                  className={`relative flex flex-col items-center rounded-xl py-2 text-center transition-all
                    ${!hasRec ? "opacity-30" : "active:scale-90 cursor-pointer hover:bg-white/60"}
                    ${isToday ? "ring-2 ring-pink-light" : ""}
                    ${d.isHighlighted ? "bg-star-yellow/20" : "bg-white/40"}
                  `}
                  onClick={() => {
                    if (hasRec) router.push(`/day?date=${d.date}`);
                  }}
                >
                  <span className={`text-sm font-medium ${
                    d.isHighlighted ? "text-pink-deep" : "text-text-primary"
                  }`}>
                    {d.day}
                  </span>

                  {/* 评分或标记点 */}
                  {d.isHighlighted ? (
                    <span className="star-highlight text-[10px]">⭐</span>
                  ) : hasRec ? (
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-pink-light" />
                  ) : (
                    <span className="mt-0.5 h-1.5 w-1.5" />
                  )}

                  {/* 系统评分小字 */}
                  {d.systemScore !== null && d.systemScore >= 7 && (
                    <span className="text-[8px] font-bold text-star-yellow">{d.systemScore}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 图例 */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-pink-light" /> 有记录
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[10px]">⭐</span> 高亮好日子
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block rounded-full border border-pink-light px-1 text-[8px]">今天</span>
          </span>
        </div>
      </div>

      {/* 提示 */}
      <div className="text-center text-xs text-text-secondary/50">
        点击有记录的日期查看详细内容
      </div>
    </div>
  );
}