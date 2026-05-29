"use client";

import { useState, useEffect } from "react";

interface TimePickerProps {
  /** 初始时间（ISO字符串），不传则默认当前时间 */
  initialTime?: string;
  /** 时间变化回调，返回 ISO 字符串 */
  onChange?: (isoTime: string) => void;
  /** 标签文字 */
  label?: string;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function TimePicker({ initialTime, onChange, label }: TimePickerProps) {
  const now = new Date();
  const initDate = initialTime ? new Date(initialTime) : now;

  const [year, setYear] = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth() + 1);
  const [day, setDay] = useState(initDate.getDate());
  const [hour, setHour] = useState(initDate.getHours());
  const [minute, setMinute] = useState(initDate.getMinutes());
  const [useCustom, setUseCustom] = useState(false);

  // 用当前时间填充初始
  useEffect(() => {
    if (!useCustom && !initialTime) {
      const n = new Date();
      setYear(n.getFullYear());
      setMonth(n.getMonth() + 1);
      setDay(n.getDate());
      setHour(n.getHours());
      setMinute(n.getMinutes());
    }
  }, []);

  // 构建 ISO 字符串并回调
  const buildISO = (y: number, m: number, d: number, h: number, min: number) => {
    const date = new Date(y, m - 1, d, h, min);
    return date.toISOString();
  };

  const emitChange = (y: number, m: number, d: number, h: number, min: number) => {
    onChange?.(buildISO(y, m, d, h, min));
  };

  const handleToggle = () => {
    const next = !useCustom;
    setUseCustom(next);
    if (next) {
      // 切换到自定义时，把当前值发出去
      emitChange(year, month, day, hour, minute);
    } else {
      // 切回"现在"，重新设为当前时间
      const n = new Date();
      setYear(n.getFullYear());
      setMonth(n.getMonth() + 1);
      setDay(n.getDate());
      setHour(n.getHours());
      setMinute(n.getMinutes());
      onChange?.(n.toISOString());
    }
  };

  const handleChange = (field: string, val: number) => {
    let y = year, mo = month, d = day, h = hour, mi = minute;
    switch (field) {
      case "year": y = val; break;
      case "month": mo = val; break;
      case "day": d = val; break;
      case "hour": h = val; break;
      case "minute": mi = val; break;
    }
    setYear(y); setMonth(mo); setDay(d); setMonth(mo);
    setDay(d); setHour(h); setMinute(mi);
    emitChange(y, mo, d, h, mi);
  };

  return (
    <div className="rounded-xl bg-white/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-secondary">
          {label || "记录时间"}
        </p>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs transition-all ${
            useCustom
              ? "bg-pink-light text-white"
              : "bg-white/60 text-text-secondary"
          }`}
          onClick={handleToggle}
        >
          {useCustom ? "⏱ 自定义" : "现在"}
        </button>
      </div>

      {useCustom ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* 年月日 */}
          <select
            className="rounded-lg border border-white/50 bg-white px-2 py-1 text-xs text-text-primary focus:border-pink-light focus:outline-none"
            value={month}
            onChange={(e) => handleChange("month", Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}月</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-white/50 bg-white px-2 py-1 text-xs text-text-primary focus:border-pink-light focus:outline-none"
            value={day}
            onChange={(e) => handleChange("day", Number(e.target.value))}
          >
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}日</option>
            ))}
          </select>

          <span className="text-xs text-text-secondary">·</span>

          {/* 时分 */}
          <select
            className="rounded-lg border border-white/50 bg-white px-2 py-1 text-xs text-text-primary focus:border-pink-light focus:outline-none"
            value={hour}
            onChange={(e) => handleChange("hour", Number(e.target.value))}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{pad2(i)}</option>
            ))}
          </select>
          <span className="text-xs text-text-secondary">:</span>
          <select
            className="rounded-lg border border-white/50 bg-white px-2 py-1 text-xs text-text-primary focus:border-pink-light focus:outline-none"
            value={minute}
            onChange={(e) => handleChange("minute", Number(e.target.value))}
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>{pad2(i)}</option>
            ))}
          </select>
        </div>
      ) : (
        <p className="mt-1 text-sm text-text-primary">
          {pad2(hour)}:{pad2(minute)}
        </p>
      )}
    </div>
  );
}