// src/lib/api/tasks.ts

import { Task, Executor, Subscriber } from "../types";

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