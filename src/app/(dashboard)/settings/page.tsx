'use client'

import { useState, useEffect } from 'react'
import { Brain, Save, CheckCircle2 } from 'lucide-react'
import { getCurrentUserProfile, updateUserProfile } from '@/lib/supabase/data-service'

const BANDS = [
  {
    id: 'mat_goc',
    title: 'Mất gốc / Mới bắt đầu',
    level: 'A0-A1',
    description: 'Từ vựng siêu cơ bản. Câu đơn ngắn gọn. Giải thích 80% tiếng Việt tỉ mỉ.',
  },
  {
    id: 'co_ban',
    title: 'Cơ bản',
    level: 'A2-B1 / IELTS 4.0-5.0',
    description: 'Từ vựng thông dụng. Câu ghép đơn giản. Giải thích 50% Anh - 50% Việt.',
  },
  {
    id: 'trung_cap',
    title: 'Trung cấp',
    level: 'B2 / IELTS 5.5-6.5',
    description: 'Từ vựng học thuật, collocation. Cấu trúc phức. Giải thích chủ yếu tiếng Anh.',
  },
  {
    id: 'nang_cao',
    title: 'Nâng cao',
    level: 'C1-C2 / IELTS 7.0+',
    description: 'Từ vựng nâng cao, thành ngữ. Cấu trúc đảo ngữ. AI phản hồi 100% tiếng Anh bản xứ.',
  },
]

export default function SettingsPage() {
  const [selectedBand, setSelectedBand] = useState<string>('co_ban')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { profile } = await getCurrentUserProfile()
      if (profile?.target_band) {
        setSelectedBand(profile.target_band)
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setIsSaved(false)
    const success = await updateUserProfile({ target_band: selectedBand })
    setIsSaving(false)
    if (success) {
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-400" />
          Cài đặt & Trình độ
        </h1>
        <p className="text-slate-400">
          Thiết lập trình độ mục tiêu để hệ thống AI điều chỉnh độ khó bài tập, từ vựng và cách phản hồi phù hợp với bạn.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
        <h2 className="text-xl font-bold text-white mb-6">Trình độ / Band mong muốn</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BANDS.map((band) => (
            <div
              key={band.id}
              onClick={() => setSelectedBand(band.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedBand === band.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold ${selectedBand === band.id ? 'text-purple-300' : 'text-slate-200'}`}>
                  {band.title}
                </h3>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300">
                  {band.level}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{band.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-800/80 pt-6">
          {isSaved && (
            <span className="text-emerald-400 text-sm flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="w-4 h-4" /> Đã lưu thành công!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}
