// SubscribersSearchTwoField.tsx
// – два поля (Адрес, Дом)
// – подсказки с subsequence-поиском и полной сортировкой
// – сортировка результатов по город → район → улица → дом

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Fuse from "fuse.js";
import { getSubscribers } from "@/lib/api/tasks";
import { Subscriber } from "@/lib/types";
import SubscriberList from "@/components/Task/SubscriberList";

/* ------------------------- helpers: нормализация ------------------- */
const normalize = (str: string) => str.toLowerCase().replace(/[\s,.-]/g, "");

/* subsequence-поиск:  "анр" ⟹ "Ангарск"  */
function subsequenceMatch(token: string, target: string) {
  let j = 0;
  token = token.toLowerCase();
  target = target.toLowerCase();
  for (let i = 0; i < target.length && j < token.length; i++) {
    if (token[j] === target[i]) j++;
  }
  return j === token.length;
}

/* мульти-токенный subsequence: "анр жк" → ... */
function tokenFuzzyMatch(query: string, target: string) {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  const tgt = target.toLowerCase();
  return tokens.every(tok => subsequenceMatch(tok, tgt));
}

/* ---------------------- helpers: сортировка ------------------------ */
const cmpStr = (a: string, b: string) => a.localeCompare(b, "ru");
const cmpHouse = (a: string, b: string) => {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
  return cmpStr(a, b);
};

function cmpHouses(a: HouseItem, b: HouseItem) {
  return (
    cmpStr(a.city, b.city)      ||
    cmpStr(a.district, b.district) ||
    cmpStr(a.street, b.street)  ||
    cmpHouse(a.house, b.house)
  );
}

function cmpSubs(a: Subscriber, b: Subscriber) {
  return (
    cmpStr(a.city, b.city)                               ||
    cmpStr(a.district ?? "", b.district ?? "")           ||
    cmpStr(a.street ?? "", b.street ?? "")               ||
    cmpHouse(a.house.toString(), b.house.toString())
  );
}

/* ------------------- тип для списка домов ------------------------- */
interface HouseItem {
  display: string;
  house: string;
  city: string;
  district: string;
  street: string;
}

