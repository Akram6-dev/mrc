import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Item } from '@/lib/types'

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

export async function GET() {
  const items = await readItems()
  return NextResponse.json(items)
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
  return NextResponse.json(newItem)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const items = await readItems()
  const idx = items.findIndex(i => i.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  items[idx] = { ...items[idx], ...body, updatedAt: new Date().toISOString() }
  await writeItems(items)
  return NextResponse.json(items[idx])
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  let items = await readItems()
  const before = items.length
  items = items.filter(i => i.id !== body.id)
  await writeItems(items)
  return NextResponse.json({ success: items.length < before })
}
