'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { VocabItem } from '@/types/database'
import { shuffleArray } from '@/lib/random'
import {
  Trophy,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Flame,
} from 'lucide-react'

export type QuizQuestion = {
  vocab: VocabItem
  options: string[]
}

interface QuizEngineProps {
  items: VocabItem[]
  questionCount?: number
  timerSeconds?: number
  onFinish?: (score: number, total: number) => void
}

export function QuizEngine({
  items,
  questionCount = 10,
  timerSeconds = 15,
  onFinish,
}: QuizEngineProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timerSeconds)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize questions
  const startQuiz = () => {
    if (items.length < 4) return

    const selected = shuffleArray(items).slice(0, questionCount)
    const generated: QuizQuestion[] = selected.map((target) => {
      const wrong = shuffleArray(items.filter((i) => i.id !== target.id))
        .slice(0, 3)
        .map((i) => i.vietnamese_translation || i.definition || 'Khác')
      const correct = target.vietnamese_translation || target.definition || 'Chưa rõ'
      const options = shuffleArray([correct, ...wrong]) as string[]
      return { vocab: target, options }
    })

    setQuestions(generated)
    setCurrentIndex(0)
    setAnswers({})
    setIsFinished(false)
    setScore(0)
    setTimeLeft(timerSeconds)
    setIsTimerRunning(true)
  }

  useEffect(() => {
    startQuiz()
  }, [items, questionCount])

  // Timer Countdown Logic
  useEffect(() => {
    if (!isTimerRunning || isFinished || questions.length === 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired for current question -> auto advance
          handleNextQuestion()
          return timerSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimerRunning, isFinished, currentIndex, questions.length, timerSeconds])

  const handleSelectOption = (opt: string) => {
    if (isFinished) return
    setAnswers((prev) => ({ ...prev, [currentIndex]: opt }))
  }

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setTimeLeft(timerSeconds)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = () => {
    setIsTimerRunning(false)
    let calculatedScore = 0
    questions.forEach((q, idx) => {
      const correctAns = q.vocab.vietnamese_translation || q.vocab.definition
      if (answers[idx] === correctAns) {
        calculatedScore++
      }
    })

    setScore(calculatedScore)
    setIsFinished(true)

    // Fire Confetti Effect if score > 50%
    if (calculatedScore / questions.length >= 0.5) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#06b6d4', '#10b981', '#f59e0b'],
        })
      } catch {
        // Fallback gracefully
      }
    }

    if (onFinish) {
      onFinish(calculatedScore, questions.length)
    }
  }

  if (items.length < 4) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
        <HelpCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Chưa đủ từ vựng để tạo bài Quiz</h3>
        <p className="text-xs text-slate-400">
          Cần tối thiểu 4 từ vựng trong danh sách để tạo câu hỏi trắc nghiệm tự động.
        </p>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const timerPercent = (timeLeft / timerSeconds) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {!isFinished && currentQ ? (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative space-y-6">
          {/* Header Bar with Progress & Timer Ring */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Câu Hỏi {currentIndex + 1} / {questions.length}
              </span>
              <div className="flex gap-1.5 mt-2">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'w-6 bg-purple-500 shadow-md shadow-purple-500/50'
                        : i < currentIndex
                        ? 'w-3 bg-purple-900/60'
                        : 'w-3 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Timer Ring SVG */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-slate-800"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className={`transition-all duration-1000 ${
                    timeLeft <= 3 ? 'stroke-rose-500' : 'stroke-purple-500'
                  }`}
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - timerPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span
                className={`absolute text-xs font-mono font-extrabold ${
                  timeLeft <= 3 ? 'text-rose-400 animate-ping' : 'text-purple-300'
                }`}
              >
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Question Card Display */}
          <div className="text-center py-8 space-y-3">
            <span className="text-xs uppercase font-semibold text-purple-400 tracking-widest">
              Từ Mục Tiêu
            </span>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-wide font-outfit">
              {currentQ.vocab.term}
            </h3>
            {currentQ.vocab.ipa && (
              <p className="text-sm font-mono text-purple-300 italic">{currentQ.vocab.ipa}</p>
            )}
            <p className="text-xs text-slate-400 pt-2">Nghĩa tiếng Việt chính xác nhất là gì?</p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((opt, i) => {
              const isSelected = answers[currentIndex] === opt
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-2xl border text-left transition-all font-semibold text-xs leading-relaxed flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-xl shadow-purple-500/20 ring-1 ring-purple-500/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-900/90'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />}
                </motion.button>
              )
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNextQuestion}
            disabled={!answers[currentIndex]}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-500/25 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            <span>{currentIndex === questions.length - 1 ? 'Hoàn Thành Bài Thi' : 'Câu Tiếp Theo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Score Summary Screen with Confetti trigger */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-10 rounded-3xl border border-purple-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <div>
            <h3 className="text-3xl font-black text-white font-outfit mb-1">Kết Quả Bài Kiểm Tra!</h3>
            <p className="text-slate-400 text-xs">Chúc mừng bạn đã hoàn thành bài thi Quiz online.</p>
          </div>

          {/* Score Badge */}
          <div className="py-4">
            <div className="text-6xl font-black text-gradient-purple font-outfit">
              {score}/{questions.length}
            </div>
            <div className="text-xs font-bold text-purple-300 mt-2 uppercase tracking-widest">
              {Math.round((score / questions.length) * 100)}% Chính xác
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 text-left bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {questions.map((q, idx) => {
              const correct = q.vocab.vietnamese_translation || q.vocab.definition
              const isCorrect = answers[idx] === correct
              return (
                <div
                  key={idx}
                  className="flex items-start justify-between border-b border-slate-800/80 pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white text-xs mr-2">{q.vocab.term}</span>
                    <span className="text-xs text-slate-400">- {correct}</span>
                    {!isCorrect && (
                      <div className="text-[11px] text-rose-400 font-medium">
                        Bạn đã chọn: {answers[idx] || '(Chưa chọn / Hết giờ)'}
                      </div>
                    )}
                  </div>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-4 rounded-2xl glass-card text-purple-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử Lại Lần Khác</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}
