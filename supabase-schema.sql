-- ===== LifeLog 数据库建表 SQL =====
-- 1. 饮食记录表
CREATE TABLE IF NOT EXISTS meals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  record_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  calories INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 心情记录表
CREATE TABLE IF NOT EXISTS moods (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  record_date DATE NOT NULL,
  mood_emoji TEXT NOT NULL DEFAULT '',
  mood_label TEXT NOT NULL DEFAULT '',
  mood_score SMALLINT DEFAULT 3,
  note TEXT DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 运动记录表
CREATE TABLE IF NOT EXISTS exercises (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  record_date DATE NOT NULL,
  exercise_type TEXT NOT NULL DEFAULT '',
  duration_minutes SMALLINT DEFAULT 0,
  intensity TEXT DEFAULT '',
  feeling TEXT DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 工作记录表
CREATE TABLE IF NOT EXISTS work_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  record_date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  efficiency_score SMALLINT DEFAULT 3,
  impact_on_mood TEXT DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 学习记录表
CREATE TABLE IF NOT EXISTS study_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  record_date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  duration_minutes SMALLINT DEFAULT 0,
  category TEXT DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 睡眠记录表
CREATE TABLE IF NOT EXISTS sleep_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  record_date DATE NOT NULL,
  bedtime TIME NOT NULL DEFAULT '23:00',
  wake_time TIME NOT NULL DEFAULT '07:00',
  quality_score SMALLINT DEFAULT 3,
  note TEXT DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 每日总记录表
CREATE TABLE IF NOT EXISTS daily_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  record_date DATE NOT NULL,
  self_score SMALLINT DEFAULT 0,
  system_score DECIMAL(4,1) DEFAULT 0,
  summary_note TEXT DEFAULT '',
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, record_date)
);

-- ===== 建索引加速查询 =====
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_moods_date ON moods(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_exercises_date ON exercises(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_study_logs_date ON study_logs(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_sleep_records_date ON sleep_records(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_daily_records_highlighted ON daily_records(is_highlighted);

-- ===== 开启行级安全（RLS）=====
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- ===== 创建 RLS 策略：用户只能操作自己的数据 =====
CREATE POLICY "用户只能管理自己的饮食记录" ON meals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户只能管理自己的心情记录" ON moods
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户只能管理自己的运动记录" ON exercises
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户只能管理自己的工作记录" ON work_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户只能管理自己的学习记录" ON study_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户只能管理自己的睡眠记录" ON sleep_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户只能管理自己的每日记录" ON daily_records
  FOR ALL USING (auth.uid() = user_id);