import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "database/settings.json");

const defaultSettings = {
  siteName: "MRC Inventory",
  theme: "light",
  admin: {
    username: "admin",
    password: "admin123"
  },
  users: [
    { id: "1", username: "admin", password: "admin123", role: "super_admin" },
    { id: "2", username: "petugas", password: "petugas123", role: "admin" }
  ],
  notifications: {
    overdueReminders: true,
    returnReminders: true
  },
  system: {
    defaultLoanDays: 7,
    maxLoanItems: 5,
    returnConfirmation: true,
    borrowConfirmation: false
  },
  messages: {
    aiReply: true,
    loanMessage: true,
    returnMessage: true,
    reminderMessage: true
  }
};

function mergeSettings(input: any) {
  return {
    ...defaultSettings,
    ...input,
    admin: {
      ...defaultSettings.admin,
      ...(input.admin || {})
    },
    users: Array.isArray(input.users) ? input.users : defaultSettings.users,
    notifications: {
      ...defaultSettings.notifications,
      ...(input.notifications || {})
    },
    system: {
      ...defaultSettings.system,
      ...(input.system || {})
    },
    messages: {
      ...defaultSettings.messages,
      ...(typeof input.messages === "object" ? input.messages : {})
    }
  };
}

export async function GET() {
  try {
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    // Always return with all fields (auto-lengkapi jika ada yang kurang)
    const parsed = JSON.parse(data);
    return NextResponse.json(mergeSettings(parsed));
  } catch (e) {
    // If not found, return default
    return NextResponse.json(defaultSettings);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const merged = mergeSettings(body);
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
