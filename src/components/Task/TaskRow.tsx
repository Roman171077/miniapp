// src/components/Task/TaskRow.tsx
import React from "react";
import { Task } from "@/lib/types";

interface TaskRowProps {
  task: Task & {
    planned_start_local: string;
    executorsNames: string;
  };
  onDone: (task: Task) => void;
  onCancel: (task: Task) => void;
  onClick: (task: Task) => void;
}

export default function TaskRow({ task, onDone, onCancel, onClick }: TaskRowProps) {
  return (
    <li
      onClick={() => onClick(task)}
      className="flex flex-col bg-white rounded p-3 mb-3 shadow cursor-pointer w-full box-border"
    >
      {/* Время и тип задачи */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">
          {task.planned_start_local.slice(11)}
        </span>
        <span className="text-sm font-medium">{task.type}</span>
      </div>

      {/* Адрес */}
      <div className="text-base font-semibold mb-1">
        {task.address_raw}
      </div>

      {/* Договор */}
      {task.contract_number && (
        <div className="text-sm text-gray-600 mb-1">
          Договор: {task.contract_number}
        </div>
      )}

      {/* Назначены */}
      <div className="text-sm text-gray-600 mb-2">
        Назначены: {task.executorsNames}
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDone(task);
          }}
          className="px-3 py-1.5 rounded bg-blue-500 text-white text-sm"
        >
          Выполнено
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel(task);
          }}
          className="px-3 py-1.5 rounded bg-blue-700 text-white text-sm"
        >
          Отменить
        </button>
      </div>
    </li>
  );
}
