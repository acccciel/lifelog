"use client";

import type { ReactNode } from "react";
import { getTimeFromISO } from "@/lib/services";

interface RecordItem {
  id: number;
  recorded_at: string;
  [key: string]: unknown;
}

interface TodayRecordsProps {
  records: RecordItem[];
  /** 渲染每条记录的摘要内容 */
  renderSummary: (record: RecordItem) => ReactNode;
  /** 点击编辑按钮（回填表单） */
  onEdit?: (record: RecordItem) => void;
  /** 点击删除按钮 */
  onDelete?: (record: RecordItem) => void;
}

export default function TodayRecords({
  records,
  renderSummary,
  onEdit,
  onDelete,
}: TodayRecordsProps) {
  if (records.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          今日记录（{records.length}）
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-start gap-2 rounded-xl bg-white/50 p-3"
          >
            {/* 时间 */}
            <div className="mt-0.5 min-w-[36px] text-center">
              <p className="text-[10px] font-medium text-pink-deep">
                {getTimeFromISO(record.recorded_at as string)}
              </p>
            </div>

            {/* 内容 */}
            <div className="min-w-0 flex-1">{renderSummary(record)}</div>

            {/* 操作按钮 */}
            <div className="flex shrink-0 gap-1">
              {onEdit && (
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-xs text-text-secondary shadow-sm hover:bg-pink-light/20 active:scale-90"
                  onClick={() => onEdit(record)}
                  title="编辑"
                >
                  ✏️
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-xs text-text-secondary shadow-sm hover:bg-red-100 active:scale-90"
                  onClick={() => onDelete(record)}
                  title="删除"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}