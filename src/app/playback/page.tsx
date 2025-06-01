"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";

type Coord = {
  latitude: number;
  longitude: number;
  recorded_at: string;
};

export default function PlaybackPage() {
  // 1) Выбираем дату (по умолчанию — сегодня)
  const [date, setDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [coords, setCoords] = useState<Coord[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  // refs для карты и метки
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const markInst = useRef<any>(null);

  // 2) Фетчим координаты при смене date
  useEffect(() => {
    async function load() {
        const res = await fetch(`http://localhost:8000/beacon-coordinates?date_str=${date}`);
      const data: Coord[] = await res.json();
      setCoords(data);
      setIndex(0);
    }
    load();
  }, [date]);

  // 3) Инициализация/обновление карты и метки
  useEffect(() => {
    if (!coords.length || !window.ymaps) return;

    window.ymaps.ready(() => {
      const [lat, lon] = [coords[index].latitude, coords[index].longitude];

      if (!mapInst.current) {
        // первый рендер: создаём карту и метку
        mapInst.current = new window.ymaps.Map(mapRef.current!, {
          center: [lat, lon],
          zoom: 12,
        });
        markInst.current = new window.ymaps.Placemark(
          [lat, lon],
          { balloonContent: coords[index].recorded_at },
          { preset: "islands#redCircleDotIcon" }
        );
        mapInst.current.geoObjects.add(markInst.current);
        mapInst.current.container.fitToViewport();
      } else {
        // при смене index просто двигаем метку
        markInst.current.geometry.setCoordinates([lat, lon]);
        markInst.current.properties.set("balloonContent", coords[index].recorded_at);
        mapInst.current.panTo([lat, lon], { duration: 300 });
      }
    });
  }, [coords, index]);

  // 4) «Проигрывание» — секунду на шаг
  useEffect(() => {
    if (!playing || coords.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % coords.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, coords]);

  return (
    <div style={{ padding: 20 }}>
      {/* Подгружаем скрипт один раз */}
      <Script
        src={`https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_API_KEY}&lang=ru_RU`}
        strategy="beforeInteractive"
      />

      <h1>Проигрыватель маршрута</h1>

      {/* Выбор даты */}
      <label>
        Дата:&nbsp;
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      {/* Управление воспроизведением */}
      <div style={{ margin: "10px 0" }}>
        <button onClick={() => setPlaying((p) => !p)}>
          {playing ? "⏸ Стоп" : "▶️ Старт"}
        </button>
        <span style={{ marginLeft: 15 }}>
          {coords[index]?.recorded_at ?? "--"}
        </span>
      </div>

      {/* Ползунок */}
      <input
        type="range"
        min={0}
        max={coords.length ? coords.length - 1 : 0}  // Добавляем защиту
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        style={{ width: "100%" }}
      />
      {/* Контейнер для карты */}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "400px", marginTop: 20 }}
      />
    </div>
  );
}
