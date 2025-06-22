"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getSubscribers } from "@/lib/api/tasks";
import { Subscriber } from "@/lib/types";
import SubscriberList from "@/components/Task/SubscriberList";

/* ---------- helpers ---------- */
const normalize = (s: string) => s.toLowerCase().replace(/[\s,.-]/g, "");
const tokensPrefix = (q: string, t: string) => {
  const toks = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!toks.length) return false;
  const words = t.toLowerCase().split(/\s+/);
  return toks.every(tok => words.some(w => w.startsWith(tok)));
};
const cmpStr = (a: string, b: string) => a.localeCompare(b, "ru");
const cmpHouse = (a: string, b: string) => {
  const na = parseInt(a, 10), nb = parseInt(b, 10);
  return !isNaN(na) && !isNaN(nb) && na !== nb ? na - nb : cmpStr(a, b);
};
const cmpSubs = (a: Subscriber, b: Subscriber) =>
  cmpStr(a.city, b.city) ||
  cmpStr(a.district ?? "", b.district ?? "") ||
  cmpStr(a.street ?? "", b.street ?? "") ||
  cmpHouse(a.house.toString(), b.house.toString());

interface HouseItem {
  display: string;
  house: string;
  city: string;
  district: string;
  street: string;
}

/* =============== компонент =============== */
export default function SubscribersSearchTwoField() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);

  /* поля */
  const [addressVal, setAddressVal] = useState("");
  const [houseVal, setHouseVal]     = useState("");

  /* подсказки */
  const [addrSug,  setAddrSug]  = useState<string[]>([]);
  const [houseSug, setHouseSug] = useState<string[]>([]);

  const [addrKey, setAddrKey] = useState<string | null>(null);
  const [filtered, setFiltered] = useState<Subscriber[]>([]);

  /* ---------- загрузка ---------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data   = await getSubscribers();
      const sorted = [...data].sort(cmpSubs);  // единожды сортируем
      setSubs(sorted);
      setFiltered(sorted);
      setLoading(false);
    })();
  }, []);

  /* ---------- shortList + houseMap ---------- */
  const { shortList, houseMap } = useMemo(() => {
    const short: { display: string; key: string }[] = [];
    const map = new Map<string, HouseItem[]>();

    subs.forEach(s => {
      const dispAddr = [s.city, s.district, s.street].filter(Boolean).join(" ");
      const key = normalize(dispAddr);

      if (!short.find(it => it.key === key)) short.push({ display: dispAddr, key });

      const item: HouseItem = {
        display: `${dispAddr} ${s.house}`,
        house: s.house.toString(),
        city: s.city,
        district: s.district ?? "",
        street: s.street ?? "",
      };
      map.set(key, [...(map.get(key) ?? []), item].sort((a, b) =>
        cmpStr(a.city, b.city) ||
        cmpStr(a.district, b.district) ||
        cmpStr(a.street, b.street) ||
        cmpHouse(a.house, b.house)
      ));
    });

    short.sort((a, b) => cmpStr(a.display, b.display));
    return { shortList: short, houseMap: map };
  }, [subs]);

  /* ---------- подсказки адреса ---------- */
  const refreshAddrSug = useCallback((val: string) => {
    const q = val.trim();
    const list = q
      ? shortList.filter(it => tokensPrefix(q, it.display)).slice(0, 10)
      : shortList.slice(0, 10);
    setAddrSug(list.map(it => it.display));
  }, [shortList]);

  /* ---------- подсказки домов ---------- */
  const buildHousePool = useCallback((): HouseItem[] => {
    if (addrKey && houseMap.has(addrKey)) return houseMap.get(addrKey)!;

    if (addressVal.trim()) {
      return [...houseMap.values()].flat()
        .filter(h => tokensPrefix(addressVal, h.display));
    }
    return [...houseMap.values()].flat();
  }, [addrKey, addressVal, houseMap]);

  const refreshHouseSug = useCallback((val: string) => {
    const pool = buildHousePool();
    const list = val
      ? pool.filter(h => h.house.toLowerCase().startsWith(val.toLowerCase()))
      : pool;
    setHouseSug(list.map(h => h.display));
  }, [buildHousePool]);

  /* ---------- очистители ---------- */
  const clearAddress = () => {
    setAddressVal(""); setAddrKey(null);
    setAddrSug([]); setHouseVal(""); setHouseSug([]);
  };
  const clearHouse = () => {
    setHouseVal(""); setHouseSug([]);
  };

  /* ---------- «Найти» с поддержкой диапазонов ---------- */
  const handleFind = () => {
    const addrQuery = addressVal.trim();
    const houseQuery = houseVal.trim().replace(/\s+/g, "");

    /* проверяем: есть ли дефис внутри строки дома */
    const rangeRE = /^(\d*)-(\d*)$/;   // группа 1 = start?, группа 2 = end?
    const m = houseQuery.match(rangeRE);

    const res = subs.filter(s => {
      /* --- фильтр по адресу --- */
      const disp = [s.city, s.district, s.street].filter(Boolean).join(" ");
      const okAddr = addrQuery ? tokensPrefix(addrQuery, disp) : true;

      /* --- фильтр по дому --- */
      let okHouse = true;
      if (m) {
        const [ , startStr, endStr ] = m;
        const n = parseInt(s.house.toString(), 10);          // числовая часть дома
        const start = startStr ? parseInt(startStr, 10) : null;
        const end   = endStr   ? parseInt(endStr,   10) : null;

        okHouse =
          (start !== null ? n >= start : true) &&
          (end   !== null ? n <= end   : true);
      } else if (houseQuery) {
        okHouse = s.house.toString().toLowerCase().startsWith(houseQuery.toLowerCase());
      }
      return okAddr && okHouse;
    });

    setFiltered(res);   // порядок сохраняется, т.к. subs уже отсортирован
  };

  /* ---------- UI ---------- */
  if (loading) return <p className="text-center">Загрузка…</p>;

  return (
    <div className="p-5 max-w-xl mx-auto space-y-4">
      <h1 className="text-center font-bold text-xl mb-2">Абоненты</h1>

      {/* ===== Адрес ===== */}
      <div className="relative">
        <label className="block text-sm text-gray-600 mb-1">Адрес</label>
        <input
          value={addressVal}
          onChange={e => {
            const v = e.target.value;
            setAddressVal(v); setAddrKey(null);
            setHouseVal(""); setHouseSug([]);
            refreshAddrSug(v);
          }}
          onFocus={() => refreshAddrSug(addressVal)}
          onBlur={() => setTimeout(() => setAddrSug([]), 100)}
          placeholder="Город район улица"
          className="w-full p-2 border rounded placeholder:text-gray-400 pr-8"
        />
        {addressVal && (
          <button
            onClick={clearAddress}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            ×
          </button>
        )}
        {addrSug.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto shadow-lg">
            {addrSug.map((s, i) => (
              <li
                key={i}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => {
                  setAddressVal(s); setAddrKey(normalize(s)); setAddrSug([]);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== Дом ===== */}
      <div className="relative">
        <label className="block text-sm text-gray-600 mb-1">Дом</label>
        <input
          value={houseVal}
          onChange={e => { setHouseVal(e.target.value); refreshHouseSug(e.target.value); }}
          onFocus={() => refreshHouseSug(houseVal)}
          onBlur={() => setTimeout(() => setHouseSug([]), 100)}
          placeholder="Номер дома или диапазон 5-10"
          className="w-full p-2 border rounded placeholder:text-gray-400 pr-8"
        />
        {houseVal && (
          <button
            onClick={clearHouse}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            ×
          </button>
        )}
        {houseSug.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto shadow-lg">
            {houseSug.map((s, i) => (
              <li
                key={i}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => {
                  const h = s.split(/\s+/).pop()!;
                  setHouseVal(h); setHouseSug([]);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== Найти ===== */}
      <button
        onClick={handleFind}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Найти
      </button>

      {/* список абонентов */}
      <SubscriberList subscribers={filtered} />
    </div>
  );
}
