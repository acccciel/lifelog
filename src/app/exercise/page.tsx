"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleLayout from "@/components/ModuleLayout";
import TimePicker from "@/components/TimePicker";
import TodayRecords from "@/components/TodayRecords";
import { supabase } from "@/lib/supabase";
import { getToday, getNowISO, getDateFromISO } from "@/lib/services";

const EXERCISE_TYPES = [
  { emoji: "🏃", name: "跑步" }, { emoji: "🚴", name: "骑行" },
  { emoji: "🧘", name: "瑜伽" }, { emoji: "🏋️", name: "健身" },
  { emoji: "🏊", name: "游泳" }, { emoji: "🚶", name: "散步" },
  { emoji: "⛰️", name: "爬山" }, { emoji: "💃", name: "跳舞" },
  { emoji: "⚽", name: "球类" }, { emoji: "🎮", name: "体感游戏" },
];

const INTENSITY_OPTIONS = [
  { label: "😌 低强度", value: "low" },
  { label: "😤 中强度", value: "mid" },
  { label: "🥵 高强度", value: "high" },
];

const FEEL_OPTIONS = ["💪 充满活力", "😊 心情舒畅", "😌 放松", "😴 有点累", "🤕 肌肉酸痛"];

export default function ExercisePage() {
  const router = useRouter();
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [exerciseType, setExerciseType] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("");
  const [feel, setFeel] = useState("");
  const [recordedAt, setRecordedAt] = useState(getNowISO());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadToday = useCallback(async () => {
    const { data } = await supabase.from("exercises").select("*").eq("record_date", getToday()).order("recorded_at", { ascending: true });
    if (data) setTodayRecords(data);
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const resetForm = () => {
    setExerciseType(""); setDuration(""); setIntensity(""); setFeel("");
    setRecordedAt(getNowISO()); setEditingId(null);
  };

  const handleEdit = (r: any) => {
    setExerciseType(r.exercise_type || ""); setDuration(String(r.duration_minutes || ""));
    setIntensity(r.intensity || ""); setFeel(r.feeling || "");
    setRecordedAt(r.recorded_at || getNowISO()); setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (r: any) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await supabase.from("exercises").delete().eq("id", r.id);
    loadToday();
    if (editingId === r.id) resetForm();
  };

  const handleSave = async () => {
    if (!exerciseType) { alert("请选择运动类型～"); return; }
    if (!duration) { alert("请填写运动时长～"); return; }
    setSaving(true);
    const record = { record_date: getDateFromISO(recordedAt), exercise_type: exerciseType, duration_minutes: parseInt(duration) || 0, intensity, feeling: feel, recorded_at: recordedAt };

    let error: any = null;
    if (editingId) {
      ({ error } = await supabase.from("exercises").update(record).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("exercises").insert(record));
    }
    setSaving(false);
    if (error) { alert("保存失败：" + error.message); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); resetForm(); loadToday(); }, 1000);
  };

  return (
    <ModuleLayout emoji="🏃" title="运动记录" subtitle="今天动了多少？" gradient="bg-mint-light/50">
      {editingId && <p className="mb-3 text-xs text-pink-deep">✏️ 正在编辑记录</p>}

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">运动类型</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {EXERCISE_TYPES.map((ex) => (
          <button key={ex.name} type="button"
            className={`rounded-xl border px-3 py-2 text-sm transition-all ${exerciseType === ex.name ? "border-mint-light bg-mint-light/30 text-text-primary shadow-sm" : "border-white/50 bg-white/40 text-text-secondary hover:border-mint-light/50"}`}
            onClick={() => setExerciseType(ex.name)}>{ex.emoji} {ex.name}</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">运动时长</p>
      <div className="mb-5 flex items-center gap-2">
        <input type="number" className="w-24 rounded-xl border border-white/50 bg-white/60 px-4 py-2 text-center text-sm text-text-primary focus:border-mint-light focus:outline-none"
          placeholder="30" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
        <span className="text-sm text-text-secondary">分钟</span>
        {["15", "30", "45", "60"].map((t) => (
          <button key={t} type="button"
            className={`rounded-full px-3 py-1 text-xs transition-all ${duration === t ? "bg-mint-light text-white" : "bg-white/50 text-text-secondary hover:bg-white"}`}
            onClick={() => setDuration(t)}>{t}分</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">运动强度</p>
      <div className="mb-5 flex gap-2">
        {INTENSITY_OPTIONS.map((int) => (
          <button key={int.value} type="button"
            className={`flex-1 rounded-xl py-2 text-center text-sm transition-all ${intensity === int.value ? "bg-mint-light text-white shadow-sm" : "bg-white/50 text-text-secondary hover:bg-white"}`}
            onClick={() => setIntensity(int.value)}>{int.label}</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">运动感受</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {FEEL_OPTIONS.map((f) => (
          <button key={f} type="button"
            className={`rounded-full px-3 py-1 text-xs transition-all ${feel === f ? "bg-mint-light text-white" : "bg-white/50 text-text-secondary hover:bg-white"}`}
            onClick={() => setFeel(f)}>{f}</button>
        ))}
      </div>

      <div className="mb-5">
        <TimePicker initialTime={recordedAt} onChange={setRecordedAt} label="运动时间" />
      </div>

      <div className="flex gap-2">
        <button type="button" disabled={saving}
          className={`flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all ${saved ? "bg-mint-light" : "bg-gradient-to-r from-mint-light to-ice-light shadow-md active:scale-[0.98] disabled:opacity-50"}`}
          onClick={handleSave}>
          {saving ? "保存中..." : saved ? "✓ 已保存 ✨" : editingId ? "更新记录" : "保存记录"}
        </button>
        {editingId && (
          <button type="button" className="rounded-full bg-white/60 px-4 py-3 text-sm text-text-secondary shadow-sm" onClick={resetForm}>取消</button>
        )}
      </div>

      <TodayRecords records={todayRecords}
        renderSummary={(r) => <p className="text-sm text-text-primary">{r.exercise_type} · {r.duration_minutes}分钟{r.intensity ? ` · ${r.intensity === "low" ? "低强度" : r.intensity === "mid" ? "中强度" : "高强度"}` : ""}</p>}
        onEdit={handleEdit} onDelete={handleDelete} />
    </ModuleLayout>
  );
}