// src/lib/utils/date.ts
export const pad = (n: number) => String(n).padStart(2, "0");

export const defaultPlan = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T11:00`;
};

export const utcToLocalInput = (iso?: string): string =>
  iso
    ? (() => {
        const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
        return (
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
          `T${pad(d.getHours())}:${pad(d.getMinutes())}`
        );
      })()
    : "";

export const localToUtc = (s?: string): string | null =>
  s ? new Date(s).toISOString() : null;

export const localToUtc2359 = (s?: string): string | null => {
  if (!s) return null;
  const d = new Date(s);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
};

export const groupByDate = <T extends { planned_start: string }>(
  tasks: T[]
): Record<string, T[]> =>
  tasks.reduce((acc, t) => {
    const day = new Date(t.planned_start).toLocaleDateString("ru-RU");
    if (!acc[day]) acc[day] = [];
    acc[day].push(t);
    return acc;
  }, {} as Record<string, T[]>);

export const typeOrder = {
  connection: 0,
  service: 1,
  incident: 2,
} as const;