/* ===================== основной компонент ========================= */
export default function SubscribersSearchTwoField() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);

  /* --- значения полей --- */
  const [addressVal, setAddressVal] = useState("");
  const [houseVal, setHouseVal] = useState("");

  /* --- подсказки --- */
  const [addrSug, setAddrSug]   = useState<string[]>([]);
  const [houseSug, setHouseSug] = useState<string[]>([]);

  /* --- фиксированный ключ адреса (city|district|street) --- */
  const [addrKey, setAddrKey] = useState<string | null>(null);

  /* --- найденные абоненты --- */
  const [filtered, setFiltered] = useState<Subscriber[]>([]);

  /* ------------------- загрузка подписчиков ------------------------ */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubscribers();
      setSubs(data);
      setFiltered(data.sort(cmpSubs));      // сразу отсортировано
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* -------- подготовка короткого списка и карты домов ------------- */
  const { shortList, houseMap } = useMemo(() => {
    const short: { display: string; key: string }[] = [];
    const houses = new Map<string, HouseItem[]>();

    subs.forEach(s => {
      const dispAddr = [s.city, s.district, s.street].filter(Boolean).join(", ");
      const key = normalize(dispAddr);
      if (!short.find(it => it.key === key)) short.push({ display: dispAddr, key });

      const dispFull = `${dispAddr}, ${s.house}`;
      const item: HouseItem = {
        display: dispFull,
        house: s.house.toString(),
        city: s.city,
        district: s.district ?? "",
        street: s.street ?? "",
      };
      if (!houses.has(key)) houses.set(key, []);
      houses.get(key)!.push(item);
    });

    /* сортируем каждую улицу внутри карты сразу */
    houses.forEach(arr => arr.sort(cmpHouses));

    return { shortList: short, houseMap: houses };
  }, [subs]);

  /* ---------------- подсказки для поля «Адрес» --------------------- */
  const refreshAddrSug = useCallback((val: string) => {
    const q = val.trim();
    let list: string[];
    if (q) {
      list = shortList
        .filter(it => tokenFuzzyMatch(q, it.display))
        .slice(0, 10)
        .map(it => it.display);
    } else {
      list = shortList.slice(0, 10).map(it => it.display);
    }
    setAddrSug(list);
  }, [shortList]);

  const handleAddrChange = (val: string) => {
    setAddressVal(val);
    setAddrKey(null);
    setHouseVal("");
    setHouseSug([]);
    refreshAddrSug(val);
  };
  const handleAddrFocus = () => refreshAddrSug(addressVal);
  const handleAddrBlur  = () => setTimeout(() => setAddrSug([]), 100);
  const handleAddrSelect = (display: string) => {
    setAddressVal(display);
    setAddrSug([]);
    setAddrKey(normalize(display));
  };

  /* ---------------- подсказки для поля «Дом» ----------------------- */
  const buildHousePool = useCallback((): HouseItem[] => {
    if (addrKey && houseMap.has(addrKey)) return houseMap.get(addrKey)!;

    /* если адрес введён вручную, fuzzy-ищем совпадения */
    if (addressVal.trim()) {
      const fuse = new Fuse(Array.from(houseMap.values()).flat(), {
        keys: ["display"], threshold: 0.3, ignoreLocation: true,
      });
      return fuse.search(addressVal).map(r => r.item as HouseItem);
    }
    /* иначе весь список */
    return Array.from(houseMap.values()).flat();
  }, [addrKey, addressVal, houseMap]);

  const refreshHouseSug = useCallback((val: string) => {
    const pattern = val.toLowerCase();
    const pool = buildHousePool().sort(cmpHouses);
    const filtered = pattern
      ? pool.filter(x => x.house.toLowerCase().startsWith(pattern))
      : pool;
    setHouseSug(filtered.map(x => x.display));   // теперь без ограничения
  }, [buildHousePool]);

  const handleHouseChange = (val: string) => {
    setHouseVal(val);
    refreshHouseSug(val);
  };
  const handleHouseFocus  = () => refreshHouseSug(houseVal);
  const handleHouseBlur   = () => setTimeout(() => setHouseSug([]), 100);
  const handleHouseSelect = (display: string) => {
    const parts = display.split(/,\s*/);
    setHouseVal(parts[parts.length - 1]);   // вставляем ТОЛЬКО дом
    setHouseSug([]);
  };

  /* -------------------------- кнопка «Найти» ------------------------ */
  const handleFind = () => {
    const addrNorm  = normalize(addressVal);
    const houseNorm = houseVal.toLowerCase();

    const res = subs.filter(s => {
      const key = normalize([s.city, s.district, s.street].filter(Boolean).join(", "));
      const houseStr = s.house.toString().toLowerCase();
      return (addrNorm ? key.includes(addrNorm) : true) &&
             (houseNorm ? houseStr.startsWith(houseNorm) : true);
    }).sort(cmpSubs);
    setFiltered(res);
  };

  /* ---------------------------- UI ---------------------------------- */
  if (loading) return <p className="text-center">Загрузка…</p>;

  return (
    <div className="p-5 max-w-xl mx-auto space-y-4">
      <h1 className="text-center font-bold text-xl mb-2">Абоненты</h1>

      {/* === Поле «Адрес» === */}
      <div className="relative">
        <label className="block text-sm text-gray-600 mb-1">Адрес</label>
        <input
          value={addressVal}
          onChange={e => handleAddrChange(e.target.value)}
          onFocus={handleAddrFocus}
          onBlur={handleAddrBlur}
          placeholder="Город, район, улица"
          className="w-full p-2 border rounded placeholder:text-gray-400"
        />
        {addrSug.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto shadow-lg">
            {addrSug.map((s, i) => (
              <li
                key={i}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => handleAddrSelect(s)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* === Поле «Дом» === */}
      <div className="relative">
        <label className="block text-sm text-gray-600 mb-1">Дом</label>
        <input
          value={houseVal}
          onChange={e => handleHouseChange(e.target.value)}
          onFocus={handleHouseFocus}
          onBlur={handleHouseBlur}
          placeholder="Номер дома"
          className="w-full p-2 border rounded placeholder:text-gray-400"
        />
        {houseSug.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto shadow-lg">
            {houseSug.map((s, i) => (
              <li
                key={i}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => handleHouseSelect(s)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* === Кнопка «Найти» === */}
      <button
        onClick={handleFind}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Найти
      </button>

      {/* === Список абонентов === */}
      <SubscriberList subscribers={filtered} />
    </div>
  );
}
