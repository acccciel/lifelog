"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleLayout from "@/components/ModuleLayout";
import TimePicker from "@/components/TimePicker";
import TodayRecords from "@/components/TodayRecords";
import { supabase } from "@/lib/supabase";
import { getToday, getNowISO, getDateFromISO, makeTodayISO } from "@/lib/services";

const QUALITY_OPTIONS = [
  { score: 5, emoji: "🥰", label: "睡得超好" },
  { score: 4, emoji: "😊", label: "还不错" },
  { score: 3, emoji: "😐", label: "一般般" },
  { score: 2, emoji: "😵", label: "没睡好" },
  { score: 1, emoji: "💀", label: "失眠了" },
];

export default function SleepPage() {
  const router = useRouter();
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [bedHour, setBedHour] = useState(23);
  const [bedMin, setBedMin] = useState(30);
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMin, setWakeMin] = useState(30);
  const [quality, setQuality] = useState(0);
  const [note, setNote] = useState("");
  // 睡眠默认时间用起床时间，这样今日报告里睡眠排最前面
  const [recordedAt, setRecordedAt] = useState(makeTodayISO(7, 0));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadToday = useCallback(async () => {
    const { data } = await supabase.from("sleep_records").select("*").eq("record_date", getToday()).order("recorded_at", { ascending: true });
    if (data) setTodayRecords(data);
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const resetForm = () => {
    setBedHour(23); setBedMin(30); setWakeHour(7); setWakeMin(30);
    setQuality(0); setNote(""); setRecordedAt(makeTodayISO(7, 0)); setEditingId(null);
  };

  const handleEdit = (r: any) => {
    const bed = (r.bedtime || "23:00").split(":").map(Number);
    const wake = (r.wake_time || "07:00").split(":").map(Number);
    setBedHour(bed[0] || 23); setBedMin(bed[1] || 30);
    setWakeHour(wake[0] || 7); setWakeMin(wake[1] || 30);
    setQuality(r.quality_score || 0); setNote(r.note || "");
    setRecordedAt(r.recorded_at || makeTodayISO(wake[0] || 7, wake[1] || 0));
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (r: any) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await supabase.from("sleep_records").delete().eq("id", r.id);
    loadToday();
    if (editingId === r.id) resetForm();
  };

  const calcDuration = () => {
    let bedtime = bedHour * 60 + bedMin;
    let waketime = wakeHour * 60 + wakeMin;
    if (waketime <= bedtime) waketime += 24 * 60;
    const diff = waketime - bedtime;
    return `${Math.floor(diff / 60)}小时${diff % 60 > 0 ? ` ${diff % 60}分钟` : ""}`;
  };

  // 当起床时间变化时，自动更新 recordedAt
  const handleWakeChange = (h: number, m: number) => {
    setWakeHour(h);
    setWakeMin(m);
    setRecordedAt(makeTodayISO(h, m));
  };

  const handleSave = async () => {
    if (!quality) { alert("请评价一下睡眠质量～"); return; }
    setSaving(true);
    const bedtime = `${String(bedHour).padStart(2, "0")}:${String(bedMin).padStart(2, "0")}`;
    const waketime = `${String(wakeHour).padStart(2, "0")}:${String(wakeMin).padStart(2, "0")}`;
    const record = { record_date: getDateFromISO(recordedAt), bedtime, wake_time: waketime, quality_score: quality, note, recorded_at: recordedAt };

    let error: any = null;
    if (editingId) {
      ({ error } = await supabase.from("sleep_records").update(record).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("sleep_records").insert(record));
    }
    setSaving(false);
    if (error) { alert("保存失败：" + error.message); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); resetForm(); loadToday(); }, 1000);
  };

  const timeOpts = (n: number) => Array.from({ length: n }, (v, k) => k);

  return (
    <ModuleLayout emoji="😴" title="睡眠记录" subtitle="昨晚睡得好吗？" gradient="bg-ice-light/50">
      {editingId && <p className="mb-3 text-xs text-pink-deep">✏️ 正在编辑记录</p>}

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">昨晚入睡时间</p>
      <div className="mb-5 flex items-center gap-2">
        <select className="rounded-xl border border-white/50 bg-white/60 px-3 py-2 text-sm text-text-primary focus:border-ice-light focus:outline-none" value={bedHour} onChange={(e) => setBedHour(Number(e.target.value))}>
          {timeOpts(24).map((i) => (<option key={i} value={i}>{String(i).padStart(2, "0")}</option>))}
        </select><span className="text-text-secondary">:</span>
        <select className="rounded-xl border border-white/50 bg-white/60 px-3 py-2 text-sm text-text-primary focus:border-ice-light focus:outline-none" value={bedMin} onChange={(e) => setBedMin(Number(e.target.value))}>
          {timeOpts(60).map((i) => (<option key={i} value={i}>{String(i).padStart(2, "0")}</option>))}
        </select>
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">今早起床时间</p>
      <div className="mb-5 flex items-center gap-2">
        <select className="rounded-xl border border-white/50 bg-white/60 px-3 py-2 text-sm text-text-primary focus:border-ice-light focus:outline-none" value={wakeHour} onChange={(e) => handleWakeChange(Number(e.target.value), wakeMin)}>
          {timeOpts(24).map((i) => (<option key={i} value={i}>{String(i).padStart(2, "0")}</option>))}
        </select><span className="text-text-secondary">:</span>
        <select className="rounded-xl border border-white/50 bg-white/60 px-3 py-2 text-sm text-text-primary focus:border-ice-light focus:outline-none" value={wakeMin} onChange={(e) => handleWakeChange(wakeHour, Number(e.target.value))}>
          {timeOpts(60).map((i) => (<option key={i} value={i}>{String(i).padStart(2, "0")}</option>))}
        </select>
      </div>

      <div className="mb-5 rounded-xl bg-white/40 p-3 text-center">
        <p className="text-xs text-text-secondary">预计睡眠时长</p>
        <p className="text-lg font-semibold text-text-primary">{calcDuration()}</p>
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">睡眠质量</p>
      <div className="mb-5 flex justify-between gap-1">
        {QUALITY_OPTIONS.map((opt) => (
          <button key={opt.score} type="button"
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-center transition-all ${quality === opt.score ? "scale-105 bg-white shadow-md" : "bg-white/40 hover:bg-white/60"}`}
            onClick={() => setQuality(opt.score)}>
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-[10px] text-text-secondary">{opt.label}</span>
          </button>
        ))}
      </div>

      <textarea className="mb-4 w-full resize-none rounded-xl border border-white/50 bg-white/60 p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-ice-light focus:outline-none" rows={2}
        placeholder="做了什么梦？有什么想说的？…" value={note} onChange={(e) => setNote(e.target.value)} />

      <div className="mb-5">
        <TimePicker initialTime={recordedAt} onChange={setRecordedAt} label="记录时间（默认=起床时间）" />
      </div>

      <div className="flex gap-2">
        <button type="button" disabled={saving}
          className={`flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all ${saved ? "bg-mint-light" : "bg-gradient-to-r from-ice-light to-mint-light shadow-md active:scale-[0.98] disabled:opacity-50"}`}
          onClick={handleSave}>
          {saving ? "保存中..." : saved ? "✓ 已保存 ✨" : editingId ? "更新记录" : "保存记录"}
        </button>
        {editingId && (
          <button type="button" className="rounded-full bg-white/60 px-4 py-3 text-sm text-text-secondary shadow-sm" onClick={resetForm}>取消</button>
        )}
      </div>

      <TodayRecords records={todayRecords}
        renderSummary={(r) => (
          <div>
            <p className="text-sm text-text-primary">
              {r.bedtime?.slice(0, 5)} → {r.wake_time?.slice(0, 5)}
              <span className="ml-2 text-xs text-text-secondary">质量：{r.quality_score}/5</span>
            </p>
            {r.note && <p className="text-xs text-text-secondary">{r.note}</p>}
          </div>
        )}
        onEdit={handleEdit} onDelete={handleDelete} />
    </ModuleLayout>
  );
}