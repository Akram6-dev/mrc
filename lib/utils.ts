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
  if (!name) return "bg-gradient-to-br from-accent-500 to-accent-600";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-pink-500 to-pink-600",
    "from-yellow-500 to-yellow-600",
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-teal-500 to-teal-600",
    "from-indigo-500 to-indigo-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600"
  ];
  const idx = Math.abs(hash) % palette.length;
  return `bg-gradient-to-br ${palette[idx]}`;
}