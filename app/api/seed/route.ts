import { seedDatabase } from "@/scripts/seed-data"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await seedDatabase()

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 })
    } else {
      return NextResponse.json({ message: result.message, error: result.error }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ message: "Internal server error", error }, { status: 500 })
  }
}
