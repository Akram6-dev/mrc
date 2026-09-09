import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getActor, writeAuditLog } from "@/lib/audit";

const SETTINGS_PATH = path.join(process.cwd(), "database/settings.json");

export async function POST(req: NextRequest) {
  if (req.headers.get("x-user-role") !== "super_admin") {
    return NextResponse.json(
      { error: "Akses hanya untuk super admin" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 },
      );
    }

    const settings = JSON.parse(await fs.readFile(SETTINGS_PATH, "utf-8"));
    const users = Array.isArray(settings.users) ? settings.users : [];
    const duplicate =
      users.some(
        (user: any) =>
          !user.deletedAt &&
          user.username?.toLowerCase() === username.toLowerCase(),
      ) || settings.admin?.username?.toLowerCase() === username.toLowerCase();
    if (duplicate) {
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 409 },
      );
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      role: "admin",
    };
    const updated = { ...settings, users: [...users, newUser] };
    await fs.writeFile(
      SETTINGS_PATH,
      JSON.stringify(updated, null, 2),
      "utf-8",
    );
    const actor = getActor(req);
    await writeAuditLog({
      ...actor,
      action: "create",
      entity: "akun admin",
      description: `Menambahkan akun admin ${username}`,
    });
    return NextResponse.json({
      success: true,
      user: { ...newUser, password: undefined },
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal menambahkan akun admin" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  if (req.headers.get("x-user-role") !== "super_admin") {
    return NextResponse.json(
      { error: "Akses hanya untuk super admin" },
      { status: 403 },
    );
  }
  try {
    const body = await req.json();
    const settings = JSON.parse(await fs.readFile(SETTINGS_PATH, "utf-8"));
    const users = Array.isArray(settings.users) ? settings.users : [];
    const index = users.findIndex(
      (user: any) =>
        user.id === body.id && user.role === "admin" && !user.deletedAt,
    );
    if (index === -1)
      return NextResponse.json(
        { error: "Akun admin tidak ditemukan" },
        { status: 404 },
      );
    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    if (!username)
      return NextResponse.json(
        { error: "Username wajib diisi" },
        { status: 400 },
      );
    const duplicate =
      users.some(
        (user: any, userIndex: number) =>
          userIndex !== index &&
          !user.deletedAt &&
          user.username?.toLowerCase() === username.toLowerCase(),
      ) || settings.admin?.username?.toLowerCase() === username.toLowerCase();
    if (duplicate)
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 409 },
      );
    users[index] = {
      ...users[index],
      username,
      ...(body.password ? { password: body.password } : {}),
    };
    await fs.writeFile(
      SETTINGS_PATH,
      JSON.stringify({ ...settings, users }, null, 2),
      "utf-8",
    );
    const actor = getActor(req);
    await writeAuditLog({
      ...actor,
      action: "update",
      entity: "akun admin",
      description: `Mengubah akun admin ${username}`,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal mengubah akun admin" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (req.headers.get("x-user-role") !== "super_admin") {
    return NextResponse.json(
      { error: "Akses hanya untuk super admin" },
      { status: 403 },
    );
  }
  try {
    const body = await req.json();
    const settings = JSON.parse(await fs.readFile(SETTINGS_PATH, "utf-8"));
    const users = Array.isArray(settings.users) ? settings.users : [];
    const userIndex = users.findIndex(
      (entry: any) =>
        entry.id === body.id && entry.role === "admin" && !entry.deletedAt,
    );
    const user = userIndex === -1 ? null : users[userIndex];
    if (!user)
      return NextResponse.json(
        { error: "Akun admin tidak ditemukan" },
        { status: 404 },
      );
    const actor = getActor(req);
    users[userIndex] = {
      ...user,
      deletedAt: new Date().toISOString(),
      deletedBy: actor.username,
    };
    await fs.writeFile(
      SETTINGS_PATH,
      JSON.stringify({ ...settings, users }, null, 2),
      "utf-8",
    );
    await writeAuditLog({
      ...actor,
      action: "delete",
      entity: "akun admin",
      description: `Menghapus akun admin ${user.username}`,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus akun admin" },
      { status: 500 },
    );
  }
}
