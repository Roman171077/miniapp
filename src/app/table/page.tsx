"use client";

import { useEffect, useMemo, useState } from "react";
import { eachDayOfInterval, formatISO, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { getExecutors, getWorkTimes } from "@/lib/api/tasks"; // Используем только методы для получения данных
import { Executor, WorkTimeRecord } from "@/lib/types"; // Импортируем типы
import { useUserRole } from "@/context/UserRoleContext";

export default function TablePage() {
  const { loading } = useUserRole();

  // Состояния для ввода диапазона
  const [fromDate, setFromDate] = useState<string>(""); // ISO, например "2025-06-01"
  const [toDate, setToDate] = useState<string>("");     // ISO, например "2025-06-30"

  // Загруженные с сервера данные
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [records, setRecords] = useState<WorkTimeRecord[]>([]);

  // Устанавливаем даты по умолчанию при монтировании компонента
  useEffect(() => {
    const currentDate = new Date();

    // Первый день текущего месяца
    const firstDayOfMonth = startOfMonth(currentDate);
    // Последний день текущего месяца
    const lastDayOfMonth = endOfMonth(currentDate);

    setFromDate(formatISO(firstDayOfMonth, { representation: "date" }));
    setToDate(formatISO(lastDayOfMonth, { representation: "date" }));
  }, []);

  useEffect(() => {
    getExecutors()
      .then((list) => setExecutors(list))
      .catch((err) => {
        console.error("Ошибка загрузки исполнителей:", err);
        setExecutors([]);
      });
  }, []);

  useEffect(() => {
    if (!fromDate || !toDate) {
      setRecords([]);
      return;
    }

    const d0 = parseISO(fromDate);
    const d1 = parseISO(toDate);
    if (d0 > d1) {
      setRecords([]);
      return;
    }

    getWorkTimes(fromDate, toDate)
      .then((arr) => setRecords(arr))
      .catch((err) => {
        console.error("Ошибка загрузки work_times:", err);
        setRecords([]);
      });
  }, [fromDate, toDate]);

  const tableData = useMemo(() => {
    if (!fromDate || !toDate) return [];

    const allDates: string[] = eachDayOfInterval({
      start: parseISO(fromDate),
      end: parseISO(toDate),
    }).map((d) => formatISO(d, { representation: "date" }));

    const mapByKey = new Map<string, WorkTimeRecord>();
    records.forEach((rec) => {
      const key = `${rec.exec_id}|${rec.work_date}`;
      mapByKey.set(key, rec);
    });

    const result: any[] = [];

    executors.forEach((exe) => {
      const row: any = { exec_id: exe.exec_id, surname: exe.surname, name: exe.name };

      allDates.forEach((dt) => {
        const key = `${exe.exec_id}|${dt}`;
        const existing = mapByKey.get(key);
        row[dt] = existing ? existing.work_minutes : 0;
      });

      result.push(row);
    });

    return result;
  }, [executors, records, fromDate, toDate]);

  const [editableData, setEditableData] = useState<typeof tableData>([]);
  useEffect(() => {
    setEditableData(tableData);
  }, [tableData]);

  // Убираем редактирование данных
  const handleSaveAll = () => {
    alert("Редактирование невозможно на этой странице.");
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Табель рабочего времени</h1>

      {/* Поля выбора диапазона дат */}
      <div className="flex gap-6 mb-4">
        <label className="flex flex-col">
          <span className="mb-1">Дата (от):</span>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="mb-1">Дата (до):</span>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>

      {/* Если диапазон некорректный — предупреждение */}
      {fromDate && toDate && parseISO(fromDate) > parseISO(toDate) && (
        <p className="text-red-600 mb-4">
          Внимание: дата «от» должна быть раньше (или равна) дате «до».
        </p>
      )}

      {/* Таблица */}
      {fromDate && toDate && parseISO(fromDate) <= parseISO(toDate) ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Исполнитель</th>
                {eachDayOfInterval({
                  start: parseISO(fromDate),
                  end: parseISO(toDate),
                })
                  .map((date) => formatISO(date, { representation: "date" }))
                  .map((dateStr) => (
                    <th key={dateStr} className="border p-2">
                      {dateStr}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={row.exec_id}>
                  <td className="border p-2">{row.surname} {row.name}</td>
                  {Object.keys(row)
                    .filter((key) => key !== "exec_id" && key !== "surname" && key !== "name")
                    .map((key) => (
                      <td key={key} className="border p-2">
                        {row[key]}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">Пожалуйста, выберите корректный диапазон дат.</p>
      )}
    </div>
  );
}
