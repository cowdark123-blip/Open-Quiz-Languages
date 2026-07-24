'use client'

import React, { useState, useEffect, useRef } from 'react'
import { PenTool, CheckCircle2, XCircle, Loader2, Play, Sparkles } from 'lucide-react'
import { getCurrentUserProfile, saveActiveSession, loadActiveSession, deleteActiveSession, checkAndUpdateStreak } from '@/lib/supabase/data-service'
import NavigationGuard from '@/components/NavigationGuard'
import InteractiveText from '@/components/InteractiveText'

const TOPICS = [
  'Các thì trong tiếng Anh (Tenses)',
  'Mệnh đề quan hệ (Relative Clauses)',
  'Câu điều kiện (Conditionals)',
  'Câu bị động (Passive Voice)',
  'Giới từ (Prepositions)',
  'Câu trực tiếp & Gián tiếp (Reported Speech)'
]

export default function GrammarPage() {
  const [activeTab, setActiveTab] = useState<'check' | 'practice'>('check')
  
  // Tab 1 State
  const [textToCheck, setTextToCheck] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{ hasError: boolean, correctedText: string | null, explanation: string } | null>(null)

  // Tab 2 State
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0])
  const [generating, setGenerating] = useState(false)
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [targetBand, setTargetBand] = useState('co_ban')
  const [pendingSession, setPendingSession] = useState<any>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const isSavedRef = React.useRef(false)

  useEffect(() => {
    async function fetchBand() {
      const { profile } = await getCurrentUserProfile()
      if (profile?.target_band) setTargetBand(profile.target_band)
    }
    fetchBand()

    const loadSession = async () => {
      setIsLoadingSession(true)
      const sessionData = await loadActiveSession('grammar', 'default')
      if (sessionData && sessionData.practiceQuestions && sessionData.practiceQuestions.length > 0) {
        setPendingSession(sessionData)
        setActiveTab('practice')
      } else {
        setPendingSession(null)
      }
      setIsLoadingSession(false)
    }
    loadSession()
  }, [])

  const handleCheckGrammar = async () => {
    if (!textToCheck.trim()) return
    setChecking(true)
    setCheckResult(null)

    try {
      const res = await fetch('/api/ai/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', text: textToCheck, targetBand })
      })

      if (res.ok) {
        const data = await res.json()
        setCheckResult(data)
      } else {
        alert('Có lỗi xảy ra khi kiểm tra.')
      }
    } catch (error) {
      console.error(error)
      alert('Lỗi kết nối.')
    } finally {
      setChecking(false)
    }
  }

  const handleGeneratePractice = async () => {
    setPendingSession(null)
    setGenerating(true)
    setPracticeQuestions([])
    setAnswers({})
    setSubmitted(false)

    try {
      const res = await fetch('/api/ai/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'practice', topic: selectedTopic, targetBand })
      })

      if (res.ok) {
        const data = await res.json()
        setPracticeQuestions(data.questions)
        await saveActiveSession('grammar', 'default', {
          practiceQuestions: data.questions,
          answers: {},
          submitted: false,
          selectedTopic
        })
      } else {
        alert('Có lỗi xảy ra khi tạo bài tập.')
      }
    } catch (error) {
      console.error(error)
      alert('Lỗi kết nối.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveAndExit = async () => {
    isSavedRef.current = true
    if (practiceQuestions.length > 0 && !submitted) {
      await saveActiveSession('grammar', 'default', {
        practiceQuestions,
        answers,
        submitted,
        selectedTopic
      })
    }
    window.history.go(-2)
  }

  const handleDiscardAndExit = async () => {
    isSavedRef.current = true
    await deleteActiveSession('grammar', 'default')
    window.history.go(-2)
  }

  useEffect(() => {
    return () => {
      if (!isSavedRef.current && practiceQuestions.length > 0 && !submitted) {
        // Cleanup if unmounted unexpectedly
      }
    }
  }, [practiceQuestions, submitted, selectedTopic])

  if (isLoadingSession) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-slate-400 text-sm">Đang kiểm tra tiến trình đã lưu...</p>
      </div>
    )
  }

  return (
    <NavigationGuard 
      isDirty={activeTab === 'practice' && practiceQuestions.length > 0 && !submitted}
      onSaveAndExit={handleSaveAndExit}
      onDiscardAndExit={handleDiscardAndExit}
    >
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PenTool className="w-6 h-6 text-emerald-400" />
              Trợ Lý Ngữ Pháp AI
            </h2>
            <p className="text-xs text-slate-400">Sửa lỗi câu hoặc tạo bài tập ngữ pháp theo chủ đề</p>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl w-full max-w-sm border border-slate-800">
          <button
            onClick={() => setActiveTab('check')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'check' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kiểm tra câu
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'practice' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Luyện tập
          </button>
        </div>
      </div>

      {activeTab === 'check' && (
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Nhập đoạn văn tiếng Anh cần sửa lỗi:</label>
            <textarea
              value={textToCheck}
              onChange={(e) => setTextToCheck(e.target.value)}
              placeholder="VD: She don't like to playing soccer."
              className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none transition-colors"
            />
          </div>
          
          <button 
            onClick={handleCheckGrammar}
            disabled={!textToCheck.trim() || checking}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-300" />}
            Sửa Lỗi Bằng AI
          </button>

          {checkResult && (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {!checkResult.hasError ? (
                <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-400">Hoàn hảo!</h4>
                    <p className="text-sm text-slate-300">{checkResult.explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-slate-900/80 border border-slate-700 rounded-2xl space-y-4">
                  <div>
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1 block">Đã phát hiện lỗi</span>
                    <p className="text-sm text-slate-300"><strong>AI Giải thích:</strong> {checkResult.explanation}</p>
                  </div>
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Câu sửa hoàn chỉnh</span>
                    <div className="text-emerald-400 font-medium text-lg">
                      <InteractiveText text={checkResult.correctedText || ''} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Chọn chủ đề ngữ pháp:</label>
              <select 
                className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button 
              onClick={handleGeneratePractice}
              disabled={generating}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
              Tạo Bài Tập
            </button>
          </div>

          {pendingSession ? (
            <div className="glass-panel p-8 rounded-3xl border border-emerald-500/30 text-center space-y-4 animate-in fade-in">
              <h3 className="text-xl font-bold text-white">Phát hiện bài tập đang làm dở</h3>
              <p className="text-sm text-slate-400">Bạn có muốn tiếp tục bài tập ngữ pháp trước đó hay tạo bài tập mới?</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <button
                  onClick={() => {
                    setPracticeQuestions(pendingSession.practiceQuestions)
                    setAnswers(pendingSession.answers || {})
                    setSubmitted(pendingSession.submitted || false)
                    setSelectedTopic(pendingSession.selectedTopic || TOPICS[0])
                    setPendingSession(null)
                  }}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  Tiếp Tục Bài Cũ
                </button>
                <button
                  onClick={() => setPendingSession(null)}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                >
                  Xóa Bài Cũ
                </button>
              </div>
            </div>
          ) : (
            practiceQuestions.length > 0 && (
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 animate-in fade-in">
              <h3 className="text-xl font-bold text-white mb-6">Bài tập: {selectedTopic}</h3>
              <div className="space-y-8">
                {practiceQuestions.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="text-white font-medium text-lg">
                      {idx + 1}. <InteractiveText text={q.question} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt: string, i: number) => {
                        const isSelected = answers[idx] === opt
                        const isCorrect = opt === q.answer
                        
                        let btnClass = "p-4 rounded-xl border text-sm text-left transition-all "
                        if (!submitted) {
                          btnClass += isSelected ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500"
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
                              {submitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                              {submitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {submitted && (
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 text-sm text-slate-300">
                        <strong className="text-emerald-400">Giải thích:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {!submitted ? (
                <button
                  onClick={async () => {
                    setSubmitted(true)
                    await deleteActiveSession('grammar', 'default')
                    await checkAndUpdateStreak()
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('streak-updated'))
                  }}
                  disabled={Object.keys(answers).length < practiceQuestions.length}
                  className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg disabled:opacity-50 transition-all shadow-lg"
                >
                  Nộp Bài
                </button>
              ) : (
                <button
                  onClick={handleGeneratePractice}
                  className="mt-8 w-full py-4 rounded-xl glass-card text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 font-bold text-lg transition-all"
                >
                  Tạo Bài Khác
                </button>
              )}
            </div>
            )
          )}
          
          {!pendingSession && practiceQuestions.length === 0 && !generating && (
            <div className="glass-card p-10 text-center rounded-3xl border border-slate-800 space-y-4">
               <PenTool className="w-12 h-12 text-slate-600 mx-auto" />
               <p className="text-slate-400">Bấm nút <span className="text-emerald-400 font-bold">Tạo Bài Tập</span> để hệ thống sinh ra bài tập ngữ pháp.</p>
            </div>
          )}
        </div>
      )}
    </div>
    </NavigationGuard>
  )
}
