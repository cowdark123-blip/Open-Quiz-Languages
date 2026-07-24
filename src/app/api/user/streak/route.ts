import { NextResponse } from 'next/server'
import { checkAndUpdateStreak } from '@/lib/supabase/data-service'

export async function POST() {
  try {
    const newStreak = await checkAndUpdateStreak()
    return NextResponse.json({ success: true, streak_count: newStreak })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
