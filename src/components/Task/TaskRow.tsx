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
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        cursor: "pointer",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Время и тип задачи */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {task.planned_start_local.slice(11)}
        </span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{task.type}</span>
      </div>

      {/* Адрес */}
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        {task.address_raw}
      </div>

      {/* Договор */}
      {task.contract_number && (
        <div style={{ fontSize: 14, color: "#555", marginBottom: 4 }}>
          Договор: {task.contract_number}
        </div>
      )}

      {/* Назначены */}
      <div style={{ fontSize: 14, color: "#555", marginBottom: 8 }}>
        Назначены: {task.executorsNames}
      </div>

      {/* Кнопки действий */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDone(task);
          }}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRadius: 4,
            background: "#0070f3",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Выполнено
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel(task);
          }}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRadius: 4,
            background: "#005594",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Отменить
        </button>
      </div>
    </li>
  );
}
