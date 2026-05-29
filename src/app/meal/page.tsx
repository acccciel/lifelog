"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleLayout from "@/components/ModuleLayout";
import TimePicker from "@/components/TimePicker";
import TodayRecords from "@/components/TodayRecords";
import { supabase } from "@/lib/supabase";
import { getToday, getNowISO, getDateFromISO } from "@/lib/services";

const MEAL_TYPES = ["🍳 早餐", "🥗 午餐", "🍜 晚餐", "🍪 加餐"];
const QUICK_FOODS = [
  { emoji: "🍚", name: "米饭" }, { emoji: "🍜", name: "面条" },
  { emoji: "🥩", name: "肉类" }, { emoji: "🥦", name: "蔬菜" },
  { emoji: "🍎", name: "水果" }, { emoji: "🥛", name: "奶制品" },
  { emoji: "🥚", name: "蛋类" }, { emoji: "☕", name: "咖啡" },
];

export default function MealPage() {
  const router = useRouter();
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [mealType, setMealType] = useState("");
  const [foodText, setFoodText] = useState("");
  const [selectedQuick, setSelectedQuick] = useState<string[]>([]);
  const [recordedAt, setRecordedAt] = useState(getNowISO());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadToday = useCallback(async () => {
    const { data } = await supabase.from("meals").select("*").eq("record_date", getToday()).order("recorded_at", { ascending: true });
    if (data) setTodayRecords(data);
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const resetForm = () => {
    setMealType(""); setFoodText(""); setSelectedQuick([]);
    setRecordedAt(getNowISO()); setEditingId(null);
  };

  const handleEdit = (r: any) => {
    setMealType(r.meal_type || "");
    setFoodText(r.description || r.food_name || "");
    setSelectedQuick([]);
    setRecordedAt(r.recorded_at || getNowISO());
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (r: any) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await supabase.from("meals").delete().eq("id", r.id);
    loadToday();
    if (editingId === r.id) resetForm();
  };

  const handleQuickFood = (name: string) => {
    setSelectedQuick((prev) => prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]);
  };

  const handleSave = async () => {
    if (!mealType) { alert("请先选择餐别～"); return; }
    setSaving(true);
    const foodName = [foodText, ...selectedQuick].join("、").slice(0, 500);
    const record = { record_date: getDateFromISO(recordedAt), meal_type: mealType, food_name: foodName, description: foodText, recorded_at: recordedAt };

    let error: any = null;
    if (editingId) {
      ({ error } = await supabase.from("meals").update(record).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("meals").insert(record));
    }
    setSaving(false);
    if (error) { alert("保存失败：" + error.message); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); resetForm(); loadToday(); }, 1000);
  };

  return (
    <ModuleLayout emoji="🍚" title="饮食记录" subtitle="今天吃了什么好东西？" gradient="bg-cream-light/60">
      {editingId && <p className="mb-3 text-xs text-pink-deep">✏️ 正在编辑记录 #{editingId}</p>}

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">餐别</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {MEAL_TYPES.map((mt) => (
          <button key={mt} type="button"
            className={`rounded-full px-4 py-1.5 text-sm transition-all ${mealType === mt ? "bg-pink-light text-white shadow-sm" : "bg-white/60 text-text-secondary hover:bg-white"}`}
            onClick={() => setMealType(mt)}>{mt}</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">吃了什么</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK_FOODS.map((food) => (
          <button key={food.name} type="button"
            className={`rounded-xl border px-3 py-2 text-sm transition-all ${selectedQuick.includes(food.name) ? "border-pink-light bg-pink-light/20 text-text-primary" : "border-white/50 bg-white/40 text-text-secondary hover:border-pink-light/50"}`}
            onClick={() => handleQuickFood(food.name)}>{food.emoji} {food.name}</button>
        ))}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">详细记录</p>
      <textarea className="mb-4 w-full resize-none rounded-xl border border-white/50 bg-white/60 p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-pink-light focus:outline-none" rows={2}
        placeholder="吃了什么？味道怎么样？…" value={foodText} onChange={(e) => setFoodText(e.target.value)} />

      <div className="mb-5">
        <TimePicker initialTime={recordedAt} onChange={setRecordedAt} label="用餐时间" />
      </div>

      <div className="flex gap-2">
        <button type="button" disabled={saving}
          className={`flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all ${saved ? "bg-mint-light" : "bg-gradient-to-r from-pink-light to-lavender-light shadow-md active:scale-[0.98] disabled:opacity-50"}`}
          onClick={handleSave}>
          {saving ? "保存中..." : saved ? "✓ 已保存 ✨" : editingId ? "更新记录" : "保存记录"}
        </button>
        {editingId && (
          <button type="button" className="rounded-full bg-white/60 px-4 py-3 text-sm text-text-secondary shadow-sm" onClick={resetForm}>
            取消
          </button>
        )}
      </div>

      <TodayRecords records={todayRecords}
        renderSummary={(r) => <p className="text-sm text-text-primary">{r.meal_type}：{r.food_name || r.description || "已记录"}</p>}
        onEdit={handleEdit} onDelete={handleDelete} />
    </ModuleLayout>
  );
}