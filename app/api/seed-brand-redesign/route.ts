import { seedBrandRedesignProject } from "@/scripts/seed-brand-redesign"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await seedBrandRedesignProject()

    if (result.success) {
      return NextResponse.json({ message: result.message, projectId: result.projectId }, { status: 200 })
    } else {
      return NextResponse.json({ message: result.message, error: result.error }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ message: "Internal server error", error }, { status: 500 })
  }
}
