import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Borrower } from '@/lib/types'

const DB_PATH = path.join(process.cwd(), 'database', 'borrowers.json')

async function readBorrowers(): Promise<Borrower[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeBorrowers(borrowers: Borrower[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(borrowers, null, 2), 'utf-8')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idParams = searchParams.getAll('id')
  const borrowers = await readBorrowers()
  if (idParams.length === 0) {
    return NextResponse.json(borrowers)
  }
  // idParams bisa array atau satuan, filter borrowers
  const idSet = new Set(idParams)
  const filtered = borrowers.filter(b => idSet.has(b.id))
  return NextResponse.json(filtered)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const borrowers = await readBorrowers()
  const newBorrower: Borrower = {
    ...body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  borrowers.push(newBorrower)
  await writeBorrowers(borrowers)
  return NextResponse.json(newBorrower)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const borrowers = await readBorrowers()
  const idx = borrowers.findIndex(b => b.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  borrowers[idx] = { ...borrowers[idx], ...body, updatedAt: new Date().toISOString() }
  await writeBorrowers(borrowers)
  return NextResponse.json(borrowers[idx])
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  let borrowers = await readBorrowers()
  const before = borrowers.length
  borrowers = borrowers.filter(b => b.id !== body.id)
  await writeBorrowers(borrowers)
  return NextResponse.json({ success: borrowers.length < before })
}
