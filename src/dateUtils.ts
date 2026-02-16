export type DateLike = string | number | Date;

export function minutesSinceLocalMidnight(d: DateLike = new Date()) {
  const date = new Date(d);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return hour * 60 + minute + second / 60;
}

export function startOfDayLocal(d: DateLike = new Date()) {
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function yyyyMmDdLocal(d: DateLike = new Date()) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLocalDateTime(dateLike: DateLike) {
  const date = new Date(dateLike);
  try {
    return new Intl.DateTimeFormat("en-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatLocalTime(dateLike: DateLike) {
  const date = new Date(dateLike);
  try {
    return new Intl.DateTimeFormat("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

export function diffMinutes(a: DateLike, b: DateLike) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

export function fmtHM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}
