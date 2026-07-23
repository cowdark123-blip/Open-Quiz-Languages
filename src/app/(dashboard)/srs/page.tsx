'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { INITIAL_MOCK_SETS } from '@/lib/mock-data'
import { VocabItem } from '@/types/database'
import { calculateSM2, getSM2IntervalPreviews, SRSGrade } from '@/lib/srs/sm2'
import { saveSRSProgress } from '@/lib/supabase/data-service'
import { Volume2, ArrowLeft, RotateCcw, Brain, Sparkles, Trophy, Keyboard, Eye } from 'lucide-react'

export default function GlobalSRSPage() {
  const allItems: (VocabItem & { setTitle: string })[] = INITIAL_MOCK_SETS.flatMap((set) =>
    (set.items || []).map((item) => ({ ...item, setTitle: set.title }))
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  const currentItem = allItems[currentIndex]

  const [sm2State, setSm2State] = useState({
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
  })

  const intervals = getSM2IntervalPreviews(sm2State.interval, sm2State.repetition, sm2State.easeFactor)

  const playAudio = useCallback((text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const handleGrade = useCallback(
    async (grade: SRSGrade) => {
      const result = calculateSM2(grade, sm2State.interval, sm2State.repetition, sm2State.easeFactor)
      
      // Save state to Supabase Cloud
      if (currentItem) {
        await saveSRSProgress({
          item_id: currentItem.id,
          interval: result.interval,
          repetition: result.repetition,
          ease_factor: result.easeFactor,
          next_review_date: result.nextReviewDate,
          last_reviewed_at: new Date().toISOString(),
        })
      }

      setReviewedCount((prev) => prev + 1)
      setIsAnswerRevealed(false)

      if (currentIndex + 1 < allItems.length) {
        setCurrentIndex((prev) => prev + 1)
        setSm2State({
          interval: result.interval,
          repetition: result.repetition,
          easeFactor: result.easeFactor,
        })
      } else {
        setIsCompleted(true)
      }
    },
    [currentIndex, allItems.length, sm2State, currentItem]
  )

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsAnswerRevealed(false)
    setReviewedCount(0)
    setIsCompleted(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (isCompleted) return

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
  }, [isCompleted, isAnswerRevealed, currentItem, handleGrade, playAudio])

  if (!currentItem || allItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Hiện tại chưa có từ vựng nào cần ôn tập!</h3>
        <Link href="/dashboard" className="text-purple-400 font-semibold hover:underline">
          Quay lại Bảng Điều Khiển
        </Link>
      </div>
    )
  }

  const progressPercent = Math.round(((currentIndex + (isCompleted ? 1 : 0)) / allItems.length) * 100)

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-4">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bảng Điều Khiển</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supabase Cloud SRS</span>
          </span>
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Bắt đầu lại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Tiến trình bài ôn SRS hôm nay</span>
          <span className="text-purple-300 font-bold">
            {currentIndex + (isCompleted ? 1 : 0)} / {allItems.length} Từ
          </span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {!isCompleted ? (
        <div className="space-y-6">
          {/* Main SRS Review Card */}
          <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 shadow-2xl relative space-y-6 min-h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {currentItem.setTitle}
              </span>
              <button
                onClick={(e) => playAudio(currentItem.term, e)}
                className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Phát âm (Phím A)</span>
              </button>
            </div>

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
          </div>

          {/* SM-2 4-Grade Rating Buttons */}
          <div className="space-y-3">
            <div className="text-center text-xs text-slate-400 font-medium">
              {isAnswerRevealed ? 'Đánh giá mức độ ghi nhớ để lưu kết quả vào Supabase Cloud:' : 'Bấm mở đáp án trước khi đánh giá mức độ ghi nhớ'}
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
                <span className="text-[10px] text-red-400 font-normal">Ôn lại: {intervals.again} ngày</span>
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
                <span className="text-[10px] text-amber-400 font-normal">Ôn lại: {intervals.hard} ngày</span>
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
                <span className="text-[10px] text-blue-400 font-normal">Ôn lại: {intervals.good} ngày</span>
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
                <span className="text-[10px] text-emerald-400 font-normal">Ôn lại: {intervals.easy} ngày</span>
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
      ) : (
        /* Completion Summary Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 rounded-3xl border border-purple-500/30 text-center space-y-6 max-w-lg mx-auto shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20">
            <Trophy className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Hoàn Thành Bài Ôn Tập SRS! 🎉</h3>
            <p className="text-slate-400 text-xs">
              Tất cả từ vựng đã được lưu tiến trình vào cơ sở dữ liệu Supabase Cloud.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
            <div className="text-3xl font-black text-purple-300">{reviewedCount} Từ</div>
            <div className="text-xs text-slate-400 mt-1">Đã được ghi nhận vào Supabase Cloud</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={handleRestart}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl glass-card text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ôn Lại Lần Nữa</span>
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Về Bảng Điều Khiển</span>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
