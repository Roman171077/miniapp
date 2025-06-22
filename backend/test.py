#!/usr/bin/env python
"""Отправляет отчёт в Telegram (без записи в БД)."""
import os
import argparse
import logging
from typing import Optional

import requests
from dotenv import load_dotenv

# ---------- Настройка окружения ----------
load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID        = os.getenv("CHAT_ID")

if not TELEGRAM_TOKEN or not CHAT_ID:
    raise ValueError("TELEGRAM_TOKEN или CHAT_ID не найдены в .env")

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)

# ---------- Логика отправки ----------

def send_to_telegram(message: str) -> Optional[str]:
    """Отправляет message в Telegram, возвращает ID сообщения или None."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "Markdown",
    }

    try:
        resp = requests.post(url, data=payload, timeout=10)
        resp.raise_for_status()
        telegram_msg_id = resp.json()["result"]["message_id"]
        return str(telegram_msg_id)
    except requests.exceptions.RequestException as exc:
        log.error(f"Ошибка отправки в Telegram: {exc}")
        return None

# ---------- Текст по умолчанию ----------

REPORT_TEXT = (
    "🗓 *Отчёт 13 – 16 мая* (UTC+8)\n\n"
    "*13 мая*\n"
    "• 09:57 – 19:55 — смена 10.0 ч\n"
    "• ✅ Работа: 1.9 ч (≈19 %)\n"
    "• 🚚 Дорога: 6.1 ч (≈61 %)\n"
    "• ⏸ Простой: 1.1 ч (≈11 %)\n"
    "↪️ Главная потеря — длительные переезды между точками.\n\n"

    "*14 мая*\n"
    "• 10:03 – 20:52 — смена 10.8 ч\n"
    "• ✅ Работа: 2.2 ч (≈20 %)\n"
    "• 🚚 Дорога: 6.8 ч (≈63 %)\n"
    "• ⏸ Простой: 0.7 ч (≈6 %)\n"
    "↪️ Ситуация аналогична 13‑му: основное время \u2014 в пути.\n\n"

    "*15 мая*\n"
    "• 10:40 – 19:46 — смена 9.1 ч\n"
    "• ✅ Работа: 3.5 ч (≈38 %)\n"
    "• 🚚 Дорога: 4.0 ч (≈44 %)\n"
    "• ⏸ Простой: 1.2 ч (≈13 %)\n"
    "↪️ Эффективность почти удвоилась: путь сокращён на ~2 ч.\n\n"

    "*16 мая*\n"
    "• 10:14 – 21:15 — смена 11.0 ч\n"
    "• ✅ Работа: 4.2 ч (≈38 %)\n"
    "• 🚚 Дорога: 4.6 ч (≈42 %)\n"
    "• ⏸ Простой: 1.6 ч (≈15 %)\n"
    "↪️ Держим улучшенную долю работы, но дорога всё ещё >40 %.\n\n"

    "📊 *Общие выводы*\n"
    "• 15–16 мая доля продуктивного времени выросла почти вдвое по сравнению с 13–14 мая.\n"
    "• Переезды сократились на ~2 ч, но остаются главным потребителем времени.\n\n"
    "💡 *Рекомендации*\n"
    "1. Оптимизировать маршруты — группировать задачи в одной зоне / районе.\n"
    "2. Держать простой ≤1 ч, делая микропаузу во время переезда.\n"
    "3. Ещё на 1–1,5 ч сократить дорогу — это даст +10–15 % к полезному времени без удлинения смены."
)

# ---------- Точка входа ----------

def main() -> None:
    parser = argparse.ArgumentParser(description="Отправка отчёта в Telegram")
    parser.add_argument(
        "-m",
        "--message",
        nargs="*",
        help="Текст для отправки (если нужно перекрыть отчёт)",
    )
    args = parser.parse_args()

    message_text = " ".join(args.message) if args.message else REPORT_TEXT

    msg_id = send_to_telegram(message_text)
    if msg_id:
        print(f"✅ Сообщение отправлено! ID: {msg_id}")
    else:
        print("❌ Не удалось отправить сообщение.")

if __name__ == "__main__":
    main()
