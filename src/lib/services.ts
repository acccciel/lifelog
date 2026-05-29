import { supabase, type DailyRecord } from "./supabase";

// ===== 获取今天的日期字符串 =====
export function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getNowISO(): string {
  return new Date().toISOString();
}

/** 从 ISO 字符串提取日期（YYYY-MM-DD） */
export function getDateFromISO(iso: string): string {
  return iso.slice(0, 10);
}

/** 从 ISO 字符串提取时间（HH:mm） */
export function getTimeFromISO(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 根据给定的小时和分钟生成今天的 ISO 时间字符串 */
export function makeTodayISO(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ===== 通用读取函数 =====

/** 获取某个表某一天的记录 */
export async function getDayRecords<T>(
  table: string,
  recordDate: string,
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("record_date", recordDate)
    .order("recorded_at", { ascending: true });

  if (error) {
    console.error(`读取 ${table} 失败:`, error);
    return [];
  }
  return (data as T[]) || [];
}

/** 获取某个表一段时间的记录 */
export async function getRecordsInRange<T>(
  table: string,
  startDate: string,
  endDate: string,
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .gte("record_date", startDate)
    .lte("record_date", endDate)
    .order("record_date", { ascending: false });

  if (error) {
    console.error(`读取 ${table} 失败:`, error);
    return [];
  }
  return (data as T[]) || [];
}

// ===== 每日总记录 =====

/** 获取某天的每日总记录 */
export async function getDailyRecord(recordDate: string) {
  const { data, error } = await supabase
    .from("daily_records")
    .select("*")
    .eq("record_date", recordDate)
    .maybeSingle();

  if (error) {
    console.error("读取每日记录失败:", error);
    return null;
  }
  return data as DailyRecord | null;
}

/** 更新或创建每日记录 */
export async function upsertDailyRecord(record: Partial<DailyRecord>) {
  const { data, error } = await supabase
    .from("daily_records")
    .upsert(record, { onConflict: "user_id, record_date" })
    .select()
    .single();

  if (error) {
    console.error("保存每日记录失败:", error);
    return null;
  }
  return data as DailyRecord;
}

/** 获取所有高亮日期 */
export async function getHighlightedDates() {
  const { data, error } = await supabase
    .from("daily_records")
    .select("record_date, self_score, system_score")
    .eq("is_highlighted", true)
    .order("record_date", { ascending: false });

  if (error) {
    console.error("读取高亮日期失败:", error);
    return [];
  }
  return data as { record_date: string; self_score: number | null; system_score: number | null }[];
}

// ===== 获取月份数据（日历用） =====

export type MonthDayInfo = {
  date: string;          // YYYY-MM-DD
  day: number;           // 日号
  hasRecords: boolean;   // 是否有记录
  isHighlighted: boolean; // 是否高亮
  selfScore: number | null;
  systemScore: number | null;
};

export async function getMonthData(year: number, month: number): Promise<{
  days: MonthDayInfo[];
  totalRecords: number;
  highlightedCount: number;
}> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  // 计算月末
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // 并行查询：各表的记录数分布 + 高亮天数
  const tables = ["meals", "moods", "exercises", "work_logs", "study_logs", "sleep_records", "daily_records"];

  const results = await Promise.all([
    // 每个表的日期分布
    ...tables.slice(0, 6).map((t) =>
      supabase.from(t).select("record_date").gte("record_date", startDate).lte("record_date", endDate)
    ),
    // daily_records 含评分和高亮
    supabase.from("daily_records")
      .select("record_date, self_score, system_score, is_highlighted")
      .gte("record_date", startDate)
      .lte("record_date", endDate),
  ]);

  // 整理有记录的日期集合
  const datesWithRecords = new Set<string>();
  for (let i = 0; i < 6; i++) {
    const data = results[i].data as { record_date: string }[] | null;
    if (data) data.forEach((r) => datesWithRecords.add(r.record_date));
  }

  // 整理高亮日期
  const dailyData = results[6].data as { record_date: string; self_score: number | null; system_score: number | null; is_highlighted: boolean }[] | null;
  const highlightMap = new Map<string, { isHighlighted: boolean; selfScore: number | null; systemScore: number | null }>();
  if (dailyData) {
    dailyData.forEach((r) => {
      highlightMap.set(r.record_date, {
        isHighlighted: r.is_highlighted,
        selfScore: r.self_score,
        systemScore: r.system_score,
      });
    });
  }

  // 构建每日信息
  const days: MonthDayInfo[] = [];
  let totalRecords = 0;
  let highlightedCount = 0;

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const hl = highlightMap.get(dateStr);
    const hasRec = datesWithRecords.has(dateStr);
    if (hasRec) totalRecords++;
    if (hl?.isHighlighted) highlightedCount++;

    days.push({
      date: dateStr,
      day: d,
      hasRecords: hasRec,
      isHighlighted: hl?.isHighlighted || false,
      selfScore: hl?.selfScore || null,
      systemScore: hl?.systemScore || null,
    });
  }

  return { days, totalRecords, highlightedCount };
}

