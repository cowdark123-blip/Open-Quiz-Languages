'use client'

import { useEffect, useState } from 'react'
import { fetchAllUserSRSProgress } from '@/lib/supabase/data-service'
import { Loader2, BarChart2 } from 'lucide-react'

export default function SRSForecastChart() {
  const [data, setData] = useState<{ date: string; label: string; count: number; isToday: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const progress = await fetchAllUserSRSProgress()
      
      // Calculate next 7 days
      const days: { dateObj: Date; date: string; label: string; count: number; isToday: boolean }[] = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() + i)
        
        let label = d.toLocaleDateString('vi-VN', { weekday: 'short' })
        if (i === 0) label = 'Hôm nay'
        if (i === 1) label = 'Ngày mai'

        days.push({
          dateObj: d,
          date: d.toISOString().split('T')[0],
          label,
          count: 0,
          isToday: i === 0
        })
      }

      // Group progress
      progress.forEach(p => {
        const nextReview = new Date(p.next_review_date)
        const diffTime = nextReview.getTime() - today.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 0) {
          // Due today or overdue
          days[0].count++
        } else if (diffDays < 7) {
          days[diffDays].count++
        }
      })

      setData(days)
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-center h-48 mt-8">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count), 10) // Minimum scale of 10

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/50 space-y-6 mt-8">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">Dự Báo Khối Lượng Ôn Tập (7 Ngày Tới)</h3>
      </div>
      
      <div className="flex items-end justify-between h-40 gap-2 px-2">
        {data.map((day, idx) => {
          const heightPercent = Math.max((day.count / maxCount) * 100, 2) // Minimum 2% height so it's visible
          return (
            <div key={idx} className="flex flex-col items-center flex-1 gap-2 group h-full">
              <div className="relative w-full flex justify-center h-full items-end">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  {day.count} từ
                </div>
                {/* Bar */}
                <div 
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out flex items-start justify-center pt-2 ${
                    day.isToday 
                      ? 'bg-gradient-to-t from-purple-600 to-cyan-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                      : 'bg-slate-700 group-hover:bg-slate-600'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                >
                  {day.count > 0 && (
                    <span className="text-[10px] font-bold text-white/80">
                      {day.count}
                    </span>
                  )}
                </div>
              </div>
              <div className={`text-[10px] font-bold whitespace-nowrap ${day.isToday ? 'text-purple-300' : 'text-slate-400'}`}>
                {day.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
