import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tmimeyiocpcysqrtuuwp.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaW1leWlvY3BjeXNxcnR1dXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzE0ODAsImV4cCI6MjA5NTYwNzQ4MH0.CMK36doFchm7dTO93_zec5DHChZRSKCyZ4L0_bqPsCo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== 数据类型定义 =====
export type MealRecord = {
  id?: number;
  user_id?: string;
  record_date: string;
  meal_type: string;
  food_name: string;
  description?: string;
  photo_urls?: string[];
  calories?: number;
  recorded_at: string;
};

export type MoodRecord = {
  id?: number;
  user_id?: string;
  record_date: string;
  mood_emoji: string;
  mood_label: string;
  mood_score: number;
  note?: string;
  recorded_at: string;
};

export type ExerciseRecord = {
  id?: number;
  user_id?: string;
  record_date: string;
  exercise_type: string;
  duration_minutes: number;
  intensity?: string;
  feeling?: string;
  recorded_at: string;
};

export type WorkRecord = {
  id?: number;
  user_id?: string;
  record_date: string;
  content: string;
  efficiency_score?: number;
  impact_on_mood?: string;
  recorded_at: string;
};

export type StudyRecord = {
  id?: number;
  user_id?: string;
  record_date: string;
  content: string;
  duration_minutes?: number;
  category?: string;
  recorded_at: string;
};

export type SleepRecord = {
  id?: number;
  user_id?: string;
  record_date: string;
  bedtime: string;
  wake_time: string;
  quality_score?: number;
  note?: string;
  recorded_at: string;
};

export type DailyRecord = {
  id?: number;
  user_id?: string;
  record_date: string;
  self_score?: number;
  system_score?: number;
  summary_note?: string;
  is_highlighted?: boolean;
  created_at?: string;
};