"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  getToday,
  getDaySummary,
  upsertDailyRecord,
  calcSystemScore,
  getDayRecords,
} from "@/lib/services";
import type { DaySummary } from "@/lib/services";

function getTodayStr() {
  const d = new Date();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selfScore, setSelfScore] = useState(0);
  const [summaryNote, setSummaryNote] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [systemScore, setSystemScore] = useState(0);
  const [doneModules, setDoneModules] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }

    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    const s = await getDaySummary(getToday());
    setSummary(s);

    // 计算哪些模块有记录
    const done: string[] = [];
    if (s.meals.length > 0) done.push("meal");
    if (s.moods.length > 0) done.push("mood");
    if (s.exercises.length > 0) done.push("exercise");
    if (s.work_logs.length > 0) done.push("work");
    if (s.study_logs.length > 0) done.push("study");
    if (s.sleep_records.length > 0) done.push("sleep");
    setDoneModules(done);

    // 计算评分
    const sysScore = calcSystemScore(s);
    setSystemScore(sysScore);

    // 读取已有自评
    if (s.daily_record) {
      setSelfScore(s.daily_record.self_score || 0);
      setSummaryNote(s.daily_record.summary_note || "");
      setIsHighlighted(s.daily_record.is_highlighted || false);
    }

    setLoading(false);
  };

  const handleSaveReport = async () => {
    setSaving(true);

    const { error } = await supabase.from("daily_records").upsert(
      {
        record_date: getToday(),
        self_score: selfScore,
        system_score: systemScore,
        summary_note: summaryNote,
        is_highlighted: isHighlighted,
      },
      { onConflict: "user_id, record_date" },
    );

    setSaving(false);

    if (error) {
      alert("保存失败：" + error.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading || authLoading || !summary) {
    return (
      <div className="mobile-frame flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">📝</span>
          <p className="mt-3 text-sm text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  const hasData = doneModules.length > 0;

  return (
    <div className="mobile-frame min-h-dvh px-5 pb-10 pt-4">
      {/* ===== 顶部返回 ===== */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-base shadow-sm active:scale-90"
          onClick={() => router.back()}
        >
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary">📝 今日报告</h1>
          <p className="text-xs text-text-secondary">{getTodayStr()}</p>
        </div>
      </div>

      {!hasData ? (
        /* ===== 无记录状态 ===== */
        <div className="card-y2k glass flex flex-col items-center justify-center py-16">
          <span className="mb-4 text-6xl">📋</span>
          <p className="mb-2 text-lg font-semibold text-text-primary">今天还没有记录</p>
          <p className="mb-6 text-center text-sm text-text-secondary">
            去各个模块记录今天的状态吧<br />记录完后这里会生成你的专属报告 ✨
          </p>
          <div className="mb-6 flex gap-3">
            {["🍚", "😊", "🏃", "💼", "📚", "😴"].map((e, i) => (
              <span key={i} className="text-2xl">{e}</span>
            ))}
          </div>
          <button
            type="button"
            className="rounded-full bg-gradient-to-r from-pink-light to-lavender-light px-6 py-2 text-sm font-semibold text-white shadow-md active:scale-[0.98]"
            onClick={() => router.push("/")}
          >
            去记录 →
          </button>
        </div>
      ) : (
        /* ===== 有记录 - 报告内容 ===== */
        <div className="flex flex-col gap-4">
          {/* 评分总览 */}
          <div className="card-y2k glass">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
              今日评分
            </p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <span className="star-highlight text-2xl">⭐</span>
                  <span className="ml-1 text-4xl font-bold text-star-yellow">
                    {systemScore.toFixed(1)}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-text-secondary">系统评分</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <span className="text-2xl">❤️</span>
                  <span className="ml-1 text-4xl font-bold text-pink-deep">
                    {selfScore || "?"}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-text-secondary">你的评分</p>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-text-secondary">
              已记录 {doneModules.length}/6 个模块
            </p>
          </div>

          {/* 各模块汇总 */}
          {summary.meals.length > 0 && (
            <ModuleSection emoji="🍚" title="饮食" count={summary.meals.length} color="bg-cream-light/60">
              {summary.meals.map((m: any, i: number) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-pink-deep">{m.meal_type}</span>
                    <span className="text-[10px] text-text-secondary">{formatTime(m.recorded_at)}</span>
                  </div>
                  <p className="text-sm text-text-primary">{m.food_name || m.description || "已记录"}</p>
                </div>
              ))}
            </ModuleSection>
          )}

          {summary.moods.length > 0 && (
            <ModuleSection emoji="😊" title="心情" count={summary.moods.length} color="bg-pink-light/30">
              {summary.moods.map((m: any, i: number) => (
                <div key={i} className="mb-2 flex items-center gap-3 last:mb-0">
                  <span className="text-2xl">{m.mood_emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{m.mood_label}</span>
                      <span className="text-xs text-text-secondary">{m.mood_score}/5</span>
                    </div>
                    {m.note && <p className="text-xs text-text-secondary">{m.note}</p>}
                  </div>
                  <span className="text-[10px] text-text-secondary">{formatTime(m.recorded_at)}</span>
                </div>
              ))}
            </ModuleSection>
          )}

          {summary.exercises.length > 0 && (
            <ModuleSection emoji="🏃" title="运动" count={summary.exercises.length} color="bg-mint-light/40">
              {summary.exercises.map((e: any, i: number) => (
                <div key={i} className="mb-2 flex items-center justify-between last:mb-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{e.exercise_type}</p>
                    <p className="text-xs text-text-secondary">
                      {e.duration_minutes}分钟
                      {e.intensity ? ` · ${e.intensity === "low" ? "低强度" : e.intensity === "mid" ? "中强度" : "高强度"}` : ""}
                      {e.feeling ? ` · ${e.feeling}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] text-text-secondary">{formatTime(e.recorded_at)}</span>
                </div>
              ))}
            </ModuleSection>
          )}

          {summary.work_logs.length > 0 && (
            <ModuleSection emoji="💼" title="工作" count={summary.work_logs.length} color="bg-ice-light/40">
              {summary.work_logs.map((w: any, i: number) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{w.content}</span>
                    <span className="text-[10px] text-text-secondary">{formatTime(w.recorded_at)}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-text-secondary">
                    {w.efficiency_score && <span>效率：{w.efficiency_score}/5</span>}
                    {w.impact_on_mood && <span>· {w.impact_on_mood}</span>}
                  </div>
                </div>
              ))}
            </ModuleSection>
          )}

          {summary.study_logs.length > 0 && (
            <ModuleSection emoji="📚" title="学习" count={summary.study_logs.length} color="bg-lavender-light/30">
              {summary.study_logs.map((s: any, i: number) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{s.content}</span>
                    <span className="text-[10px] text-text-secondary">{formatTime(s.recorded_at)}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-text-secondary">
                    {s.category && <span>{s.category}</span>}
                    {s.duration_minutes > 0 && <span>· {s.duration_minutes}分钟</span>}
                  </div>
                </div>
              ))}
            </ModuleSection>
          )}

          {summary.sleep_records.length > 0 && (
            <ModuleSection emoji="😴" title="睡眠" count={summary.sleep_records.length} color="bg-ice-light/40">
              {summary.sleep_records.map((s: any, i: number) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {s.bedtime?.slice(0, 5)} → {s.wake_time?.slice(0, 5)}
                    </span>
                    <span className="text-xs text-text-secondary">质量：{s.quality_score}/5</span>
                  </div>
                  {s.note && <p className="text-xs text-text-secondary">{s.note}</p>}
                </div>
              ))}
            </ModuleSection>
          )}

          {/* 未记录的模块 */}
          {doneModules.length < 6 && (
            <div className="card-y2k bg-white/50">
              <p className="mb-2 text-xs font-medium text-text-secondary">还没记录的模块</p>
              <div className="flex flex-wrap gap-2">
                {!doneModules.includes("meal") && <MissedBadge emoji="🍚" label="饮食" />}
                {!doneModules.includes("mood") && <MissedBadge emoji="😊" label="心情" />}
                {!doneModules.includes("exercise") && <MissedBadge emoji="🏃" label="运动" />}
                {!doneModules.includes("work") && <MissedBadge emoji="💼" label="工作" />}
                {!doneModules.includes("study") && <MissedBadge emoji="📚" label="学习" />}
                {!doneModules.includes("sleep") && <MissedBadge emoji="😴" label="睡眠" />}
              </div>
            </div>
          )}

          {/* 自评 + 高亮 */}
          <div className="card-y2k glass">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
              给自己的评价
            </p>

            {/* 自评分 */}
            <div className="mb-4 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    selfScore >= n
                      ? "scale-110 bg-pink-light text-white shadow-md"
                      : "bg-white/50 text-text-secondary hover:bg-white"
                  }`}
                  onClick={() => setSelfScore(n === selfScore ? 0 : n)}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* 今日总结 */}
            <textarea
              className="mb-4 w-full resize-none rounded-xl border border-white/50 bg-white/60 p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-pink-light focus:outline-none"
              rows={2}
              placeholder="今天过得怎么样？写一句总结吧..."
              value={summaryNote}
              onChange={(e) => setSummaryNote(e.target.value)}
            />

            {/* 高亮标注 */}
            <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl bg-white/40 p-3 transition-all hover:bg-white/60">
              <input
                type="checkbox"
                checked={isHighlighted}
                onChange={(e) => setIsHighlighted(e.target.checked)}
                className="h-5 w-5 accent-pink-deep"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  ⭐ 标记为高亮好日子
                </p>
                <p className="text-xs text-text-secondary">
                  高亮的日期会在日历中突出展示
                </p>
              </div>
            </label>

            {/* 保存 */}
            <button
              type="button"
              disabled={saving}
              className={`w-full rounded-full py-3 text-sm font-semibold text-white transition-all ${
                saved
                  ? "bg-mint-light"
                  : "bg-gradient-to-r from-pink-light to-lavender-light shadow-md active:scale-[0.98] disabled:opacity-50"
              }`}
              onClick={handleSaveReport}
            >
              {saving ? "保存中..." : saved ? "✓ 已保存 ✨" : "保存今日报告"}
            </button>
          </div>

          {/* 记录时间线 */}
          <div className="card-y2k bg-white/50">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
              今日时间线
            </p>
            <Timeline records={[
              ...summary.meals.map((m: any) => ({ time: m.recorded_at, text: `🍚 ${m.meal_type}：${m.food_name || "已记录"}`, emoji: "🍚" })),
              ...summary.moods.map((m: any) => ({ time: m.recorded_at, text: `😊 心情：${m.mood_emoji} ${m.mood_label}`, emoji: "😊" })),
              ...summary.exercises.map((e: any) => ({ time: e.recorded_at, text: `🏃 运动：${e.exercise_type} ${e.duration_minutes}分钟`, emoji: "🏃" })),
              ...summary.work_logs.map((w: any) => ({ time: w.recorded_at, text: `💼 工作：${w.content}`, emoji: "💼" })),
              ...summary.study_logs.map((s: any) => ({ time: s.recorded_at, text: `📚 学习：${s.content}`, emoji: "📚" })),
              ...summary.sleep_records.map((s: any) => ({ time: s.recorded_at, text: `😴 睡眠：${s.bedtime?.slice(0, 5)}→${s.wake_time?.slice(0, 5)}`, emoji: "😴" })),
            ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== 子组件 ===== */

function ModuleSection({
  emoji,
  title,
  count,
  color,
  children,
}: {
  emoji: string;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`card-y2k ${color}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-semibold text-text-primary">{title}</span>
        </div>
        <span className="rounded-full bg-white/50 px-2 py-0.5 text-[10px] text-text-secondary">
          {count}条记录
        </span>
      </div>
      {children}
    </div>
  );
}

function MissedBadge({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="rounded-full bg-white/50 px-3 py-1 text-xs text-text-secondary">
      {emoji} {label}
    </span>
  );
}

function Timeline({ records }: { records: { time: string; text: string; emoji: string }[] }) {
  if (records.length === 0) return <p className="text-xs text-text-secondary">暂无记录</p>;

  return (
    <div className="relative pl-4">
      {/* 竖线 */}
      <div className="absolute left-[7px] top-1 h-[calc(100%-8px)] w-0.5 rounded-full bg-gradient-to-b from-pink-light via-mint-light to-ice-light" />

      {records.map((r, i) => (
        <div key={i} className="relative mb-3 flex items-start gap-3 last:mb-0">
          <div className="absolute -left-[13px] top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="text-[8px]">{r.emoji}</span>
          </div>
          <div className="ml-4 flex-1">
            <span className="text-[10px] text-text-secondary">{formatTime(r.time)}</span>
            <p className="text-xs text-text-primary">{r.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}