import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function isOverdue(dueDate: string): boolean {
  const due = new Date(dueDate)
  const now = new Date()
  // Set both dates to midnight for date-only comparison
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return due < now
}

export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getColorFromName(name: string | undefined) {
  if (!name) return "bg-gradient-to-br from-accent-400 to-accent-500";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    "from-blue-400 to-blue-500",
    "from-green-400 to-green-500",
    "from-pink-400 to-pink-500",
    "from-yellow-400 to-yellow-500",
    "from-purple-400 to-purple-500",
    "from-orange-400 to-orange-500",
    "from-teal-400 to-teal-500",
    "from-indigo-400 to-indigo-500",
    "from-rose-400 to-rose-500",
    "from-cyan-400 to-cyan-500",
    "from-lime-400 to-lime-500",
    "from-emerald-400 to-emerald-500",
    "from-fuchsia-400 to-fuchsia-500",
    "from-violet-400 to-violet-500",
    "from-sky-400 to-sky-500",
    "from-amber-400 to-amber-500",
  ];
  const idx = Math.abs(hash) % palette.length;
  return `bg-gradient-to-br ${palette[idx]}`;
}