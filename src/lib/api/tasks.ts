// src/lib/api/tasks.ts

import { Task, Executor, Subscriber } from "../types";

export interface WorkTimeRecord {
  id: number;
  exec_id: number;
  surname: string;
  name: string | null;
  work_date: string;    // ISO-строка, например "2025-06-01"
  work_minutes: number; // кол-во минут за этот день
}

/**
 * Данные, которые отправляем на сервер при создании записи рабочего времени.
 */
export interface CreateWorkTimeData {
  exec_id: number;
  work_date: string;    // ISO-строка, например "2025-06-01"
  work_minutes: number;
}

/**
 * Данные для обновления существующей записи рабочего времени.
 * Все поля необязательные → чтобы можно было менять только необходимые.
 */
export type UpdateWorkTimeData = Partial<CreateWorkTimeData>;
// Данные для создания новой задачи
export interface CreateTaskData {
  address_raw: string;
  lat?: number | null;   // теперь допустимо number или null или вовсе отсутствует
  lng?: number | null;  // то же самое
  service_minutes: number;
  planned_start: string;   // ISO-строка
  due_datetime: string;    // ISO-строка
  movable: boolean;
  priority: "A" | "B" | "C";
  type: "connection" | "service" | "incident";
  executor_ids: number[];
  notes?: string;
  contract_number?: string | null;
}

// Данные для обновления задачи
export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: "scheduled" | "in_progress" | "done" | "cancelled";
  actual_end?: string;    // ISO-строка
}

const BASE = process.env.NEXT_PUBLIC_API_URL!.replace(/\/+$/, "");

// --------------------- Задачи ---------------------

/**
 * Получает список всех задач (Task[]).
 */
export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE}/tasks`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Не удалось загрузить задачи: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Создаёт новую задачу. 
 * @param data — объект CreateTaskData (поля задачи)
 * @param userId — ID текущего пользователя (X-User-Id)
 */
export async function createTask(
  data: CreateTaskData,
  userId: number
): Promise<Task> {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": String(userId),
    },
    body: JSON.stringify({
      ...data,
      latitude: data.lat ?? null,  
      longitude: data.lng ?? null,
    }),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось создать задачу: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Обновляет существующую задачу (PUT /tasks/{id}).
 * @param id — task_id
 * @param data — частичный объект UpdateTaskData
 * @param userId — ID текущего пользователя (X-User-Id)
 */
export async function updateTask(
  id: number,
  data: UpdateTaskData,
  userId: number
): Promise<Task> {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": String(userId),
    },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось обновить задачу #${id}: ${res.status} ${text}`);
  }
  return res.json();
}

// -------------------- Исполнители --------------------

/**
 * Получает список всех исполнителей (Executor[]).
 */
export async function getExecutors(): Promise<Executor[]> {
  const res = await fetch(`${BASE}/executors`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Не удалось загрузить исполнителей: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ------------------- Подписчики --------------------

/**
 * Получает список всех подписчиков (Subscriber[]).
 * Используется, чтобы один раз загрузить всех абонентов и передать 
 * их в CreateTask (или в любой другой компонент), чтобы не делать 
 * повторных запросов при каждом открытии модального окна.
 */
export async function getSubscribers(): Promise<Subscriber[]> {
  const res = await fetch(`${BASE}/subscribers`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Не удалось загрузить подписчиков: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Данные для создания нового подписчика
export interface CreateSubscriberData {
  contract_number: string;
  surname?: string | null;
  name?: string | null;
  patronymic?: string | null;
  city: string;
  district?: string | null;
  street?: string | null;
  house: string;
  latitude: number;
  longitude: number;
  yandex_address: string;
  status?: "active" | "inactive";
}

/**
 * Создаёт нового подписчика.
 */
export async function createSubscriber(
  data: CreateSubscriberData
): Promise<Subscriber> {
  console.log("POST to:", `${BASE}/subscribers`);
  const res = await fetch(`${BASE}/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось создать подписчика: ${res.status} ${text}`);
  }
  return res.json();
}

// ───────────────────────────────────────────────────────────────────────────────
// Методы для работы с рабочим временем исполнителей
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Получает список записей рабочего времени за указанный период (from…to).
 * 
 * @param from ISO-дата начала периода (например, "2025-06-01")
 * @param to   ISO-дата конца периода (например, "2025-06-07")
 * @returns    Promise<WorkTimeRecord[]> — массив записей.
 */
export async function getWorkTimes(
  from: string,
  to: string
): Promise<WorkTimeRecord[]> {
  // Если нужен заголовок X-User-Id, можно его добавить по примеру из задач:
  // const res = await fetch(`${BASE}/work_times?from=${from}&to=${to}`, {
  //   headers: { "X-User-Id": String(userId) },
  //   credentials: "include"
  // });
  const res = await fetch(`${BASE}/work_times?from=${from}&to=${to}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось загрузить work_times: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Создаёт новую запись рабочего времени для исполнителя.
 * 
 * @param data  Объект CreateWorkTimeData с exec_id, work_date, work_minutes.
 * @param userId (опционально) если бэкенд требует X-User-Id, передайте сюда ID.
 */
export async function createWorkTime(
  data: CreateWorkTimeData,
  userId?: number
): Promise<WorkTimeRecord> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId !== undefined) {
    headers["X-User-Id"] = String(userId);
  }

  const res = await fetch(`${BASE}/work_times`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось создать work_time: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Обновляет существующую запись рабочего времени (PUT /work_times/{id}).
 * 
 * @param id    ID записи, которую хотим обновить.
 * @param data  Объект Partial<CreateWorkTimeData> — поля, которые нужно изменить.
 * @param userId (опционально) если бэкенд требует X-User-Id, передайте сюда ID.
 */
export async function updateWorkTime(
  id: number,
  data: UpdateWorkTimeData,
  userId: number
): Promise<WorkTimeRecord> {
  const res = await fetch(`${BASE}/work_times/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": String(userId),
    },
    body: JSON.stringify({
      ...data, // Здесь мы передаем все данные, включая exec_id и work_date
    }),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось обновить work_time #${id}: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Удаляет запись рабочего времени по её ID (DELETE /work_times/{id}).
 * 
 * @param id    ID записи, которую хотим удалить.
 * @param userId (опционально) если бэкенд требует X-User-Id, передайте сюда ID.
 * @returns     Promise<void> (ничего не возвращает при успехе).
 */
export async function deleteWorkTime(
  id: number,
  userId?: number
): Promise<void> {
  const headers: Record<string, string> = {};
  if (userId !== undefined) {
    headers["X-User-Id"] = String(userId);
  }

  const res = await fetch(`${BASE}/work_times/${id}`, {
    method: "DELETE",
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось удалить work_time #${id}: ${res.status} ${text}`);
  }
}
