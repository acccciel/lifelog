"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleLayout from "@/components/ModuleLayout";
import TimePicker from "@/components/TimePicker";
import TodayRecords from "@/components/TodayRecords";
import { supabase } from "@/lib/supabase";
import { getToday, getNowISO, getDateFromISO, makeTodayISO } from "@/lib/services";

const STUDY_CATEGORIES = [
  { emoji: "📖", label: "读书" }, { emoji: "💻", label: "编程" },
  { emoji: "🎨", label: "设计" }, { emoji: "🌐", label: "语言" },
  { emoji: "🎵", label: "音乐" }, { emoji: "📝", label: "考证" },
  { emoji: "🎬", label: "看课程" }, { emoji: "🧠", label: "思维训练" },
];
const DURATION_QUICK = ["15", "30", "45", "60", "90", "120"];

export default function StudyPage() {
  const router = useRouter();
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [content, setContent] = useState("");
  const [recordedAt, setRecordedAt] = useState(getNowISO());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadToday = useCallback(async () => {
    const { data } = await supabase.from("study_logs").select("*").eq("record_date", getToday()).order("recorded_at", { ascending: true });
    if (data) setTodayRecords(data);
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const resetForm = () => {
    setCategory(""); setDuration(""); setContent("");
    setRecordedAt(getNowISO()); setEditingId(null);
  };

  const handleEdit = (r: any) => {
    setCategory(r.category || ""); setDuration(String(r.duration_minutes || ""));
    setContent(r.content || ""); setRecordedAt(r.recorded_at || getNowISO());
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (r: any) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await supabase.from("study_logs").delete().eq("id", r.id);
    loadToday();
    if (editingId === r.id) resetForm();
  };

  const handleSave = async () => {
    if (!content.trim()) { alert("请写一下学了什么～"); return; }
    setSaving(true);
    const record = { record_date: getDateFromISO(recordedAt), content, duration_minutes: parseInt(duration) || 0, category, recorded_at: recordedAt };

    let error: any = null;
    if (editingId) {
      ({ error } = await supabase.from("study_logs").update(record).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("study_logs").insert(record));
    }
    setSaving(false);
    if (error) { alert("保存失败：" + error.message); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); resetForm(); loadToday(); }, 1000);
  };

  return (
    <ModuleLayout emoji="📚" title="学习记录" subtitle="今天学了什么新东西？" gradient="bg-lavender-light/40">
      {editingId && <p className="mb-3 text-xs text-pink-deep">✏️ 正在编辑记录</p>}

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">学习类型</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {STUDY_CATEGORIES.map((cat) => (
          <button key={cat.label} type="button"
            className={`rounded-xl border px-3 py-2 text-sm transition-all ${category === cat.label ? "border-lavender-light bg-lavender-light/30 text-text-primary shadow-sm" : "border-white/50 bg-white/40 text-text-secondary hover:border-lavender-light/50"}`}
            onClick={() => setCategory(cat.label)}>{cat.emoji} {cat.label}</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">学习时长</p>
      <div className="mb-5 flex items-center gap-2">
        <input type="number" className="w-24 rounded-xl border border-white/50 bg-white/60 px-4 py-2 text-center text-sm text-text-primary focus:border-lavender-light focus:outline-none"
          placeholder="30" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
        <span className="text-sm text-text-secondary">分钟</span>
        {DURATION_QUICK.map((t) => (
          <button key={t} type="button"
            className={`rounded-full px-3 py-1 text-xs transition-all ${duration === t ? "bg-lavender-light text-white" : "bg-white/50 text-text-secondary hover:bg-white"}`}
            onClick={() => setDuration(t)}>{t}分</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">学了什么</p>
      <textarea className="mb-5 w-full resize-none rounded-xl border border-white/50 bg-white/60 p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-lavender-light focus:outline-none" rows={3}
        placeholder="今天学了什么内容？有什么收获？…" value={content} onChange={(e) => setContent(e.target.value)} />

      <div className="mb-5">
        <TimePicker initialTime={recordedAt} onChange={setRecordedAt} label="学习时间" />
      </div>

      <div className="flex gap-2">
        <button type="button" disabled={saving}
          className={`flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all ${saved ? "bg-mint-light" : "bg-gradient-to-r from-lavender-light to-pink-light shadow-md active:scale-[0.98] disabled:opacity-50"}`}
          onClick={handleSave}>
          {saving ? "保存中..." : saved ? "✓ 已保存 ✨" : editingId ? "更新记录" : "保存记录"}
        </button>
        {editingId && (
          <button type="button" className="rounded-full bg-white/60 px-4 py-3 text-sm text-text-secondary shadow-sm" onClick={resetForm}>取消</button>
        )}
      </div>

      <TodayRecords records={todayRecords}
        renderSummary={(r) => <p className="text-sm text-text-primary">{r.category ? `${r.category}：` : ""}{r.content}{r.duration_minutes > 0 ? ` · ${r.duration_minutes}分钟` : ""}</p>}
        onEdit={handleEdit} onDelete={handleDelete} />
    </ModuleLayout>
  );
}