"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleLayout from "@/components/ModuleLayout";
import TimePicker from "@/components/TimePicker";
import TodayRecords from "@/components/TodayRecords";
import { supabase } from "@/lib/supabase";
import { getToday, getNowISO, getDateFromISO } from "@/lib/services";

const MOOD_OPTIONS = [
  { emoji: "🥰", label: "超开心", score: 5 },
  { emoji: "😊", label: "开心", score: 4 },
  { emoji: "😐", label: "一般", score: 3 },
  { emoji: "😢", label: "难过", score: 2 },
  { emoji: "😡", label: "生气", score: 1 },
  { emoji: "😴", label: "疲惫", score: 2 },
];

const MOOD_TAGS = ["平静", "兴奋", "焦虑", "感恩", "孤独", "满足", "期待", "沮丧", "放松", "勇敢"];

export default function MoodPage() {
  const router = useRouter();
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodEmoji, setMoodEmoji] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [recordedAt, setRecordedAt] = useState(getNowISO());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadToday = useCallback(async () => {
    const { data } = await supabase.from("moods").select("*").eq("record_date", getToday()).order("recorded_at", { ascending: true });
    if (data) setTodayRecords(data);
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const resetForm = () => {
    setSelectedMood(null); setMoodEmoji(""); setSelectedTags([]);
    setNote(""); setRecordedAt(getNowISO()); setEditingId(null);
  };

  const handleEdit = (r: any) => {
    const idx = MOOD_OPTIONS.findIndex((m) => m.emoji === r.mood_emoji);
    setSelectedMood(idx >= 0 ? idx : null);
    setMoodEmoji(r.mood_emoji || "");
    setSelectedTags([]);
    setNote(r.note || "");
    setRecordedAt(r.recorded_at || getNowISO());
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (r: any) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await supabase.from("moods").delete().eq("id", r.id);
    loadToday();
    if (editingId === r.id) resetForm();
  };

  const handleMoodSelect = (idx: number, emoji: string) => {
    setSelectedMood(idx);
    setMoodEmoji(emoji);
  };

  const handleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSave = async () => {
    if (selectedMood === null) { alert("请选择一个心情～"); return; }
    setSaving(true);
    const mood = MOOD_OPTIONS[selectedMood];
    const record = { record_date: getDateFromISO(recordedAt), mood_emoji: moodEmoji, mood_label: mood.label, mood_score: mood.score, note: [note, ...selectedTags].filter(Boolean).join(" · "), recorded_at: recordedAt };

    let error: any = null;
    if (editingId) {
      ({ error } = await supabase.from("moods").update(record).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("moods").insert(record));
    }
    setSaving(false);
    if (error) { alert("保存失败：" + error.message); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); resetForm(); loadToday(); }, 1000);
  };

  return (
    <ModuleLayout emoji="😊" title="心情记录" subtitle="今天感觉怎么样？" gradient="bg-pink-light/30">
      {editingId && <p className="mb-3 text-xs text-pink-deep">✏️ 正在编辑记录</p>}

      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">当前心情</p>
      <div className="mb-5 flex justify-center gap-3">
        {MOOD_OPTIONS.map((mood, idx) => (
          <button key={mood.label} type="button"
            className={`flex flex-col items-center gap-1 rounded-2xl p-3 transition-all ${selectedMood === idx ? "scale-110 bg-white shadow-lg" : "scale-100 bg-white/40 hover:scale-105"}`}
            onClick={() => handleMoodSelect(idx, mood.emoji)}>
            <span className="text-3xl">{mood.emoji}</span>
            <span className="text-[10px] text-text-secondary">{mood.label}</span>
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">标签（可选）</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {MOOD_TAGS.map((tag) => (
          <button key={tag} type="button"
            className={`rounded-full px-3 py-1 text-xs transition-all ${selectedTags.includes(tag) ? "bg-pink-deep text-white" : "bg-white/50 text-text-secondary hover:bg-white"}`}
            onClick={() => handleTag(tag)}>{tag}</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">心情笔记</p>
      <textarea className="mb-4 w-full resize-none rounded-xl border border-white/50 bg-white/60 p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-pink-light focus:outline-none" rows={2}
        placeholder="为什么会这样感觉？发生了什么？…" value={note} onChange={(e) => setNote(e.target.value)} />

      <div className="mb-5">
        <TimePicker initialTime={recordedAt} onChange={setRecordedAt} label="记录时间" />
      </div>

      <div className="flex gap-2">
        <button type="button" disabled={saving}
          className={`flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all ${saved ? "bg-mint-light" : "bg-gradient-to-r from-pink-light to-lavender-light shadow-md active:scale-[0.98] disabled:opacity-50"}`}
          onClick={handleSave}>
          {saving ? "保存中..." : saved ? "✓ 已保存 ✨" : editingId ? "更新记录" : "保存记录"}
        </button>
        {editingId && (
          <button type="button" className="rounded-full bg-white/60 px-4 py-3 text-sm text-text-secondary shadow-sm" onClick={resetForm}>取消</button>
        )}
      </div>

      <TodayRecords records={todayRecords}
        renderSummary={(r) => <p className="text-sm text-text-primary">{r.mood_emoji} {r.mood_label} · {r.mood_score}/5</p>}
        onEdit={handleEdit} onDelete={handleDelete} />
    </ModuleLayout>
  );
}