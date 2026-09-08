import { promises as fs } from "fs";
import path from "path";

export type AuditAction = "create" | "update" | "delete";

export interface AuditLog {
  id: string;
  username: string;
  role: string;
  action: AuditAction;
  entity: string;
  description: string;
  createdAt: string;
}

const AUDIT_PATH = path.join(process.cwd(), "database", "audit.json");

export async function readAuditLogs(): Promise<AuditLog[]> {
  try {
    return JSON.parse(await fs.readFile(AUDIT_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export async function writeAuditLog(log: Omit<AuditLog, "id" | "createdAt">) {
  const logs = await readAuditLogs();
  logs.unshift({
    ...log,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  await fs.writeFile(AUDIT_PATH, JSON.stringify(logs, null, 2), "utf-8");
}

export function getActor(request: Request) {
  return {
    username: request.headers.get("x-user-name") || "Tidak diketahui",
    role: request.headers.get("x-user-role") || "admin",
  };
}