'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VocabItem } from '@/types/database'
import { playTTS } from '@/lib/tts'
import { AIPronunciationTrainer } from '@/components/ai-pronunciation-trainer'
import {
  Volume2,
  RotateCcw,
  CheckCircle,
  XCircle,
  Star,
  Keyboard,
  Sparkles,
  Layers,
  Flame,
  BookOpen,
  CheckCircle2,
  Shuffle,
  ArrowDownAZ,
  Clock,
  History,
  SlidersHorizontal,
  ListFilter,
  Eye,
  Loader2,
} from 'lucide-react'

interface Flashcards3DProps {
  items: VocabItem[]
  setTitle?: string
  onSaveProgress?: (itemId: string, isKnown: boolean) => Promise<void>
  onStarToggle?: (itemId: string, starred: boolean) => Promise<void>
  onComplete?: (masteredCount: number, reviewCount: number) => void
  onMarkMastered?: (itemId: string, isMastered: boolean) => Promise<void>
}

export function Flashcards3D({
  items: initialItems,
  setTitle = 'Bộ Từ Vựng',
  onSaveProgress,
  onStarToggle,
  onComplete,
  onMarkMastered,
}: Flashcards3DProps) {
  const [cards, setCards] = useState<VocabItem[]>(initialItems)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredCount, setMasteredCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [sortType, setSortType] = useState('shuffle')
  const [toast, setToast] = useState('')

  useEffect(() => {
    setCards(initialItems)
  }, [initialItems])

  const handleStartSetup = () => {
    let filtered = [...initialItems]
    if (filterType === 'mastered') {
      filtered = filtered.filter(
        (c) => c.srsProgress?.status === 'mastered' || (c.srsProgress?.repetition || 0) >= 4
      )
    } else if (filterType === 'learning') {
      filtered = filtered.filter(
        (c) => (c.srsProgress?.repetition || 0) > 0 && c.srsProgress?.status !== 'mastered' && (c.srsProgress?.repetition || 0) < 4
      )
    } else if (filterType === 'new') {
      filtered = filtered.filter((c) => !c.srsProgress || c.srsProgress.repetition === 0)
    } else if (filterType === 'starred') {
      filtered = filtered.filter((c) => c.is_starred)
    }

    if (sortType === 'shuffle') {
      filtered.sort(() => Math.random() - 0.5)
    } else if (sortType === 'az') {
      filtered.sort((a, b) => a.term.localeCompare(b.term))
    } else if (sortType === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortType === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }

    setCards(filtered)
    setIsSetupComplete(true)
    setCurrentIndex(0)
    setMasteredCount(0)
    setReviewCount(0)
    setIsCompleted(false)
  }

  const currentCard = cards[currentIndex]

  const playAudio = useCallback((text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    playTTS(text)
  }, [])

  const toggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentCard) return
    const newStarred = !currentCard.is_starred
    setCards((prev) =>
      prev.map((c) => (c.id === currentCard.id ? { ...c, is_starred: newStarred } : c))
    )
    if (onStarToggle) {
      await onStarToggle(currentCard.id, newStarred)
    }
  }

  const handleNextCard = useCallback(
    async (known: boolean) => {
      if (!currentCard) return

      if (known) {
        setMasteredCount((prev) => prev + 1)
        setToast(`🎉 Đã thuộc từ "${currentCard.term}"!`)
        setTimeout(() => setToast(''), 2500)
      } else {
        setReviewCount((prev) => prev + 1)
      }

      if (onSaveProgress) {
        await onSaveProgress(currentCard.id, known)
      }
      if (onMarkMastered && known) {
        await onMarkMastered(currentCard.id, true)
      }

      setIsFlipped(false)

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        setIsCompleted(true)
        if (onComplete) {
          onComplete(known ? masteredCount + 1 : masteredCount, known ? reviewCount : reviewCount + 1)
        }
      }
    },
    [currentIndex, cards.length, currentCard, onSaveProgress, onComplete, masteredCount, reviewCount]
  )

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setMasteredCount(0)
    setReviewCount(0)
    setIsCompleted(false)
    setIsSetupComplete(false)
  }

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (isCompleted || !isSetupComplete) return

      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault()
        handleNextCard(false)
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault()
        handleNextCard(true)
      } else if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (currentCard) {
          playAudio(currentCard.term)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCompleted, isSetupComplete, handleNextCard, currentCard, playAudio])

  if (initialItems.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
        <h3 className="text-xl font-bold text-white">Chưa có từ vựng nào trong bộ này</h3>
        <p className="text-xs text-slate-400">Vui lòng thêm từ vựng để bắt đầu trải nghiệm Flashcard 3D.</p>
      </div>
    )
  }

  const progressPercent = Math.round(
    ((cards.length > 0 ? (isCompleted ? 1 : currentIndex / cards.length) : 1)) * 100
  )

  const isMastered =
    currentCard?.srsProgress?.status === 'mastered' || (currentCard?.srsProgress?.repetition || 0) >= 4
  const isLearning = (currentCard?.srsProgress?.repetition || 0) > 0 && !isMastered
  const isNew = !currentCard?.srsProgress

  const StatusBadges = () => (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {isNew && (
        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20 text-[10px] uppercase">
          🔴 Chưa học
        </span>
      )}
      {isLearning && (
        <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/20 text-[10px] uppercase">
          🟡 Đang học (Lần {currentCard?.srsProgress?.repetition})
        </span>
      )}
      {isMastered && (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px] uppercase">
          🟢 Đã thuộc
        </span>
      )}
      {currentCard?.is_starred && (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 text-[10px] uppercase">
          ⭐ Đã gắn sao
        </span>
      )}
    </div>
  )

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

      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold text-xs">
            {setTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-purple-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Thẻ {isCompleted ? cards.length : currentIndex + 1} / {cards.length}
          </span>
          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Bắt đầu lại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {!isSetupComplete ? (
        /* Lesson Setup Card */
        <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 space-y-8 max-w-2xl mx-auto mt-4">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-white font-outfit">Cài Đặt Phiên Flashcard 3D</h3>
            <p className="text-xs text-slate-400">Lựa chọn bộ lọc và thứ tự lật thẻ để tối ưu hóa khả năng ghi nhớ</p>
          </div>

          <div className="space-y-6">
            {/* Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-purple-400" />
                Lọc thẻ học
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'all', label: 'Tất cả', icon: Layers, color: 'text-blue-400' },
                  { id: 'new', label: 'Chưa học', icon: Flame, color: 'text-red-400' },
                  { id: 'learning', label: 'Đang học', icon: BookOpen, color: 'text-yellow-400' },
                  { id: 'mastered', label: 'Đã thuộc', icon: CheckCircle2, color: 'text-emerald-400' },
                  { id: 'starred', label: 'Đã gắn sao', icon: Star, color: 'text-amber-400' },
                ].map((opt) => {
                  const Icon = opt.icon
                  const isActive = filterType === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setFilterType(opt.id)}
                      className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-purple-300' : opt.color}`} />
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                Thứ tự lật thẻ
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'shuffle', label: 'Ngẫu nhiên', icon: Shuffle },
                  { id: 'az', label: 'A-Z', icon: ArrowDownAZ },
                  { id: 'newest', label: 'Mới nhất', icon: Clock },
                  { id: 'oldest', label: 'Cũ nhất', icon: History },
                ].map((opt) => {
                  const Icon = opt.icon
                  const isActive = sortType === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSortType(opt.id)}
                      className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                        isActive
                          ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-lg'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartSetup}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 transition-all hover:scale-[1.01]"
          >
            Bắt Đầu Học Flashcard 🚀
          </button>
        </div>
      ) : !isCompleted && currentCard ? (
        <div className="space-y-6">
          {/* 3D Flip Card Container */}
          <div className="perspective-1000 w-full max-w-xl mx-auto min-h-[400px] cursor-pointer select-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                className="w-full h-full relative transform-style-3d min-h-[400px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: isFlipped ? 180 : 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front of Card */}
                <div
                  className={`absolute inset-0 w-full h-full glass-card rounded-3xl p-8 flex flex-col items-center justify-between text-center border border-slate-700/80 shadow-2xl backface-hidden ${
                    isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 relative">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                      Mặt Trước (Thuật ngữ)
                    </span>
                    <button
                      onClick={toggleStar}
                      className="p-2 rounded-full hover:bg-slate-800 transition-colors z-10"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          currentCard.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                        }`}
                      />
                    </button>
                  </div>
                  <StatusBadges />

                  <div className="space-y-4 my-auto relative w-full">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-wide font-outfit">
                      {currentCard.term}
                    </h2>
                    {currentCard.ipa && (
                      <p className="text-base font-mono text-purple-300 italic">{currentCard.ipa}</p>
                    )}
                    <button
                      onClick={(e) => playAudio(currentCard.term, e)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shadow-md"
                    >
                      <Volume2 className="w-4 h-4 text-purple-400" />
                      <span>Phát âm chuẩn (Phím A / S)</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 font-medium">Nhấp chuột hoặc bấm Space để lật thẻ 🔄</div>
                </div>

                {/* Back of Card */}
                <div
                  className={`absolute inset-0 w-full h-full glass-card rounded-3xl p-8 flex flex-col items-center justify-between text-center border border-purple-500/40 shadow-2xl backface-hidden rotate-y-180 bg-gradient-to-b from-slate-900/95 to-purple-950/50 overflow-y-auto ${
                    !isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 relative">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                      Mặt Sau (Định nghĩa & Luyện phát âm)
                    </span>
                    <div className="flex gap-2 z-10">
                      <button
                        onClick={toggleStar}
                        className="p-1.5 rounded-full hover:bg-slate-800 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            currentCard.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => playAudio(currentCard.term, e)}
                        className="p-1.5 rounded-full text-purple-300 hover:bg-purple-500/10"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 text-left w-full my-auto mt-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Định nghĩa tiếng Anh</span>
                      <p className="text-base font-bold text-white mt-0.5">{currentCard.definition}</p>
                    </div>

                    {currentCard.vietnamese_translation && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-purple-400">Bản dịch Tiếng Việt</span>
                        <p className="text-sm font-semibold text-purple-200 mt-0.5">
                          {currentCard.vietnamese_translation}
                        </p>
                      </div>
                    )}

                    {currentCard.example_sentence && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                        <strong>Ví dụ:</strong> &quot;{currentCard.example_sentence}&quot;
                      </div>
                    )}

                    {/* Integrated AI Pronunciation Module */}
                    <AIPronunciationTrainer
                      targetWord={currentCard.term}
                      targetSentence={currentCard.example_sentence || undefined}
                    />
                  </div>

                  <div className="text-xs text-slate-500 font-medium mt-3">Chọn đánh giá ghi nhớ bên dưới 👇</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Feedback Controls */}
          <div className="flex items-center justify-center gap-4 max-w-xl mx-auto">
            <button
              onClick={() => handleNextCard(false)}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/5 active:scale-95 group"
            >
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Cần Học Lại</span>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-red-950/60 rounded border border-red-800/60 text-red-300 ml-1">
                ← / 1
              </kbd>
            </button>

            <button
              onClick={() => handleNextCard(true)}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 group"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Đã Thuộc</span>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-emerald-950/60 rounded border border-emerald-800/60 text-emerald-300 ml-1">
                → / 2
              </kbd>
            </button>
          </div>

          {/* Keyboard Shortcuts Legend */}
          <div className="p-3 rounded-2xl glass-panel border border-slate-800/90 max-w-xl mx-auto text-center flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Keyboard className="w-4 h-4 text-purple-400" />
              <span>Phím tắt:</span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[11px]">
                Space
              </kbd>{' '}
              Lật thẻ
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-red-400 font-mono text-[11px]">
                ← / 1
              </kbd>{' '}
              Học lại
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[11px]">
                → / 2
              </kbd>{' '}
              Thuộc
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px]">
                A / S
              </kbd>{' '}
              Nghe
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Hoàn Thành Bài Lật Thẻ!</h3>
            <p className="text-slate-400 text-xs">Bạn đã lướt qua toàn bộ thẻ trong phiên học này.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-black text-emerald-400">{masteredCount}</div>
              <div className="text-xs text-slate-400">Từ đã thuộc</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-2xl font-black text-amber-400">{reviewCount}</div>
              <div className="text-xs text-slate-400">Từ cần ôn thêm</div>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Học Lại Phiên Này</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}
