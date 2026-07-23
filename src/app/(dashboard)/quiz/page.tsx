'use client'

import { useState, useEffect } from 'react'
import { fetchUserVocabSets, fetchVocabItems, saveQuizResult } from '@/lib/supabase/data-service'
import { VocabSet, VocabItem } from '@/types/database'
import { Trophy, Loader2, Play, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

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

  useEffect(() => {
    loadSets()
  }, [])

  const loadSets = async () => {
    setLoading(true)
    const userSets = await fetchUserVocabSets()
    setSets(userSets)
    if (userSets.length > 0) {
      setSelectedSet(userSets[0].id)
    }
    setLoading(false)
  }

  const shuffleArray = (array: any[]) => {
    const newArr = [...array]
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]]
    }
    return newArr
  }

  const handleStartQuiz = async () => {
    if (!selectedSet) return
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
        .map(i => i.vietnamese_translation)
      
      const options = shuffleArray([targetItem.vietnamese_translation, ...wrongOptions])
      return { vocab: targetItem, options }
    })

    setQuestions(generatedQuestions)
    setLoading(false)
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
    } catch (error) {
      console.error('Failed to save score', error)
    }
    setSaving(false)
  }

  if (loading && sets.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    )
  }

  return (
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
          
          {(questions.length === 0 || isFinished) && (
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

      {questions.length > 0 && !isFinished && (
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
  )
}
