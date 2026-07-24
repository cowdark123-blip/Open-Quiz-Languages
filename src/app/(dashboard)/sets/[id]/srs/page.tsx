'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { VocabItem, UserSRSProgress } from '@/types/database'
import { calculateSM2, getSM2IntervalPreviews, formatInterval, SRSGrade } from '@/lib/srs/sm2'
import { fetchDueSRSItems, saveSRSProgress } from '@/lib/supabase/data-service'
import { playTTS } from '@/lib/tts'
import { AIPronunciationTrainer } from '@/components/ai-pronunciation-trainer'
import { Volume2, ArrowLeft, RotateCcw, Brain, Trophy, Keyboard, Eye, Loader2, CheckCircle2, Star, CheckCircle } from 'lucide-react'
import { updateVocabItem } from '@/lib/supabase/data-service'

export default function SetSRSPage({ params }: { params: { id: string } }) {
  const [items, setItems] = useState<(VocabItem & { srsProgress?: UserSRSProgress; setTitle?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [toast, setToast] = useState('')

  const toggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const item = items[currentIndex]
    if (!item) return
    const newStarred = !item.is_starred
    setItems(prev => prev.map(c => c.id === item.id ? { ...c, is_starred: newStarred } : c))
    await updateVocabItem(item.id, { is_starred: newStarred })
  }

  const loadDueItems = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    const dueItems = await fetchDueSRSItems(params.id)
    setItems(dueItems)
    setCurrentIndex(0)
    setIsAnswerRevealed(false)
    setIsCompleted(dueItems.length === 0)
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    loadDueItems()
  }, [loadDueItems])

  const currentItem = items[currentIndex]

  const currentSM2 = currentItem?.srsProgress
    ? {
        interval: currentItem.srsProgress.interval || 1,
        repetition: currentItem.srsProgress.repetition || 0,
        easeFactor: currentItem.srsProgress.ease_factor || 2.5,
      }
    : {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
      }

  const intervals = getSM2IntervalPreviews(currentSM2.interval, currentSM2.repetition, currentSM2.easeFactor)

  const playAudio = useCallback((text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    playTTS(text)
  }, [])

  const handleGrade = useCallback(
    async (grade: SRSGrade) => {
      if (!currentItem) return
      setErrorMsg('')

      const result = calculateSM2(grade, currentSM2.interval, currentSM2.repetition, currentSM2.easeFactor)
      
      try {
        // Save SM-2 state to Supabase PostgreSQL & update Streak
        await saveSRSProgress({
          item_id: currentItem.id,
          interval: result.interval,
          repetition: result.repetition,
          ease_factor: result.easeFactor,
          next_review_date: result.nextReviewDate,
          status: result.repetition >= 4 ? 'mastered' : 'learning'
        })
        
        // Update local state IMMEDIATELY for the UI to show '🟢 Đã thành thạo' if mastered
        if (result.repetition >= 4) {
          setItems(prevItems => prevItems.map(c => 
            c.id === currentItem.id 
              ? { ...c, srsProgress: { ...c.srsProgress, repetition: result.repetition, interval: result.interval, status: 'mastered' } as any }
              : c
          ))
          setToast(`🎉 Đã đánh dấu thành thạo từ "${currentItem.term}"!`)
          setTimeout(() => setToast(''), 3000)
        }

      } catch (err: any) {
        setErrorMsg(err.message || 'Lưu tiến trình thất bại. Vui lòng thử lại.')
        return
      }

      setReviewedCount((prev) => prev + 1)
      setIsAnswerRevealed(false)

      const newItems = items.filter(i => i.id !== currentItem.id)
      setItems(newItems)

      if (newItems.length === 0) {
        setIsCompleted(true)
      } else {
        setCurrentIndex(prev => prev >= newItems.length ? 0 : prev)
      }
    },
    [currentIndex, items, currentSM2, currentItem]
  )

  const handleRestart = () => {
    loadDueItems()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (isCompleted || loading) return

      if (e.code === 'Space') {
        e.preventDefault()
        setIsAnswerRevealed((prev) => !prev)
      } else if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (currentItem) playAudio(currentItem.term)
      } else if (isAnswerRevealed) {
        if (e.key === '1') {
          e.preventDefault()
          handleGrade('again')
        } else if (e.key === '2') {
          e.preventDefault()
          handleGrade('hard')
        } else if (e.key === '3') {
          e.preventDefault()
          handleGrade('good')
        } else if (e.key === '4') {
          e.preventDefault()
          handleGrade('easy')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCompleted, loading, isAnswerRevealed, currentItem, handleGrade, playAudio])

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-xs">Đang tải từ vựng cần ôn từ Supabase...</span>
      </div>
    )
  }

  if (items.length === 0 || isCompleted) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Bạn đã hoàn thành toàn bộ bài ôn tập hôm nay! 🎉</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Các từ vựng đã được thuật toán SM-2 hẹn giờ ôn tập ngắt quãng tự động vào những ngày tiếp theo.
            </p>
          </div>
          {reviewedCount > 0 && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-2xl font-black text-purple-300">{reviewedCount} Từ Vựng</div>
              <div className="text-xs text-slate-400 mt-1">Đã được lưu tiến trình vào Supabase</div>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href={`/sets/${params.id}`}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg"
            >
              Quay Lại Chi Tiết Bộ Từ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalItems = items.length + reviewedCount
  const progressPercent = totalItems > 0 ? Math.round((reviewedCount / totalItems) * 100) : 100

  const isMastered = currentItem?.srsProgress?.status === 'mastered' || (currentItem?.srsProgress?.repetition || 0) >= 4
  const isLearning = (currentItem?.srsProgress?.repetition || 0) > 0 && !isMastered
  const isNew = !currentItem?.srsProgress
  const isDuplicate = items.some(c => c.id !== currentItem?.id && 
    ((c.term.toLowerCase() === currentItem?.term.toLowerCase()) || 
     (c.vietnamese_translation && currentItem?.vietnamese_translation && c.vietnamese_translation.toLowerCase() === currentItem.vietnamese_translation.toLowerCase()))
  )

  const StatusBadges = () => (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {isNew && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20 text-[10px] uppercase">🔴 Chưa học</span>}
      {isLearning && <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/20 text-[10px] uppercase">🟡 Đang học (Lần {currentItem?.srsProgress?.repetition})</span>}
      {isMastered && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px] uppercase">🟢 Đã thành thạo</span>}
      {currentItem?.is_starred && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 text-[10px] uppercase">⭐ Đã gắn sao</span>}
      {isDuplicate && <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20 text-[10px] uppercase">⚠️ Trùng</span>}
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-4 relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-emerald-500/90 text-white px-4 py-2 rounded-xl shadow-lg border border-emerald-400/50 text-sm font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {toast}
          </div>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/sets/${params.id}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay Lại</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thuật Toán SRS SM-2</span>
          </span>
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tải lại danh sách"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-semibold mb-2">
          {errorMsg}
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Tiến trình bài ôn SRS hôm nay</span>
          <span className="text-purple-300 font-bold">
            Còn lại: {items.length} Từ
          </span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Main SRS Review Card */}
        <div className="perspective-1000 w-full min-h-[380px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="glass-panel p-8 rounded-3xl border border-purple-500/30 shadow-2xl relative space-y-6 min-h-[380px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between relative">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {currentItem.setTitle || 'Bộ Từ Vựng'}
                  </span>
                </div>
                
                <div className="flex gap-2 absolute top-0 right-0 z-10">
                  <button onClick={toggleStar} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
                    <Star className={`w-5 h-5 ${currentItem?.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                  </button>
                  <button
                    onClick={(e) => playAudio(currentItem.term, e)}
                    className="p-2 rounded-full text-purple-300 hover:bg-purple-500/10"
                    title="Phát âm (Phím A / S)"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <StatusBadges />

              {/* Prompt & Term Section */}
              <div className="text-center space-y-4 my-auto">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Từ Mục Tiêu SRS</span>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-wide">{currentItem.term}</h2>
                {currentItem.ipa && (
                  <p className="text-base font-mono text-purple-300 italic">{currentItem.ipa}</p>
                )}
              </div>

              {/* Answer Content */}
              <AnimatePresence>
                {isAnswerRevealed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-left"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Định nghĩa tiếng Anh</span>
                      <p className="text-base font-bold text-white mt-0.5">{currentItem.definition}</p>
                    </div>

                    {currentItem.vietnamese_translation && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-purple-400">Bản dịch Tiếng Việt</span>
                        <p className="text-sm font-semibold text-purple-200 mt-0.5">
                          {currentItem.vietnamese_translation}
                        </p>
                      </div>
                    )}

                    {currentItem.example_sentence && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
                        <strong>Ví dụ:</strong> &quot;{currentItem.example_sentence}&quot;
                      </div>
                    )}

                    {/* Integrated AI Pronunciation Module */}
                    <AIPronunciationTrainer
                      targetWord={currentItem.term}
                      targetSentence={currentItem.example_sentence || undefined}
                    />
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setIsAnswerRevealed(true)}
                    className="w-full py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4 text-purple-400" />
                    <span>Hiển Thị Đáp Án & Định Nghĩa (Phím Space)</span>
                  </button>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SM-2 4-Grade Rating Buttons */}
        <div className="space-y-3">
          <div className="text-center text-xs text-slate-400 font-medium">
            {isAnswerRevealed ? 'Đánh giá mức độ ghi nhớ để tự động hẹn ngày ôn tiếp theo:' : 'Bấm mở đáp án trước khi đánh giá mức độ ghi nhớ'}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              disabled={!isAnswerRevealed}
              onClick={() => handleGrade('again')}
              className="py-3 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-300 border border-red-500/30 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-lg shadow-red-500/5 active:scale-95"
            >
              <div className="flex items-center gap-1">
                <span>Nhắc Lại</span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-red-950/80 rounded border border-red-800 text-red-300">
                  1
                </kbd>
              </div>
              <span className="text-[10px] text-red-400 font-normal">Hẹn: {formatInterval(intervals.again)}</span>
            </button>

            <button
              disabled={!isAnswerRevealed}
              onClick={() => handleGrade('hard')}
              className="py-3 px-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-lg shadow-amber-500/5 active:scale-95"
            >
              <div className="flex items-center gap-1">
                <span>Khó</span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-amber-950/80 rounded border border-amber-800 text-amber-300">
                  2
                </kbd>
              </div>
              <span className="text-[10px] text-amber-400 font-normal">Hẹn: {formatInterval(intervals.hard)}</span>
            </button>

            <button
              disabled={!isAnswerRevealed}
              onClick={() => handleGrade('good')}
              className="py-3 px-3 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 disabled:opacity-40 text-blue-300 border border-blue-500/40 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <div className="flex items-center gap-1">
                <span>Tốt</span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-blue-950/80 rounded border border-blue-800 text-blue-300">
                  3
                </kbd>
              </div>
              <span className="text-[10px] text-blue-400 font-normal">Hẹn: {formatInterval(intervals.good)}</span>
            </button>

            <button
              disabled={!isAnswerRevealed}
              onClick={() => handleGrade('easy')}
              className="py-3 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              <div className="flex items-center gap-1">
                <span>Dễ</span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-emerald-950/80 rounded border border-emerald-800 text-emerald-300">
                  4
                </kbd>
              </div>
              <span className="text-[10px] text-emerald-400 font-normal">Hẹn: {formatInterval(intervals.easy)}</span>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Legend */}
        <div className="p-3 rounded-2xl glass-panel border border-slate-800/90 text-center flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Keyboard className="w-4 h-4 text-purple-400" />
            <span>Phím tắt SRS:</span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-mono text-[11px]">Space</kbd> Hiện đáp án
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-red-400 font-mono text-[11px]">1</kbd> Nhắc lại
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[11px]">2</kbd> Khó
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 font-mono text-[11px]">3</kbd> Tốt
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px]">4</kbd> Dễ
          </span>
        </div>
      </div>
    </div>
  )
}
