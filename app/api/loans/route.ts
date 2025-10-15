import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Loan } from '@/lib/types'

const DB_PATH = path.join(process.cwd(), 'database', 'loans.json')

async function readLoans(): Promise<Loan[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeLoans(loans: Loan[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(loans, null, 2), 'utf-8')
}

export async function GET() {
  const loans = await readLoans()
  return NextResponse.json(loans)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const loans = await readLoans()
  const newLoan: Loan = {
    ...body,
    id: body.id == null ? Date.now().toString() : body.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  loans.push(newLoan)
  await writeLoans(loans)
  return NextResponse.json(newLoan)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const loans = await readLoans()
  const idx = loans.findIndex(l => l.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  loans[idx] = { ...loans[idx], ...body, updatedAt: new Date().toISOString() }
  await writeLoans(loans)
  return NextResponse.json(loans[idx])
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  let loans = await readLoans()
  const before = loans.length
  loans = loans.filter(l => l.id !== body.id)
  await writeLoans(loans)
  return NextResponse.json({ success: loans.length < before })
}
