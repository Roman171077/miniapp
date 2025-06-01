// src/components/Task/TaskList.tsx
import React from 'react'
import TaskRow from './TaskRow'
import { Task } from '@/lib/types'

export interface TaskListProps {
  /** Заголовок группы: дата выполнения задач */
  date: string
  /** Список задач, подготовленных для вывода */
  tasks: (Task & {
    planned_start_local: string
    executorsNames: string
  })[]
  /** Колбэк на нажатие "Выполнено" */
  onDone: (task: Task) => void
  /** Колбэк на нажатие "Отменить" */
  onCancel: (task: Task) => void
  /** Колбэк на клик по строке задачи */
  onRowClick: (task: Task) => void
}

export default function TaskList({
  date,
  tasks,
  onDone,
  onCancel,
  onRowClick,
}: TaskListProps) {
  return (
    <div className="mt-5">
      <h2 className="text-xl font-medium">{date}</h2>
      <ul className="list-none p-0">
        {tasks.map((t) => (
          <TaskRow
            key={t.task_id}
            task={t}
            onDone={onDone}
            onCancel={onCancel}
            onClick={onRowClick}
          />
        ))}
      </ul>
    </div>
  )
}
