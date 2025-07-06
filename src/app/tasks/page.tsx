// src/app/tasks/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { EditableTask, Subscriber } from "@/lib/types";
import {
  getTasks,
  getExecutors,
  getSubscribers,
  updateTask,
} from "@/lib/api/tasks";
import TaskList from "@/components/Task/TaskList";
import TaskModal from "@/components/Task/TaskModal";
import CreateTask from "@/components/Task/CreateTask";
import CreateSubscriber from "@/components/Task/CreateSubscriber";

import {
  utcToLocalInput,
  localToUtc,
  localToUtc2359,
  groupByDate,
} from "@/lib/utils/date";
import type { Task, Executor } from "@/lib/types";
import { useUserRole } from "@/context/UserRoleContext";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filterType, setFilterType] = useState<"all" | "service" | "connection" | "incident">("all");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingSubscriber, setIsCreatingSubscriber] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EditableTask | null>(null);
  const { userId, loading: userLoading } = useUserRole();

  if (userLoading) return <p>Загрузка…</p>;
  if (!userId) return <p className="p-4">Пользователь не определён</p>;

  const loadExecutors = useCallback(async () => {
    try {
      const data = await getExecutors();
      setExecutors(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      const prep = data
        .filter((t: any) => t.status !== "done" && t.status !== "cancelled")
        .map((t: any) => ({
          ...t,
          planned_start_local: utcToLocalInput(t.planned_start),
          executorsNames: t.executors.map((ex: any) => ex.surname).join(", "),
        }))
        .sort((a: any, b: any) =>
          new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime()
        );
      setTasks(prep);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

    // Загрузка списка подписчиков (Subscriber[])
  const loadSubscribers = useCallback(async () => {
    try {
      const data = await getSubscribers();
      setSubscribers(data);
    } catch (e) {
      console.error("Не удалось загрузить подписчиков:", e);
    }
  }, []);

  useEffect(() => {
    loadExecutors();
    loadTasks();
    loadSubscribers();
  }, [loadExecutors, loadTasks, loadSubscribers]);

  const sendFullUpdate = (t: any, extra: Partial<any> = {}) =>
    updateTask(
      t.task_id,
      {
        address_raw: t.address_raw,
        lat: t.latitude,
        lng: t.longitude,
        service_minutes: t.service_minutes,
        planned_start: t.planned_start,
        due_datetime: t.due_datetime,
        movable: t.movable,
        priority: t.priority,
        notes: t.notes,
        executor_ids: t.executors.map((ex: any) => ex.exec_id),
        type: t.type,
        contract_number: t.contract_number,
        ...extra,
      },
      userId
    );

  const handleDone = async (t: any) => {
    setLoading(true);
    try {
      await sendFullUpdate(t, { status: "done", actual_end: new Date().toISOString() });
      await loadTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (t: any) => {
    setLoading(true);
    try {
      await sendFullUpdate(t, { status: "cancelled" });
      await loadTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (t: any) => {
    setSelectedTask({
      ...t,
      _planned_at: t.planned_start_local,
      _due_dt: utcToLocalInput(t.due_datetime),
      _service_min: t.service_minutes,
      executorIds: t.executors.map((ex: any) => ex.exec_id),
      type: t.type,
      notes: t.notes || "",
      contract_number: t.contract_number || "",
    });
  };

  const handleModalChange = (field: string, value: any) =>
    setSelectedTask((prev) => (prev ? { ...prev, [field]: value } : prev));

  const addExecutorModal = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    e.target.value = "";
    setSelectedTask((prev) =>
      prev ? { ...prev, executorIds: [...prev.executorIds, id] } : prev
    );
  };

  const removeExecutorModal = (idx: number) =>
    setSelectedTask((prev) =>
      prev
        ? { ...prev, executorIds: prev.executorIds.filter((_: any, i: number) => i !== idx) }
        : prev
    );

  const handleSave = async () => {
    if (!selectedTask) return;
    setLoading(true);
    try {
      await updateTask(
        selectedTask.task_id,
        {
          address_raw: selectedTask.address_raw,
          lat: selectedTask.latitude,
          lng: selectedTask.longitude,
          service_minutes: Math.round(selectedTask._service_min),
          planned_start: localToUtc(selectedTask._planned_at)!,
          due_datetime: localToUtc2359(selectedTask._due_dt)!,
          movable: selectedTask.movable,
          priority: selectedTask.priority,
          notes: selectedTask.notes,
          executor_ids: selectedTask.executorIds,
          type: selectedTask.type,
          contract_number: selectedTask.contract_number,
        },
        userId
      );
      setSelectedTask(null);
      await loadTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Загрузка…</p>;

  const visible = tasks.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    const day = t.planned_start.slice(0, 10);
    if (filterDate && day !== filterDate) return false;
    return true;
  });
  const grouped = groupByDate(visible);

  return (
    <div className="p-5">
      {/* Full-width New Task button on top */}
      <div className="w-full mb-5 space-y-2">
        <button
          onClick={() => setIsCreating(true)}
          className="w-full bg-blue-600 text-white py-2 text-base font-bold rounded"
        >
          + Новая задача
        </button>
        <button
          onClick={() => setIsCreatingSubscriber(true)}
          className="w-full bg-green-600 text-white py-2 text-base font-bold rounded"
        >
          + Новый абонент
        </button>

      </div>

      {/* Centered bold header */}
      <h1 className="text-center font-bold my-2.5">
        Задачи
      </h1>

      {/* Filters */}
      <div className="text-left mb-5 flex flex-wrap gap-4 items-center">
        <label>
          Тип:&nbsp;
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
            <option value="all">Все</option>
            <option value="service">Сервис</option>
            <option value="connection">Подключение</option>
            <option value="incident">Авария</option>
          </select>
        </label>
        <label>
          Дата:&nbsp;
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </label>
      </div>

      {/* Task lists grouped by date */}
      {Object.entries(grouped).map(([date, items]) => (
        <TaskList
          key={date}
          date={date}
          tasks={items}
          onDone={handleDone}
          onCancel={handleCancel}
          onRowClick={handleRowClick}
        />
      ))}

      {isCreating && (
        <CreateTask
          executors={executors}
          subscribers={subscribers}
          userId={userId}
          onClose={() => setIsCreating(false)}
          onCreated={loadTasks}
        />
      )}

     {/* Модалка создания подписчика */}
      {isCreatingSubscriber && (
        <CreateSubscriber
          onClose={() => setIsCreatingSubscriber(false)}
          onCreated={() => {
            loadSubscribers()
            setIsCreatingSubscriber(false)
          }}
        />
      )}

      {!!selectedTask && (
        <TaskModal
          task={selectedTask}
          executors={executors}
          currentUserId={userId}
          onClose={() => setSelectedTask(null)}
          onChange={handleModalChange}
          onAddExecutor={addExecutorModal}
          onRemoveExecutor={removeExecutorModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
