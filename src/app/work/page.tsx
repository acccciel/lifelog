"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleLayout from "@/components/ModuleLayout";
import TimePicker from "@/components/TimePicker";
import TodayRecords from "@/components/TodayRecords";
import { supabase } from "@/lib/supabase";
import { getToday, getNowISO, getDateFromISO } from "@/lib/services";

const EFFICIENCY_OPTIONS = [
  { score: 5, emoji: "🔥", label: "效率爆棚" },
  { score: 4, emoji: "💪", label: "还不错" },
  { score: 3, emoji: "😐", label: "一般般" },
  { score: 2, emoji: "😵", label: "有点摸鱼" },
  { score: 1, emoji: "🥀", label: "啥也没干" },
];

const WORK_TAGS = ["开会", "写代码", "写文档", "设计", "沟通", "汇报", "规划", "复盘"];
const IMPACT_OPTIONS = ["😊 心情变好了", "😐 没什么影响", "😢 有点压力", "😤 遇到困难", "🎉 很有成就感"];

export default function WorkPage() {
  const router = useRouter();
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [efficiency, setEfficiency] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [impact, setImpact] = useState("");
  const [recordedAt, setRecordedAt] = useState(getNowISO());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadToday = useCallback(async () => {
    const { data } = await supabase.from("work_logs").select("*").eq("record_date", getToday()).order("recorded_at", { ascending: true });
    if (data) setTodayRecords(data);
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const resetForm = () => {
    setContent(""); setEfficiency(0); setTags([]); setImpact("");
    setRecordedAt(getNowISO()); setEditingId(null);
  };

  const handleEdit = (r: any) => {
    setContent(r.content || ""); setEfficiency(r.efficiency_score || 0);
    setTags([]); setImpact(r.impact_on_mood || "");
    setRecordedAt(r.recorded_at || getNowISO()); setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (r: any) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await supabase.from("work_logs").delete().eq("id", r.id);
    loadToday();
    if (editingId === r.id) resetForm();
  };

  const handleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSave = async () => {
    if (!content.trim()) { alert("请写一点工作内容～"); return; }
    setSaving(true);
    const record = { record_date: getDateFromISO(recordedAt), content, efficiency_score: efficiency || undefined, impact_on_mood: impact || tags.join(" · "), recorded_at: recordedAt };

    let error: any = null;
    if (editingId) {
      ({ error } = await supabase.from("work_logs").update(record).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("work_logs").insert(record));
    }
    setSaving(false);
    if (error) { alert("保存失败：" + error.message); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); resetForm(); loadToday(); }, 1000);
  };

  return (
    <ModuleLayout emoji="💼" title="工作记录" subtitle="今天做了什么工作？" gradient="bg-ice-light/50">
      {editingId && <p className="mb-3 text-xs text-pink-deep">✏️ 正在编辑记录</p>}

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">今日效率</p>
      <div className="mb-5 flex justify-between gap-1">
        {EFFICIENCY_OPTIONS.map((opt) => (
          <button key={opt.score} type="button"
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-center transition-all ${efficiency === opt.score ? "scale-105 bg-white shadow-md" : "bg-white/40 hover:bg-white/60"}`}
            onClick={() => setEfficiency(opt.score)}>
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-[10px] text-text-secondary">{opt.label}</span>
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">工作类型</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {WORK_TAGS.map((tag) => (
          <button key={tag} type="button"
            className={`rounded-full px-3 py-1 text-xs transition-all ${tags.includes(tag) ? "bg-ice-medium text-text-primary" : "bg-white/50 text-text-secondary hover:bg-white"}`}
            onClick={() => handleTag(tag)}>{tag}</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">工作内容</p>
      <textarea className="mb-4 w-full resize-none rounded-xl border border-white/50 bg-white/60 p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-ice-light focus:outline-none" rows={2}
        placeholder="今天主要做了什么？…" value={content} onChange={(e) => setContent(e.target.value)} />

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">工作对你的影响</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {IMPACT_OPTIONS.map((imp) => (
          <button key={imp} type="button"
            className={`rounded-full px-3 py-1 text-xs transition-all ${impact === imp ? "bg-ice-medium text-text-primary" : "bg-white/50 text-text-secondary hover:bg-white"}`}
            onClick={() => setImpact(imp)}>{imp}</button>
        ))}
      </div>

      <div className="mb-5">
        <TimePicker initialTime={recordedAt} onChange={setRecordedAt} label="工作时间" />
      </div>

      <div className="flex gap-2">
        <button type="button" disabled={saving}
          className={`flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all ${saved ? "bg-mint-light" : "bg-gradient-to-r from-ice-light to-lavender-light shadow-md active:scale-[0.98] disabled:opacity-50"}`}
          onClick={handleSave}>
          {saving ? "保存中..." : saved ? "✓ 已保存 ✨" : editingId ? "更新记录" : "保存记录"}
        </button>
        {editingId && (
          <button type="button" className="rounded-full bg-white/60 px-4 py-3 text-sm text-text-secondary shadow-sm" onClick={resetForm}>取消</button>
        )}
      </div>

      <TodayRecords records={todayRecords}
        renderSummary={(r) => <p className="text-sm text-text-primary">{r.content}{r.efficiency_score ? ` · 🔥${r.efficiency_score}/5` : ""}</p>}
        onEdit={handleEdit} onDelete={handleDelete} />
    </ModuleLayout>
  );
}