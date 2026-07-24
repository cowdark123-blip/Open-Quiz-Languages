'use client'

import { useEffect, useState } from 'react'
import { Flame, AlertTriangle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { getCurrentUserProfile } from '@/lib/supabase/data-service'

export default function StreakWidget() {
  const [streakCount, setStreakCount] = useState(0)
  const [isActiveToday, setIsActiveToday] = useState(false)
  const [isBroken, setIsBroken] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadStreak = async () => {
    const { profile } = await getCurrentUserProfile()
    if (profile) {
      const today = new Date().toISOString().split('T')[0]
      const lastActive = profile.last_active_date

      if (!lastActive) {
        setStreakCount(0)
        setIsActiveToday(false)
        setIsBroken(false)
      } else {
        const todayDate = new Date(today)
        const lastDate = new Date(lastActive)
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 1) {
          setStreakCount(0)
          setIsActiveToday(false)
          setIsBroken(true)
        } else if (diffDays === 1) {
          setStreakCount(profile.streak_count)
          setIsActiveToday(false)
          setIsBroken(false)
        } else {
          setStreakCount(profile.streak_count)
          setIsActiveToday(true)
          setIsBroken(false)
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadStreak()

    const handleStreakUpdate = () => {
      loadStreak().then(() => {
        // Trigger confetti when activated
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']
        })
      })
    }

    window.addEventListener('streak-updated', handleStreakUpdate)
    return () => window.removeEventListener('streak-updated', handleStreakUpdate)
  }, [])

  if (loading) return null

  return (
    <div className="flex items-center gap-4">
      {isBroken && !isActiveToday && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          🔥 Đứt chuỗi! Hãy học ngay hôm nay!
        </div>
      )}
      
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-sm shadow-lg transition-all ${
        isActiveToday 
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-orange-500/50 text-orange-400 shadow-orange-500/20' 
          : 'bg-slate-800/80 border-slate-700 text-slate-400 grayscale opacity-70'
      }`}>
        <Flame className={`w-4 h-4 ${isActiveToday ? 'text-orange-500 fill-orange-500' : 'text-slate-500'}`} />
        <span>{streakCount}</span>
      </div>
    </div>
  )
}
