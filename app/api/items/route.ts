import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Item } from '@/lib/types'
import { getActor, writeAuditLog } from '@/lib/audit'

const DB_PATH = path.join(process.cwd(), 'database', 'items.json')

async function readItems(): Promise<Item[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeItems(items: Item[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(items, null, 2), 'utf-8')
}

export async function GET(req: NextRequest) {
  const items = await readItems()
  const includeDeleted = new URL(req.url).searchParams.get("includeDeleted") === "true"
  return NextResponse.json(includeDeleted ? items : items.filter((item) => !item.deletedAt))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const items = await readItems()
  const newItem: Item = {
    ...body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  items.push(newItem)
  await writeItems(items)
  const actor = getActor(req)
  await writeAuditLog({ ...actor, action: "create", entity: "barang", description: `Menambah barang ${newItem.name}` })
  return NextResponse.json(newItem)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const items = await readItems()
  const idx = items.findIndex(i => i.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  items[idx] = { ...items[idx], ...body, updatedAt: new Date().toISOString() }
  await writeItems(items)
  const actor = getActor(req)
  await writeAuditLog({ ...actor, action: "update", entity: "barang", description: `Mengubah barang ${items[idx].name}` })
  return NextResponse.json(items[idx])
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const items = await readItems()
  const index = items.findIndex((item) => item.id === body.id && !item.deletedAt)
  if (index === -1) return NextResponse.json({ success: false }, { status: 404 })
  if (items[index].items?.some((serial) => serial.status === 0 || serial.status === 2)) {
    return NextResponse.json({ success: false, error: "Barang masih dipinjam atau dibooking" }, { status: 409 })
  }
  const actor = getActor(req)
  items[index] = {
    ...items[index],
    deletedAt: new Date().toISOString(),
    deletedBy: actor.username,
    updatedAt: new Date().toISOString(),
  }
  await writeItems(items)
  await writeAuditLog({ ...actor, action: "delete", entity: "barang", description: `Menghapus barang ${body.id}` })
  return NextResponse.json({ success: true })
}
