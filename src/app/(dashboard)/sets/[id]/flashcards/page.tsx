'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import NavigationGuard from '@/components/NavigationGuard'
import { fetchVocabSetById, fetchVocabItems, saveActiveSession, loadActiveSession, deleteActiveSession, saveSRSProgress, updateVocabItem } from '@/lib/supabase/data-service'
import { VocabItem, VocabSet } from '@/types/database'
import { playTTS } from '@/lib/tts'
import * as React from 'react'
import { AIPronunciationTrainer } from '@/components/ai-pronunciation-trainer'
import { Volume2, ArrowLeft, RotateCcw, CheckCircle, XCircle, Sparkles, Trophy, Brain, Keyboard, Loader2, Star } from 'lucide-react'

export default function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const setId = resolvedParams.id
  const router = useRouter()

  const [currentSet, setCurrentSet] = useState<VocabSet | null>(null)
  const [cards, setCards] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredCount, setMasteredCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [toast, setToast] = useState('')
  const [pendingSession, setPendingSession] = useState<any>(null)
  const pendingSaves = React.useRef<Promise<any>[]>([])

  const toggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const card = cards[currentIndex]
    if (!card) return
    const newStarred = !card.is_starred
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_starred: newStarred } : c))
    await updateVocabItem(card.id, { is_starred: newStarred })
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const setObj = await fetchVocabSetById(setId)
      const itemsList = await fetchVocabItems(setId)
      setCurrentSet(setObj)

      const sessionData = await loadActiveSession('flashcards', setId)
      if (sessionData && sessionData.cards && sessionData.cards.length > 0) {
        setPendingSession(sessionData)
      } else {
        setPendingSession(null)
        setCards([...itemsList].sort(() => Math.random() - 0.5))
      }
      setLoading(false)
    }
    loadData()
  }, [setId])

  const currentCard = cards[currentIndex]

  const playAudio = useCallback((text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    playTTS(text)
  }, [])

  const handleNextCard = useCallback((known: boolean) => {
    if (!currentCard) return

    if (known) {
      setMasteredCount((prev) => prev + 1)
      
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + 21)

      // Update local state IMMEDIATELY for the UI to show '🟢 Đã thành thạo'
      setCards(prevCards => prevCards.map(c => 
        c.id === currentCard.id 
          ? { ...c, srsProgress: { ...c.srsProgress, repetition: 4, interval: 21, status: 'mastered' } as any }
          : c
      ))

      // Fire and forget API call so it doesn't block UI transition, but track it to await on exit
      const savePromise = saveSRSProgress({
        item_id: currentCard.id,
        repetition: 4,
        interval: 21,
        status: 'mastered',
        next_review_date: nextDate.toISOString()
      }).catch(console.error)

      pendingSaves.current.push(savePromise)
      savePromise.finally(() => {
        pendingSaves.current = pendingSaves.current.filter(p => p !== savePromise)
      })

      setToast(`🎉 Đã đánh dấu thành thạo từ "${currentCard.term}"!`)
      setTimeout(() => setToast(''), 3000)
    } else {
      setReviewCount((prev) => prev + 1)
    }

    setIsFlipped(false)

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setIsCompleted(true)
      deleteActiveSession('flashcards', setId)
    }
  }, [currentIndex, cards.length, currentCard, setId])

  const handleRestart = async () => {
    setLoading(true)
    setCurrentIndex(0)
    setIsFlipped(false)
    setMasteredCount(0)
    setReviewCount(0)
    setIsCompleted(false)
    
    const itemsList = await fetchVocabItems(setId)
    setCards([...itemsList].sort(() => Math.random() - 0.5))
    await deleteActiveSession('flashcards', setId)
    setLoading(false)
  }

  const handleSaveAndExit = async () => {
    if (pendingSaves.current.length > 0) {
      await Promise.allSettled(pendingSaves.current)
    }
    await saveActiveSession('flashcards', setId, {
      cards,
      currentIndex,
      masteredCount,
      reviewCount
    })
    router.push(`/sets/${setId}`)
  }

  const handleDiscardAndExit = async () => {
    if (pendingSaves.current.length > 0) {
      await Promise.allSettled(pendingSaves.current)
    }
    await deleteActiveSession('flashcards', setId)
    router.push(`/sets/${setId}`)
  }

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (isCompleted || loading) return

      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault()
        handleNextCard(false)
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault()
        handleNextCard(true)
      } else if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'p') {
        e.preventDefault()
        if (currentCard) {
          playAudio(currentCard.term)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCompleted, loading, handleNextCard, currentCard, playAudio])

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-xs">Đang tải thẻ Flashcard 3D từ Supabase...</span>
      </div>
    )
  }

  if (!currentCard || cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Chưa có từ vựng nào trong bộ này</h3>
        <Link href={`/sets/${setId}`} className="text-purple-400 font-semibold hover:underline">
          Quay lại để thêm từ vựng mới
        </Link>
      </div>
    )
  }

  const progressPercent = Math.round(((cards.length > 0 ? (isCompleted ? 1 : currentIndex / cards.length) : 1)) * 100)

  const isMastered = currentCard?.srsProgress?.status === 'mastered' || (currentCard?.srsProgress?.repetition || 0) >= 4
  const isLearning = (currentCard?.srsProgress?.repetition || 0) > 0 && !isMastered
  const isNew = !currentCard?.srsProgress
  const isDuplicate = cards.some(c => c.id !== currentCard.id && 
    ((c.term.toLowerCase() === currentCard.term.toLowerCase()) || 
     (c.vietnamese_translation && currentCard.vietnamese_translation && c.vietnamese_translation.toLowerCase() === currentCard.vietnamese_translation.toLowerCase()))
  )

  const StatusBadges = () => (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {isNew && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20 text-[10px] uppercase">🔴 Chưa học</span>}
      {isLearning && <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/20 text-[10px] uppercase">🟡 Đang học (Lần {currentCard.srsProgress?.repetition})</span>}
      {isMastered && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px] uppercase">🟢 Đã thành thạo</span>}
      {currentCard.is_starred && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 text-[10px] uppercase">⭐ Đã gắn sao</span>}
      {isDuplicate && <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20 text-[10px] uppercase">⚠️ Trùng</span>}
    </div>
  )

  return (
    <NavigationGuard 
      isDirty={currentIndex > 0 && !isCompleted}
      onSaveAndExit={handleSaveAndExit}
      onDiscardAndExit={handleDiscardAndExit}
    >
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-4 relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-emerald-500/90 text-white px-4 py-2 rounded-xl shadow-lg border border-emerald-400/50 text-sm font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {toast}
          </div>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <Link
          href={`/sets/${setId}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentSet?.title || 'Bộ Từ Vựng'}</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Thẻ {isCompleted ? cards.length : currentIndex + 1} / {cards.length}
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
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {pendingSession ? (
        <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 text-center space-y-4 animate-in fade-in max-w-2xl mx-auto mt-12">
          <h3 className="text-xl font-bold text-white">Phát hiện bài học đang làm dở</h3>
          <p className="text-sm text-slate-400">Bạn có muốn tiếp tục phiên học Flashcard trước đó hay bắt đầu lại từ đầu?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button
              onClick={() => {
                setCards(pendingSession.cards)
                setCurrentIndex(pendingSession.currentIndex || 0)
                setMasteredCount(pendingSession.masteredCount || 0)
                setReviewCount(pendingSession.reviewCount || 0)
                setPendingSession(null)
              }}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-500/20"
            >
              Tiếp Tục Phiên Cũ
            </button>
            <button
              onClick={() => {
                setPendingSession(null)
                handleRestart()
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
            >
              Học Lại Từ Đầu (Xóa cũ)
            </button>
          </div>
        </div>
      ) : !isCompleted ? (
        <div className="space-y-6">
          {/* 3D Flip Card Container */}
          <div className="perspective-1000 w-full max-w-xl mx-auto min-h-[420px] cursor-pointer select-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                className="w-full h-full relative transform-style-3d min-h-[420px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: isFlipped ? 180 : 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
              {/* Front of Card */}
              <div
                className={`absolute inset-0 w-full h-full glass-card rounded-3xl p-8 flex flex-col items-center justify-between text-center border border-slate-700/80 shadow-2xl backface-hidden ${
                  isFlipped ? 'pointer-events-none' : ''
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs text-slate-400 relative">
                  <div className="flex flex-col items-start gap-1">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                      Mặt Trước
                    </span>
                  </div>
                  <button onClick={toggleStar} className="p-2 rounded-full hover:bg-slate-800 transition-colors absolute top-0 right-0 z-10">
                    <Star className={`w-5 h-5 ${currentCard.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                  </button>
                </div>
                <StatusBadges />

                <div className="space-y-4 my-auto relative w-full">
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-wide">
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

                <div className="text-xs text-slate-500 font-medium">Lật thẻ để xem định nghĩa & Luyện phát âm AI</div>
              </div>

              {/* Back of Card */}
              <div
                className={`absolute inset-0 w-full h-full glass-card rounded-3xl p-8 flex flex-col items-center justify-between text-center border border-purple-500/40 shadow-2xl backface-hidden rotate-y-180 bg-gradient-to-b from-slate-900/95 to-purple-950/50 overflow-y-auto ${
                  !isFlipped ? 'pointer-events-none' : ''
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-4 relative">
                  <div className="flex flex-col items-start gap-1">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                      Định Nghĩa & Luyện Phát Âm AI
                    </span>
                  </div>
                  <div className="flex gap-2 absolute top-0 right-0 z-10">
                    <button onClick={toggleStar} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
                      <Star className={`w-5 h-5 ${currentCard.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                    </button>
                    <button
                      onClick={(e) => playAudio(currentCard.term, e)}
                      className="p-2 rounded-full text-purple-300 hover:bg-purple-500/10"
                      title="Nghe lại (Phím A / S)"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <StatusBadges />

                <div className="space-y-4 text-left w-full my-auto mt-4">
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

                <div className="text-xs text-slate-500 font-medium mt-4">Chọn mức độ ghi nhớ ở bên dưới</div>
              </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Feedback Controls */}
          <div className="flex items-center justify-center gap-4 max-w-xl mx-auto">
            <button
              onClick={() => handleNextCard(false)}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/5 active:scale-95 group"
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

          {/* Keyboard Shortcuts Legend Footer */}
          <div className="p-3 rounded-2xl glass-panel border border-slate-800/90 max-w-xl mx-auto text-center flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Keyboard className="w-4 h-4 text-purple-400" />
              <span>Phím tắt:</span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[11px]">Space / ↑ / ↓</kbd> Lật thẻ
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-red-400 font-mono text-[11px]">← / 1</kbd> Học lại
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[11px]">→ / 2</kbd> Thuộc
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px]">A / S</kbd> Nghe
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
            <Trophy className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Hoàn Thành Bài Lật Thẻ!</h3>
            <p className="text-slate-400 text-xs">Bạn đã đi qua tất cả các từ vựng trong bộ này.</p>
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

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={handleRestart}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl glass-card text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Học Lại Bộ Này</span>
            </button>
            <Link
              href="/srs"
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" />
              <span>Chuyển Sang Ôn SRS</span>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
    </NavigationGuard>
  )
}
