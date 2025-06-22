// src/lib/types.ts

// ====================== Исполнители ======================

export interface Executor {
  exec_id: number;
  surname: string;
  name?: string;
  phone?: string;
  id_telegram?: number;
  role?: "admin" | "user" | "guest" | "master" | "reserve";
  // При желании можно добавить другие поля, которые возвращает ваш API
}

// ======================= Задачи =========================

export interface Task {
  task_id: number;
  address_raw: string;
  latitude: number;
  longitude: number;
  service_minutes: number;
  planned_start: string;   // ISO-строка, например "2025-06-01T09:00:00Z"
  due_datetime: string;    // ISO-строка, например "2025-06-01T23:59:00Z"
  movable: boolean;
  priority: "A" | "B" | "C";
  type: "connection" | "service" | "incident";
  executors: Executor[];   // вложенный массив исполнителей
  status: "scheduled" | "in_progress" | "done" | "cancelled";
  notes?: string | null;
  contract_number?: string | null;
  actual_end?: string | null;

  // Опционально, если вы используете логику «детектов»
  detected_start?: string | null;
  detected_end?: string | null;
  detect_confidence?: number | null;
  actual_start?: string | null;

  // Метаданные
  created_at?: string;
  updated_at?: string;
  last_modified_by?: number | null;
}

// Вариант «редактируемой» задачи, который используют модалки CreateTask/TaskModal
export interface EditableTask extends Task {
  _planned_at: string;      // локальная строка для <input type="datetime-local">
  _due_dt: string;          // локальная строка для <input type="datetime-local">
  _service_min: number;     // время на выполнение (Min), локально
  executorIds: number[];    // массив идентификаторов исполнителей (exec_id)
  notes: string;            // комментарии (не null)
  contract_number: string;  // договор (строка, не null)
}


// ==================== Подписчики (Subscribers) ====================

/**
 * Интерфейс Subscriber соответствует модели Subscriber в БД:
 * - contract_number (PK)
 * - фамилия, имя, отчество
 * - адрес (city, district, street, house)
 * - координаты (latitude, longitude)
 * - yandex_address
 * - статус (active/inactive)
 */
export interface Subscriber {
  contract_number: string;
  surname: string;
  name: string;
  patronymic?: string | null;
  city: string;
  district?: string | null;
  street: string;
  house: string;
  latitude: number;
  longitude: number;
  yandex_address: string;
  status: "active" | "inactive";

  // Если нужно, можно добавить timestamps или другие поля
  // created_at?: string;
  // updated_at?: string;
}

/**
 * Запись рабочего времени исполнителя.
 */
export interface WorkTimeRecord {
  id: number;
  exec_id: number;
  surname: string;
  name: string | null;
  work_date: string;  // ISO-строка
  work_minutes: number;
}

/**
 * Данные для создания новой записи рабочего времени.
 */
export interface CreateWorkTimeData {
  exec_id: number;
  work_date: string;   // ISO-строка
  work_minutes: number;
}

/**
 * Данные для обновления записи рабочего времени.
 * Все поля необязательные.
 */
export type UpdateWorkTimeData = Partial<CreateWorkTimeData>;
