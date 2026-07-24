'use client'

import React, { useState, useEffect, useRef } from 'react'
import { fetchUserVocabSets, fetchVocabItems, getCurrentUserProfile, loadActiveSession, saveActiveSession, deleteActiveSession, checkAndUpdateStreak } from '@/lib/supabase/data-service'
import { VocabSet, VocabItem } from '@/types/database'
import { shuffleArray } from '@/lib/random'
import { BookText, Loader2, Play, CheckCircle2, XCircle } from 'lucide-react'
import NavigationGuard from '@/components/NavigationGuard'
import InteractiveText from '@/components/InteractiveText'

import { useVocab } from '@/contexts/VocabContext'

export default function ReadingPage() {
  const { vocabSets: sets, isLoading: contextLoading } = useVocab()
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [targetBand, setTargetBand] = useState('co_ban')
  
  const [article, setArticle] = useState<string>('')
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [pendingSession, setPendingSession] = useState<any>(null)

  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const isSavedRef = React.useRef(false)

  useEffect(() => {
    if (sets.length > 0 && !selectedSet) {
      setSelectedSet(sets[0].id)
    }
  }, [sets, selectedSet])

  useEffect(() => {
    const fetchBand = async () => {
      const { profile } = await getCurrentUserProfile()
      if (profile?.target_band) setTargetBand(profile.target_band)
    }
    fetchBand()
  }, [])

  useEffect(() => {
    const loadSession = async () => {
      if (!selectedSet) return
      setIsLoadingSession(true)
      const sessionData = await loadActiveSession('reading', selectedSet)
      if (sessionData && sessionData.article) {
        setPendingSession(sessionData)
      } else {
        setPendingSession(null)
      }
      const items = await fetchVocabItems(selectedSet)
      setVocabItems(items)
      setIsLoadingSession(false)
    }
    loadSession()
  }, [selectedSet])

  const handleGenerate = async () => {
    if (!selectedSet) return
    setPendingSession(null)
    setGenerating(true)
    setArticle('')
    setQuestions([])
    setAnswers({})
    setSubmitted(false)
    setErrorMsg('')

    try {
      const items = await fetchVocabItems(selectedSet)
      
      if (items.length === 0) {
        setErrorMsg('Bộ từ vựng trống. Hãy thêm từ vựng để tạo bài đọc hiểu nhé!')
        setGenerating(false)
        return
      }

      setVocabItems(items)
      const words = shuffleArray(items).map(item => item.term).slice(0, 10)

      const res = await fetch('/api/ai/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, targetBand })
      })

      if (res.ok) {
        const data = await res.json()
        setArticle(data.article)
        setQuestions(data.questions)
        await saveActiveSession('reading', selectedSet, {
          article: data.article,
          questions: data.questions,
          answers: {},
          submitted: false
        })
      } else {
        setErrorMsg('Có lỗi xảy ra khi tạo bài đọc.')
      }
    } catch (error) {
      console.error(error)
      setErrorMsg('Có lỗi xảy ra khi tạo bài đọc.')
    } finally {
      setGenerating(false)
    }
  }

  const renderArticle = () => {
    if (!article) return null
    return (
      <div className="leading-relaxed text-slate-300 text-lg">
        <InteractiveText text={article} className="leading-relaxed" containerContext={article} />
      </div>
    )
  }

  const handleSaveAndExit = async () => {
    isSavedRef.current = true
    await saveActiveSession('reading', selectedSet, {
      article,
      questions,
      answers,
      submitted
    })
    window.history.go(-2)
  }

  const handleDiscardAndExit = async () => {
    isSavedRef.current = true
    await deleteActiveSession('reading', selectedSet)
    window.history.go(-2)
  }

  useEffect(() => {
    return () => {
      if (!isSavedRef.current && article !== '' && !submitted) {
        // Cleanup if unmounted unexpectedly
        deleteActiveSession('reading', selectedSet)
      }
    }
  }, [article, submitted, selectedSet])

  if (contextLoading || isLoadingSession) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <p className="text-slate-400 text-sm">Đang kiểm tra tiến trình đã lưu...</p>
      </div>
    )
  }

  return (
    <NavigationGuard 
      isDirty={article !== '' && !submitted}
      onSaveAndExit={handleSaveAndExit}
      onDiscardAndExit={handleDiscardAndExit}
    >
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookText className="w-6 h-6 text-cyan-400" />
            Đọc Hiểu AI (Reading)
          </h2>
          <p className="text-xs text-slate-400">AI sẽ viết một bài báo chứa các từ vựng bạn đang học</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : (
            <select 
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none flex-1 md:w-64"
              value={selectedSet}
              onChange={(e) => {
                setSelectedSet(e.target.value)
                setErrorMsg('')
              }}
            >
              {sets.map(set => (
                <option key={set.id} value={set.id}>{set.title}</option>
              ))}
            </select>
          )}
          
          <button 
            onClick={handleGenerate}
            disabled={loading || generating || !selectedSet}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            Tạo Bài Đọc
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-6">
          {pendingSession ? (
            <div className="glass-panel p-8 rounded-3xl border border-cyan-500/30 text-center space-y-4 animate-in fade-in">
              <h3 className="text-xl font-bold text-white">Phát hiện bài tập đang làm dở</h3>
              <p className="text-sm text-slate-400">Bạn có muốn tiếp tục phiên đọc hiểu trước đó hay tạo bài tập mới?</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <button
                  onClick={() => {
                    setArticle(pendingSession.article)
                    setQuestions(pendingSession.questions || [])
                    setAnswers(pendingSession.answers || {})
                    setSubmitted(pendingSession.submitted || false)
                    setPendingSession(null)
                  }}
                  className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/20"
                >
                  Tiếp Tục Bài Cũ
                </button>
                <button
                  onClick={() => handleGenerate()}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                >
                  Tạo Bài Mới (Xóa cũ)
                </button>
              </div>
            </div>
          ) : (
            article && (
              <div className="glass-card p-8 rounded-3xl border border-slate-800 relative">
                <div className="absolute top-4 right-4 text-xs font-bold bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">
                  AI Generated
                </div>
                <h3 className="text-2xl font-black text-white mb-6">Reading Comprehension</h3>
                {renderArticle()}
              </div>
            )
          )}

          {questions.length > 0 && (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-6">Câu hỏi trắc nghiệm</h3>
              <div className="space-y-8">
                {questions.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <p className="text-white font-medium">{idx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt: string, i: number) => {
                        const isSelected = answers[idx] === opt
                        const isCorrect = opt === q.answer
                        
                        let btnClass = "p-3 rounded-xl border text-sm text-left transition-all "
                        if (!submitted) {
                          btnClass += isSelected ? "bg-cyan-600/20 border-cyan-500 text-cyan-300" : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500"
                        } else {
                          if (isCorrect) btnClass += "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                          else if (isSelected) btnClass += "bg-red-600/20 border-red-500 text-red-300"
                          else btnClass += "bg-slate-900/50 border-slate-800 text-slate-500 opacity-50"
                        }

                        return (
                          <button 
                            key={i}
                            disabled={submitted}
                            onClick={() => setAnswers(prev => ({ ...prev, [idx]: opt }))}
                            className={btnClass}
                          >
                            <div className="flex items-center justify-between">
                              <span>{opt}</span>
                              {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                              {submitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {submitted && (
                      <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-sm text-slate-300">
                        <strong>Giải thích:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {!submitted && (
                <button
                  onClick={async () => {
                    setSubmitted(true)
                    await deleteActiveSession('reading', selectedSet)
                    await checkAndUpdateStreak()
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('streak-updated'))
                  }}
                  disabled={Object.keys(answers).length < questions.length}
                  className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold disabled:opacity-50 transition-all"
                >
                  Nộp Bài Kiểm Tra
                </button>
              )}
            </div>
          )}
          
          {!pendingSession && !article && !loading && !generating && (
            <div className="glass-card p-10 text-center rounded-3xl border border-slate-800 space-y-4">
               <BookText className="w-12 h-12 text-slate-600 mx-auto" />
               <p className="text-slate-400">Bấm nút <span className="text-cyan-400 font-bold">Tạo Bài Đọc</span> để AI viết một bài báo ngắn bằng tiếng Anh dựa trên bộ từ vựng của bạn.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </NavigationGuard>
  )
}
