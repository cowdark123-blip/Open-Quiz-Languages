'use client'

import React, { useState, useEffect, useRef } from 'react'
import { fetchUserVocabSets, fetchVocabItems, saveQuizResult, loadActiveSession, saveActiveSession, deleteActiveSession } from '@/lib/supabase/data-service'
import { VocabSet, VocabItem } from '@/types/database'
import { shuffleArray } from '@/lib/random'
import { Trophy, Loader2, Play, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import NavigationGuard from '@/components/NavigationGuard'

type QuizQuestion = {
  vocab: VocabItem
  options: string[]
}

export default function QuizPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(false)
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [saving, setSaving] = useState(false)
  const [pendingSession, setPendingSession] = useState<any>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const isSavedRef = React.useRef(false)

  useEffect(() => {
    loadSets()
  }, [])

  useEffect(() => {
    const loadSession = async () => {
      if (!selectedSet) return
      setIsLoadingSession(true)
      const sessionData = await loadActiveSession('quiz', selectedSet)
      if (sessionData && sessionData.questions && sessionData.questions.length > 0) {
        setPendingSession(sessionData)
      } else {
        setPendingSession(null)
      }
      setIsLoadingSession(false)
    }
    loadSession()
  }, [selectedSet])

  const loadSets = async () => {
    setLoading(true)
    const userSets = await fetchUserVocabSets()
    setSets(userSets)
    if (userSets.length > 0) {
      setSelectedSet(userSets[0].id)
    }
    setLoading(false)
  }

  const handleStartQuiz = async () => {
    if (!selectedSet) return
    setPendingSession(null)
    setLoading(true)
    setQuestions([])
    setAnswers({})
    setIsFinished(false)
    setCurrentIndex(0)
    setScore(0)

    const items = await fetchVocabItems(selectedSet)
    setVocabItems(items)

    if (items.length < 4) {
      alert('Bộ từ vựng cần ít nhất 4 từ để tạo bài kiểm tra trắc nghiệm!')
      setLoading(false)
      return
    }

    // Generate up to 10 questions
    const shuffledItems = shuffleArray(items).slice(0, 10)
    
    const generatedQuestions = shuffledItems.map(targetItem => {
      const wrongOptions = shuffleArray(items.filter(i => i.id !== targetItem.id))
        .slice(0, 3)
        .map(i => i.vietnamese_translation || 'Khác')
      
      const options = shuffleArray([targetItem.vietnamese_translation || 'Chưa rõ', ...wrongOptions]) as string[]
      return { vocab: targetItem, options }
    })

    setQuestions(generatedQuestions)
    setLoading(false)
    // Optional: save immediately on start
    await saveActiveSession('quiz', selectedSet, {
      questions: generatedQuestions,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      score: 0
    })
  }

  const handleSelectOption = (opt: string) => {
    if (isFinished) return
    setAnswers(prev => ({ ...prev, [currentIndex]: opt }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    let currentScore = 0
    questions.forEach((q, idx) => {
      if (answers[idx] === q.vocab.vietnamese_translation) {
        currentScore++
      }
    })
    setScore(currentScore)
    setIsFinished(true)
    
    // Save to DB
    setSaving(true)
    try {
      await saveQuizResult(selectedSet, currentScore, questions.length)
      await deleteActiveSession('quiz', selectedSet)
    } catch (error) {
      console.error('Failed to save score', error)
    }
    setSaving(false)
  }

  const handleSaveAndExit = async () => {
    isSavedRef.current = true
    await saveActiveSession('quiz', selectedSet, {
      questions,
      currentIndex,
      answers,
      isFinished,
      score
    })
    window.history.go(-2)
  }

  const handleDiscardAndExit = async () => {
    isSavedRef.current = true
    await deleteActiveSession('quiz', selectedSet)
    window.history.go(-2)
  }

  useEffect(() => {
    return () => {
      if (!isSavedRef.current && questions.length > 0 && !isFinished) {
        // Cleanup if unmounted without saving explicitly
        // deleteActiveSession('quiz', selectedSet).catch(console.error)
      }
    }
  }, [questions, isFinished, selectedSet])

  if ((loading && sets.length === 0) || isLoadingSession) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-slate-400 text-sm">Đang kiểm tra tiến trình đã lưu...</p>
      </div>
    )
  }

  return (
    <NavigationGuard 
      isDirty={questions.length > 0 && !isFinished}
      onSaveAndExit={handleSaveAndExit}
      onDiscardAndExit={handleDiscardAndExit}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-rose-400" />
            Bài Kiểm Tra (Quiz)
          </h2>
          <p className="text-xs text-slate-400">Kiểm tra trí nhớ & Lưu lại điểm số</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none flex-1 md:w-64 focus:border-rose-500"
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            disabled={questions.length > 0 && !isFinished}
          >
            {sets.map(set => (
              <option key={set.id} value={set.id}>{set.title}</option>
            ))}
          </select>
          
          {(questions.length === 0 || isFinished) && !pendingSession && (
            <button 
              onClick={handleStartQuiz}
              disabled={loading || !selectedSet}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Bắt Đầu
            </button>
          )}
        </div>
      </div>

      {pendingSession ? (
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 text-center space-y-4 animate-in fade-in">
          <h3 className="text-xl font-bold text-white">Phát hiện bài kiểm tra đang làm dở</h3>
          <p className="text-sm text-slate-400">Bạn có muốn tiếp tục bài kiểm tra trước đó hay tạo bài mới?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button
              onClick={() => {
                setQuestions(pendingSession.questions)
                setCurrentIndex(pendingSession.currentIndex || 0)
                setAnswers(pendingSession.answers || {})
                setIsFinished(pendingSession.isFinished || false)
                setScore(pendingSession.score || 0)
                setPendingSession(null)
              }}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-500/20"
            >
              Tiếp Tục Bài Cũ
            </button>
            <button
              onClick={() => {
                setPendingSession(null)
                handleStartQuiz()
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
            >
              Tạo Bài Mới (Xóa cũ)
            </button>
          </div>
        </div>
      ) : questions.length > 0 && !isFinished && (
        <div className="glass-card p-8 rounded-3xl border border-slate-800 animate-in fade-in">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Câu {currentIndex + 1} / {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full ${i <= currentIndex ? 'bg-rose-500' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>

          <div className="text-center py-10 space-y-4">
            <h3 className="text-4xl font-black text-white tracking-wide">{questions[currentIndex].vocab.term}</h3>
            {questions[currentIndex].vocab.ipa && (
              <p className="text-slate-400 font-mono">{questions[currentIndex].vocab.ipa}</p>
            )}
            <p className="text-sm text-slate-500">Nghĩa tiếng Việt của từ này là gì?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {questions[currentIndex].options.map((opt, i) => {
              const isSelected = answers[currentIndex] === opt
              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.2)]' 
                      : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={!answers[currentIndex]}
            className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-lg disabled:opacity-50 transition-all shadow-lg"
          >
            {currentIndex === questions.length - 1 ? 'Hoàn Thành' : 'Câu Tiếp Theo'}
          </button>
        </div>
      )}

      {isFinished && (
        <div className="glass-panel p-10 rounded-3xl border border-rose-500/30 text-center space-y-6 animate-in slide-in-from-bottom-4 shadow-[0_0_30px_rgba(225,29,72,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500" />
          
          <Trophy className="w-20 h-20 text-rose-400 mx-auto drop-shadow-xl" />
          
          <div>
            <h3 className="text-3xl font-black text-white mb-2">Hoàn Thành Bài Kiểm Tra!</h3>
            <p className="text-slate-400">Điểm số của bạn đã được lưu lại hệ thống.</p>
          </div>

          <div className="py-6">
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-pink-600 drop-shadow-sm">
              {score}/{questions.length}
            </div>
            <div className="text-sm font-bold text-rose-500 mt-2 tracking-widest uppercase">
              {Math.round((score / questions.length) * 100)}% Chính xác
            </div>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 text-left bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            {questions.map((q, idx) => {
              const isCorrect = answers[idx] === q.vocab.vietnamese_translation
              return (
                <div key={idx} className="flex items-start justify-between border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                  <div>
                    <span className="font-bold text-white mr-2">{q.vocab.term}</span>
                    <span className="text-xs text-slate-400">- {q.vocab.vietnamese_translation}</span>
                    {!isCorrect && (
                      <div className="text-xs text-red-400 mt-1">Bạn chọn: {answers[idx]}</div>
                    )}
                  </div>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full py-4 rounded-xl glass-card text-rose-400 hover:text-rose-300 hover:bg-slate-800 font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> Thử Lại
          </button>
        </div>
      )}
    </div>
    </NavigationGuard>
  )
}
