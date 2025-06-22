"use client";

import { useEffect, useMemo, useState } from "react";
import { eachDayOfInterval, formatISO, parseISO } from "date-fns";
import { getExecutors, getWorkTimes, createWorkTime, updateWorkTime } from "@/lib/api/tasks";
import { Executor, WorkTimeRecord } from "@/lib/types"; // импортируем типы
import { useUserRole } from "@/context/UserRoleContext";

export default function WorkTimePage() {
  const { role, loading } = useUserRole();

  // Состояния для ввода диапазона
  const [fromDate, setFromDate] = useState<string>(""); // ISO, например "2025-06-01"
  const [toDate, setToDate] = useState<string>("");     // ISO, например "2025-06-07"

  // Загруженные с сервера данные
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [records, setRecords] = useState<WorkTimeRecord[]>([]);

  // 1. Устанавливаем текущие даты по умолчанию при монтировании компонента
  useEffect(() => {
    const currentDate = formatISO(new Date(), { representation: "date" });
    setFromDate(currentDate); // Текущая дата для "с"
    setToDate(currentDate);   // Текущая дата для "по"
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

const handleSaveAll = async () => {
  const userId = 123; // Замените на реальный userId из вашего контекста

  const promises: Promise<any>[] = editableData.map((row) => {
    const updatePromises: Promise<any>[] = [];
    Object.keys(row).forEach((key) => {
      if (key !== "exec_id" && key !== "surname" && key !== "name") {
        const workMinutes = row[key];
        if (workMinutes === undefined) return;

        const existingRecord = records.find(
          (r) => r.exec_id === row.exec_id && r.work_date === key
        );

        if (existingRecord) {
          // Если запись существует, проверяем, передаются ли все необходимые поля
          updatePromises.push(
            updateWorkTime(existingRecord.id, {
              exec_id: existingRecord.exec_id,    // Передаем exec_id
              work_date: existingRecord.work_date, // Передаем work_date
              work_minutes: workMinutes,           // Передаем work_minutes
            }, userId)
          );
        } else {
          // Если записи нет, создаем новую
          updatePromises.push(
            createWorkTime(
              {
                exec_id: row.exec_id,
                work_date: key, // Добавляем work_date
                work_minutes: workMinutes, // Добавляем work_minutes
              },
              userId
            )
          );
        }
      }
    });

    return Promise.all(updatePromises);
  });

  try {
    await Promise.all(promises);
    const fresh = await getWorkTimes(fromDate, toDate);
    setRecords(fresh);
    alert("Данные успешно сохранены");
  } catch (err: any) {
    console.error("Ошибка при сохранении:", err);
    alert("Не удалось сохранить: " + err.message);
  }
};


  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }
  if (role !== "admin") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-3">Доступ запрещён</h1>
        <p>Только администратор может видеть эту страницу.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Учёт рабочего времени</h1>

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
              {editableData.map((row, idx) => (
                <tr key={row.exec_id}>
                  <td className="border p-2">{row.surname} {row.name}</td>
                  {Object.keys(row)
                    .filter((key) => key !== "exec_id" && key !== "surname" && key !== "name")
                    .map((key) => (
                      <td key={key} className="border p-2">
                        <input
                          type="number"
                          className="w-20 border p-1"
                          value={row[key]}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            const updatedData = [...editableData];
                            updatedData[idx] = {
                              ...updatedData[idx],
                              [key]: isNaN(newValue) ? 0 : newValue,
                            };
                            setEditableData(updatedData);
                          }}
                        />
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSaveAll}
          >
            Сохранить всё
          </button>
        </div>
      ) : (
        <p className="text-gray-600">Пожалуйста, выберите корректный диапазон дат.</p>
      )}
    </div>
  );
}