/** 获取某一天的完整数据汇总 */
export async function getDaySummary(recordDate: string): Promise<DaySummary> {
  const [meals, moods, exercises, work_logs, study_logs, sleep_records, daily_record] =
    await Promise.all([
      getDayRecords("meals", recordDate),
      getDayRecords("moods", recordDate),
      getDayRecords("exercises", recordDate),
      getDayRecords("work_logs", recordDate),
      getDayRecords("study_logs", recordDate),
      getDayRecords("sleep_records", recordDate),
      getDailyRecord(recordDate),
    ]);

  return { date: recordDate, meals, moods, exercises, work_logs, study_logs, sleep_records, daily_record };
}

// ===== 工具：获取今日已记录模块数 =====

export async function getTodayModuleCount(): Promise<number> {
  const today = getToday();
  const tables = ["meals", "moods", "exercises", "work_logs", "study_logs", "sleep_records"];
  let count = 0;

  for (const table of tables) {
    const records = await getDayRecords(table, today);
    if (records.length > 0) count++;
  }

  return count;
}

// ===== 每日全部数据汇总 =====

export type DaySummary = {
  date: string;
  meals: any[];
  moods: any[];
  exercises: any[];
  work_logs: any[];
  study_logs: any[];
  sleep_records: any[];
  daily_record: DailyRecord | null;
};

/** 计算系统评分（0-10） */
export function calcSystemScore(summary: DaySummary): number {
  let score = 0;
  let factors = 0;

  // 心情
  if (summary.moods.length > 0) {
    const avgMood = summary.moods.reduce((s: number, m: any) => s + (m.mood_score || 3), 0) / summary.moods.length;
    score += (avgMood / 5) * 3;  // 心情权重 3
    factors += 3;
  }

  // 睡眠
  if (summary.sleep_records.length > 0) {
    const sleep = summary.sleep_records[0];
    const quality = (sleep.quality_score || 3) / 5;
    score += quality * 2.5;  // 睡眠权重 2.5
    factors += 2.5;
  }

  // 运动
  if (summary.exercises.length > 0) {
    const ex = summary.exercises[0];
    const hasExercise = ex.duration_minutes > 0 ? 1 : 0;
    score += hasExercise * 1.5;  // 运动权重 1.5
    factors += 1.5;
  }

  // 工作/学习（取最高分）
  const workScore = summary.work_logs.length > 0
    ? (summary.work_logs[0].efficiency_score || 3) / 5
    : 0;
  const studyScore = summary.study_logs.length > 0
    ? Math.min((summary.study_logs[0].duration_minutes || 0) / 120, 1)
    : 0;
  const productive = Math.max(workScore, studyScore);
  if (productive > 0) {
    score += productive * 1.5;
    factors += 1.5;
  }

  // 饮食（有记录就算分）
  if (summary.meals.length > 0) {
    score += Math.min(summary.meals.length / 3, 1) * 1.5;
    factors += 1.5;
  }

  if (factors === 0) return 0;
  return Math.round((score / factors) * 100) / 10;
}