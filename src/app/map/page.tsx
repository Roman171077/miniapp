//src/app/map/page.jsx
"use client";

import { useState, useEffect, useRef } from "react";

type Coord = {
  latitude: number;
  longitude: number;
  recorded_at: string; // формат "YYYY-MM-DD HH:MM:SS" в UTC
};

export default function PlaybackPage() {
  // Текущая дата (YYYY-MM-DD)
  const [date, setDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const [coords, setCoords] = useState<Coord[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Ссылки на DOM-контейнер, карту и метку
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const markInst = useRef<any>(null);

  // 1) Загрузка координат при смене даты
  useEffect(() => {
    async function load() {
      const base = process.env.NEXT_PUBLIC_API_URL;
      try {
        const res = await fetch(
          `${base}/beacon-coordinates?date_str=${date}`
        );
        if (!res.ok) {
          console.warn("Нет данных или ошибка:", res.status);
          setCoords([]);
          setIndex(0);
          return;
        }
        const data: Coord[] = await res.json();
        setCoords(data);
        setIndex(0);
      } catch (e) {
        console.error("Ошибка fetch:", e);
        setCoords([]);
        setIndex(0);
      }
    }
    load();
  }, [date]);

  // 2) Инициализация карты и метки или просто обновление при index
  useEffect(() => {
    if (!coords.length || !window.ymaps) return;

    window.ymaps.ready(() => {
      const { latitude, longitude, recorded_at } = coords[index];
      // Принудительно парсим как UTC
      const dtUtc = new Date(recorded_at.replace(" ", "T") + "Z");
      // Форматируем в Иркутск
      const irkutTime = dtUtc.toLocaleString("ru-RU", {
        timeZone: "Asia/Irkutsk",
        hour12: false,
      });

      if (!mapInst.current) {
        mapInst.current = new window.ymaps.Map(mapRef.current!, {
          center: [latitude, longitude],
          zoom: 12,
        });
        markInst.current = new window.ymaps.Placemark(
          [latitude, longitude],
          { balloonContent: irkutTime },
          { preset: "islands#redCircleDotIcon" }
        );
        mapInst.current.geoObjects.add(markInst.current);
        mapInst.current.container.fitToViewport();
      } else {
        markInst.current.geometry.setCoordinates([latitude, longitude]);
        markInst.current.properties.set("balloonContent", irkutTime);
        mapInst.current.panTo([latitude, longitude], { duration: 300 });
      }
    });
  }, [coords, index]);

  // 3) Проигрывание с учётом выбранной скорости
  useEffect(() => {
    if (!playing || coords.length < 2) return;
    const interval = 1000 / speed;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % coords.length);
    }, interval);
    return () => clearInterval(timer);
  }, [playing, coords, speed]);

  return (
    <div className="p-5">
      <h1 className="mb-4">Проигрыватель маршрута</h1>

      {/* Выбор даты */}
      <div className="mb-4">
        <label>
          Дата:&nbsp;
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      {/* Управление воспроизведением */}
      <div className="mb-4 flex items-center gap-4">
        <button onClick={() => setPlaying((p) => !p)}>
          {playing ? "⏸ Стоп" : "▶️ Старт"}
        </button>

        <span>
          {coords[index]
            ? new Date(coords[index].recorded_at.replace(" ", "T") + "Z")
                .toLocaleString("ru-RU", {
                  timeZone: "Asia/Irkutsk",
                  hour12: false,
                })
            : "--:--:--"}
        </span>

        <label>
          Скорость:&nbsp;
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </label>
      </div>

      {/* Ползунок */}
      {coords.length > 0 ? (
        <input
          type="range"
          min={0}
          max={coords.length - 1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="w-full mb-4"
        />
      ) : (
        <p>Нет данных для {date}</p>
      )}

      {/* Контейнер для карты */}
      <div ref={mapRef} className="w-full h-[400px] border border-gray-300" />
    </div>
  );
}
