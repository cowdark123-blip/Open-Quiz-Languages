'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VocabItem, UserSRSProgress } from '@/types/database'
import { calculateSM2, getSM2IntervalPreviews, formatInterval, SRSGrade } from '@/lib/srs/sm2'
import { playTTS } from '@/lib/tts'
import { AIPronunciationTrainer } from '@/components/ai-pronunciation-trainer'
import SRSForecastChart from '@/components/SRSForecastChart'
import {
  Volume2,
  Brain,
  CheckCircle2,
  RotateCcw,
  Star,
  Eye,
  Keyboard,
  CheckCircle,
  CalendarClock,
  Sparkles,
  Award,
} from 'lucide-react'

interface SRSViewProps {
  items: (VocabItem & { srsProgress?: UserSRSProgress; setTitle?: string })[]
  onGradeSubmit?: (
    item: VocabItem,
    grade: SRSGrade,
    result: { interval: number; repetition: number; easeFactor: number; nextReviewDate: string }
  ) => Promise<void>
  onStarToggle?: (itemId: string, starred: boolean) => Promise<void>
}

export function SRSView({ items: initialItems, onGradeSubmit, onStarToggle }: SRSViewProps) {
  const [items, setItems] = useState(initialItems)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    setItems(initialItems)
    setIsCompleted(initialItems.length === 0)
  }, [initialItems])

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

  const intervals = getSM2IntervalPreviews(
    currentSM2.interval,
    currentSM2.repetition,
    currentSM2.easeFactor
  )

  const playAudio = useCallback((text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    playTTS(text)
  }, [])

  const toggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentItem) return
    const newStarred = !currentItem.is_starred
    setItems((prev) =>
      prev.map((c) => (c.id === currentItem.id ? { ...c, is_starred: newStarred } : c))
    )
    if (onStarToggle) {
      await onStarToggle(currentItem.id, newStarred)
    }
  }

  const handleGrade = useCallback(
    async (grade: SRSGrade) => {
      if (!currentItem) return

      const result = calculateSM2(
        grade,
        currentSM2.interval,
        currentSM2.repetition,
        currentSM2.easeFactor
      )

      if (onGradeSubmit) {
        await onGradeSubmit(currentItem, grade, result)
      }

      if (result.repetition >= 4) {
        setToast(`🎉 Từ "${currentItem.term}" đã chuyển sang trạng thái Thành thạo!`)
        setTimeout(() => setToast(''), 3000)
      }

      setReviewedCount((prev) => prev + 1)
      setIsAnswerRevealed(false)

      const remaining = items.filter((i) => i.id !== currentItem.id)
      setItems(remaining)

      if (remaining.length === 0) {
        setIsCompleted(true)
      } else {
        setCurrentIndex((prev) => (prev >= remaining.length ? 0 : prev))
      }
    },
    [currentItem, currentSM2, items, onGradeSubmit]
  )

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (isCompleted || !currentItem) return

      if (e.code === 'Space') {
        e.preventDefault()
        setIsAnswerRevealed((prev) => !prev)
      } else if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 's') {
        e.preventDefault()
        playAudio(currentItem.term)
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
  }, [isCompleted, isAnswerRevealed, currentItem, handleGrade, playAudio])

  if (items.length === 0 || isCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white font-outfit">
              Đã Hoàn Thành Bài Ôn Tập SRS Hôm Nay! 🎉
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tất cả từ vựng đã được hệ thống tính toán và lên lịch lặp lại ngắt quãng SM-2 tiếp theo.
            </p>
          </div>

          {reviewedCount > 0 && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 max-w-sm mx-auto">
              <div className="text-3xl font-black text-purple-300 font-outfit">{reviewedCount} Từ Vựng</div>
              <div className="text-xs text-slate-400 mt-1">Đã được cập nhật tiến trình vào hệ thống</div>
            </div>
          )}
        </div>

        {/* 7-Day Review Forecast Chart */}
        <SRSForecastChart />
      </div>
    )
  }

  const totalItems = items.length + reviewedCount
  const progressPercent = totalItems > 0 ? Math.round((reviewedCount / totalItems) * 100) : 100

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-emerald-500/90 text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-400/50 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {toast}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Brain className="w-4 h-4 text-cyan-400" />
            Tiến trình phiên lặp ngắt quãng SM-2
          </span>
          <span className="text-purple-300 font-bold">Hàng chờ: {items.length} từ</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Review Card */}
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
            {/* Card Header */}
            <div className="flex items-center justify-between relative">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {currentItem.setTitle || 'Bộ Từ Vựng'}
              </span>

              <div className="flex gap-2 z-10">
                <button onClick={toggleStar} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
                  <Star
                    className={`w-5 h-5 ${
                      currentItem?.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                    }`}
                  />
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

            {/* Term Display */}
            <div className="text-center space-y-3 my-auto">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Từ Mục Tiêu SRS
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-wide font-outfit">
                {currentItem.term}
              </h2>
              {currentItem.ipa && <p className="text-base font-mono text-purple-300 italic">{currentItem.ipa}</p>}
            </div>

            {/* Answer Display or Reveal Trigger */}
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

                  {/* Integrated AI Pronunciation Trainer */}
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
                  <span>Hiển Thị Đáp Án (Phím Space)</span>
                </button>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* SM-2 4-Grade Quality Ratings */}
      <div className="space-y-3">
        <div className="text-center text-xs text-slate-400 font-medium">
          {isAnswerRevealed
            ? 'Đánh giá mức độ ghi nhớ để tự động hẹn ngày ôn tiếp theo:'
            : 'Vui lòng bấm hiện đáp án trước khi thực hiện đánh giá'}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            disabled={!isAnswerRevealed}
            onClick={() => handleGrade('again')}
            className="py-3.5 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-300 border border-red-500/30 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-lg shadow-red-500/5 active:scale-95"
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
            className="py-3.5 px-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-lg shadow-amber-500/5 active:scale-95"
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
            className="py-3.5 px-3 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 disabled:opacity-40 text-blue-300 border border-blue-500/40 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-lg shadow-blue-500/10 active:scale-95"
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
            className="py-3.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex flex-col items-center gap-1 shadow-lg shadow-emerald-500/10 active:scale-95"
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

      {/* Keyboard Legend */}
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

      {/* 7-Day Forecast */}
      <SRSForecastChart />
    </div>
  )
}
