// src/components/Task/TaskModal.tsx
import React, { useRef, useEffect } from "react";
import { Executor, Task } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface TaskModalProps {
  task: Task & {
    task_id: number;
    _planned_at: string;
    _due_dt: string;
    _service_min: number;
    executorIds: number[];
    contract_number: string;
    address_raw: string;
    notes: string;
    movable: boolean;
    priority: "A" | "B" | "C";
    type: "connection" | "service" | "incident";
  };
  executors: Executor[];
  currentUserId: number;
  onClose: () => void;
  onChange: (field: string, value: any) => void;
  onAddExecutor: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSave: () => void;
}

export default function TaskModal({
  task,
  executors,
  currentUserId,
  onClose,
  onChange,
  onAddExecutor,
  onSave,
}: TaskModalProps) {
  const originalExecutorIds = useRef<number[]>([]);
  useEffect(() => {
    originalExecutorIds.current = task.executorIds;
  }, []);

  const handleRemoveLocal = (idx: number) => {
    const newIds = task.executorIds.filter((_, i) => i !== idx);
    onChange("executorIds", newIds);
  };

  const handleSaveAll = async () => {
    const orig = originalExecutorIds.current;
    const curr = task.executorIds;
    const toRemove = orig.filter((id) => !curr.includes(id));
    const toAdd = curr.filter((id) => !orig.includes(id));
    try {
      for (const execId of toRemove) {
        const res = await fetch(
          `${API_URL}/tasks/${task.task_id}/executors/${execId}`,
          {
            method: "DELETE",
            headers: { "X-User-Id": String(currentUserId) },
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`DELETE ${execId}: ${text || res.statusText}`);
        }
      }
      for (const execId of toAdd) {
        const res = await fetch(
          `${API_URL}/tasks/${task.task_id}/executors/${execId}`,
          {
            method: "POST",
            headers: { "X-User-Id": String(currentUserId) },
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`POST ${execId}: ${text || res.statusText}`);
        }
      }
    } catch (err: any) {
      console.error("Ошибка при синхронизации исполнителей:", err);
      alert(`Не удалось синхронизировать исполнителей:\n${err.message}`);
      return;
    }
    onSave();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 min-w-[340px] w-full max-w-md overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Редактировать задачу</h3>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Начало:</label>
          <input
            type="datetime-local"
            value={task._planned_at}
            onChange={(e) => onChange("_planned_at", e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Дедлайн:</label>
          <input
            type="datetime-local"
            value={task._due_dt}
            onChange={(e) => onChange("_due_dt", e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Время на выполнение (мин):</label>
          <input
            type="number"
            value={task._service_min}
            onChange={(e) => onChange("_service_min", Number(e.target.value))}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Приоритет:</label>
          <select
            value={task.priority}
            onChange={(e) => onChange("priority", e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Тип задачи:</label>
          <select
            value={task.type}
            onChange={(e) => onChange("type", e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="connection">Подключение</option>
            <option value="service">Сервис</option>
            <option value="incident">Авария</option>
          </select>
        </div>

        {/* Поля договор и адрес — после типа задачи */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Договор:</label>
          <input
            type="text"
            value={task.contract_number}
            onChange={(e) => onChange("contract_number", e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Адрес:</label>
          <textarea
            value={task.address_raw}
            onChange={(e) => onChange("address_raw", e.target.value)}
            rows={2}
            className="w-full px-2 py-1 border rounded resize-none"
            style={{ minHeight: 40 }}
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Возможность переноса:</label>
          <input
            type="checkbox"
            checked={task.movable}
            onChange={(e) => onChange("movable", e.target.checked)}
            className="ml-2"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Назначены:</label>
          <div className="flex gap-2 flex-wrap my-2">
            {task.executorIds.map((id, idx) => {
              const ex = executors.find((e) => e.exec_id === id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-1 bg-zinc-100 px-2 rounded"
                >
                  <span>{ex?.surname}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:underline"
                    onClick={() => handleRemoveLocal(idx)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {task.executorIds.length < executors.length && (
              <select
                defaultValue=""
                onChange={onAddExecutor}
                className="px-2 py-1 border rounded"
              >
                <option value="">— Назначить —</option>
                {executors
                  .filter((e) => !task.executorIds.includes(e.exec_id))
                  .map((e) => (
                    <option key={e.exec_id} value={e.exec_id}>
                      {e.surname}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        {/* Кнопки перед полем комментарии */}
        <div className="flex justify-end gap-4 mb-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            type="button"
          >
            Отмена
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded bg-sky-500 text-white hover:bg-sky-600"
            type="button"
          >
            Сохранить
          </button>
        </div>

        <div>
          <label className="block mb-1 font-medium">Комментарии:</label>
          <textarea
            value={task.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            className="w-full px-2 py-1 border rounded min-h-[48px]"
          />
        </div>
      </div>
    </div>
  );
}
