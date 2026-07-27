import {
  addDays,
  format,
  getDay,
  isBefore,
  isSameDay,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";

/** Slot MVP: lun–ven 8:30–12:30 / 14:00–18:00, ogni 30 minuti */
const MORNING = { start: [8, 30] as const, end: [12, 30] as const };
const AFTERNOON = { start: [14, 0] as const, end: [18, 0] as const };

function buildSlotsForDay(day: Date): Date[] {
  const slots: Date[] = [];
  for (const window of [MORNING, AFTERNOON]) {
    let cursor = setMinutes(
      setHours(startOfDay(day), window.start[0]),
      window.start[1],
    );
    const end = setMinutes(
      setHours(startOfDay(day), window.end[0]),
      window.end[1],
    );
    while (isBefore(cursor, end)) {
      slots.push(new Date(cursor));
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
    }
  }
  return slots;
}

export function getAvailableSlots(
  from: Date,
  daysAhead = 14,
  taken: Date[] = [],
): Date[] {
  const result: Date[] = [];
  const now = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const day = addDays(startOfDay(from), i);
    const dow = getDay(day); // 0=dom
    if (dow === 0 || dow === 6) continue;

    for (const slot of buildSlotsForDay(day)) {
      if (isBefore(slot, now)) continue;
      const occupied = taken.some((t) => t.getTime() === slot.getTime());
      if (!occupied) result.push(slot);
    }
  }

  return result;
}

export function groupSlotsByDay(slots: Date[]): { day: string; slots: Date[] }[] {
  const map = new Map<string, Date[]>();
  for (const slot of slots) {
    const key = format(slot, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(slot);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([day, daySlots]) => ({
    day,
    slots: daySlots,
  }));
}

export function isSameSlot(a: Date, b: Date): boolean {
  return isSameDay(a, b) && a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();
}
