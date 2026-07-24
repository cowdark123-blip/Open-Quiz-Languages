'use client'

import React, { useState, useEffect, useRef } from 'react'
import { fetchUserVocabSets, fetchVocabItems, getCurrentUserProfile, loadActiveSession, saveActiveSession, deleteActiveSession, checkAndUpdateStreak } from '@/lib/supabase/data-service'
import { VocabSet, VocabItem } from '@/types/database'
import { playTTS } from '@/lib/tts'
import { shuffleArray } from '@/lib/random'
import { Headphones, Loader2, Play, Volume2, FastForward, CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import NavigationGuard from '@/components/NavigationGuard'
import InteractiveText from '@/components/InteractiveText'
import MultiSetSelector from '@/components/MultiSetSelector'
import { fetchVocabItemsBySets } from '@/lib/supabase/data-service'

import { useVocab } from '@/contexts/VocabContext'

export default function DictationPage() {
  const { vocabSets: sets, isLoading: contextLoading } = useVocab()
  const [selectedSets, setSelectedSets] = useState<string[]>([])
  const [items, setItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [diffResult, setDiffResult] = useState<{ word: string, status: 'correct' | 'wrong' | 'missing' }[]>([])
  const [targetBand, setTargetBand] = useState('co_ban')
  const [rate, setRate] = useState(1.0)
  const [loadingAi, setLoadingAi] = useState(false)
  const [pendingSession, setPendingSession] = useState<any>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const isSavedRef = React.useRef(false)



  useEffect(() => {
    if (sets.length > 0 && selectedSets.length === 0) {
      setSelectedSets([sets[0].id])
      checkSession([sets[0].id])
    }
  }, [sets, selectedSets])

  useEffect(() => {
    const loadProfile = async () => {
      const { profile } = await getCurrentUserProfile()
      
      if (profile?.target_band) {
        setTargetBand(profile.target_band)
        if (profile.target_band === 'co_ban') setRate(0.85)
        else if (profile.target_band === 'trung_cap') setRate(0.95)
        else if (profile.target_band === 'nang_cao') setRate(1.1)
      }
      setIsLoadingSession(false)
    }
    loadProfile()
  }, [])

  const checkSession = async (setIds: string[]) => {
    if (setIds.length === 0) return
    setIsLoadingSession(true)
    const resourceId = setIds.slice().sort().join(',')
    const sessionData = await loadActiveSession('dictation', resourceId)
    if (sessionData && sessionData.items && sessionData.items.length > 0) {
      setPendingSession(sessionData)
    } else {
      setPendingSession(null)
      setItems([]) // Wait for explicit start
    }
    setIsLoadingSession(false)
  }

  const loadItems = async (setIds: string[], forceNew: boolean = false) => {
    if (setIds.length === 0) return
    setPendingSession(null)
    setLoadingAi(true)
    setErrorMsg('')
    setItems([])
    const fetched = await fetchVocabItemsBySets(setIds)
    if (fetched.length === 0) {
      setErrorMsg('Bộ từ vựng trống. Hãy thêm từ vựng để tạo bài kiểm tra nhé!')
      setItems([])
      setLoading(false)
      setLoadingAi(false)
      return
    }

    const shuffled = shuffleArray(fetched).slice(0, 10)
    const words = shuffled.map(i => i.term)

    try {
      const res = await fetch('/api/ai/dictation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, targetBand })
      })
      const data = await res.json()
      if (res.ok && data.success && data.sentences) {
        const newItems = shuffled.map((item, idx) => ({
          ...item,
          example_sentence: data.sentences[idx] || item.example_sentence
        }))
        setItems(newItems)
      } else {
        setItems(shuffled)
      }
    } catch {
      setItems(shuffled)
    }

    setCurrentIndex(0)
    setInput('')
    setChecked(false)
    setDiffResult([])
    setLoading(false)
    setLoadingAi(false)
  }

  const handleSetChange = (newIds: string[]) => {
    setSelectedSets(newIds)
    setItems([])
    setErrorMsg('')
    checkSession(newIds)
  }

  const playAudio = (isSlow: boolean = false) => {
    const sentence = items[currentIndex]?.example_sentence
    if (!sentence) return
    let finalRate = rate
    if (isSlow) finalRate = finalRate * 0.75
    playTTS(sentence, finalRate)
  }

  const checkAnswer = () => {
    const sentence = items[currentIndex]?.example_sentence
    if (!sentence) return

    const cleanOrigin = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase().trim().split(/\s+/)
    const cleanInput = input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase().trim().split(/\s+/)

    const result: { word: string, status: 'correct' | 'wrong' | 'missing' }[] = []

    // Very basic diff checker
    let i = 0, j = 0
    while (i < cleanOrigin.length || j < cleanInput.length) {
      if (i < cleanOrigin.length && j < cleanInput.length && cleanOrigin[i] === cleanInput[j]) {
        result.push({ word: cleanOrigin[i], status: 'correct' })
        i++
        j++
      } else if (j < cleanInput.length && cleanOrigin.indexOf(cleanInput[j], i) === -1) {
        // User typed an extra/wrong word
        result.push({ word: cleanInput[j], status: 'wrong' })
        j++
      } else if (i < cleanOrigin.length) {
        // Missing word from origin
        result.push({ word: cleanOrigin[i], status: 'missing' })
        i++
      } else {
        j++
      }
    }

    setDiffResult(result)
    setChecked(true)

    // Update streak
    checkAndUpdateStreak().then(() => {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('streak-updated'))
    })
  }

  const nextSentence = async () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setInput('')
      setChecked(false)
      setDiffResult([])
    } else {
      const resourceId = selectedSets.slice().sort().join(',')
      await deleteActiveSession('dictation', resourceId)
      alert('Bạn đã hoàn thành bài luyện tập!')
      handleSetChange(selectedSets)
    }
  }

  const handleSaveAndExit = async () => {
    isSavedRef.current = true
    const resourceId = selectedSets.slice().sort().join(',')
    await saveActiveSession('dictation', resourceId, {
      items,
      currentIndex,
      input,
      checked,
      diffResult
    })
    window.history.go(-2)
  }

  const handleDiscardAndExit = async () => {
    isSavedRef.current = true
    const resourceId = selectedSets.slice().sort().join(',')
    await deleteActiveSession('dictation', resourceId)
    window.history.go(-2)
  }

  useEffect(() => {
    return () => {
      if (!isSavedRef.current && items.length > 0 && currentIndex < items.length) {
        const resourceId = selectedSets.slice().sort().join(',')
        deleteActiveSession('dictation', resourceId)
      }
    }
  }, [items, currentIndex, selectedSets])

  if (contextLoading || isLoadingSession) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-slate-400 text-sm">Đang kiểm tra tiến trình đã lưu...</p>
      </div>
    )
  }

  return (
    <NavigationGuard 
      isDirty={items.length > 0 && currentIndex < items.length}
      onSaveAndExit={handleSaveAndExit}
      onDiscardAndExit={handleDiscardAndExit}
    >
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Headphones className="w-6 h-6 text-amber-400" />
            Nghe Chép Chính Tả (Dictation)
          </h2>
          <p className="text-xs text-slate-400">Luyện nghe sâu với các câu ví dụ từ bộ từ vựng</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <MultiSetSelector 
            sets={sets}
            selectedIds={selectedSets}
            onChange={handleSetChange}
            disabled={items.length > 0}
          />
          <button 
            onClick={() => loadItems(selectedSets, true)}
            disabled={loadingAi || selectedSets.length === 0}
            className="w-full md:w-auto px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Tạo bài mới 🔄
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {!loading && !loadingAi && pendingSession ? (
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 text-center space-y-4 animate-in fade-in">
          <h3 className="text-xl font-bold text-white">Phát hiện bài tập đang làm dở</h3>
          <p className="text-sm text-slate-400">Bạn có muốn tiếp tục phiên học trước đó hay tạo bài tập mới hoàn toàn?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button
              onClick={() => {
                setItems(pendingSession.items)
                setCurrentIndex(pendingSession.currentIndex || 0)
                setInput(pendingSession.input || '')
                setChecked(pendingSession.checked || false)
                setDiffResult(pendingSession.diffResult || [])
                setPendingSession(null)
              }}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              Tiếp Tục Bài Cũ
            </button>
            <button
              onClick={() => loadItems(selectedSets, true)}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
            >
              Tạo Bài Mới (Xóa cũ)
            </button>
          </div>
        </div>
      ) : !loading && !loadingAi && items.length === 0 ? (
        <div className="glass-card p-10 text-center rounded-3xl border border-slate-800 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <Headphones className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Bắt Đầu Luyện Nghe</h3>
            <p className="text-slate-400 text-sm">Hệ thống sẽ tạo các câu ví dụ từ bộ từ vựng để bạn luyện nghe chép chính tả.</p>
          </div>
          <button
            onClick={() => loadItems(selectedSets, true)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Sparkles className="w-5 h-5" />
            Tạo Bài Tập Mới
          </button>
        </div>
      ) : !loading && !loadingAi && items.length > 0 ? (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Câu {currentIndex + 1} / {items.length}
            </span>
            <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
              Từ khóa: {items[currentIndex].term}
            </span>
          </div>

          <div className="flex justify-center gap-4 py-4">
            <button 
              onClick={() => playAudio(false)}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 hover:scale-105 transition-transform flex items-center justify-center shadow-lg shadow-amber-500/20"
            >
              <Volume2 className="w-8 h-8 text-white" />
            </button>
            <button 
              onClick={() => playAudio(true)}
              title="Phát chậm"
              className="w-16 h-16 rounded-full glass-card hover:bg-slate-800 transition-transform flex items-center justify-center border border-slate-700"
            >
              <FastForward className="w-6 h-6 text-amber-400" />
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={checked}
              placeholder="Nghe và gõ lại chính xác câu bạn nghe được..."
              className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 outline-none focus:border-amber-500 resize-none transition-colors"
            />

            {!checked ? (
              <button 
                onClick={checkAnswer}
                disabled={!input.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold disabled:opacity-50 transition-all"
              >
                Kiểm Tra Đáp Án
              </button>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2 font-semibold">Kết quả phân tích:</div>
                  <div className="flex flex-wrap gap-1.5 text-lg font-medium">
                    {diffResult.map((res, i) => (
                      <span 
                        key={i} 
                        className={`px-1 rounded ${
                          res.status === 'correct' ? 'text-emerald-400' : 
                          res.status === 'wrong' ? 'text-red-400 line-through bg-red-950/30' : 
                          'text-amber-400 border-b-2 border-dashed border-amber-500/50'
                        }`}
                      >
                        {res.word}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-900/30">
                  <div className="text-xs text-emerald-500 mb-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Câu gốc chính xác:
                  </div>
                  <div className="text-slate-200">
                    <InteractiveText text={items[currentIndex].example_sentence || ''} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setChecked(false); setDiffResult([]) }}
                    className="flex-1 py-3 rounded-xl glass-card text-slate-300 hover:text-white font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Thử Lại
                  </button>
                  <button 
                    onClick={nextSentence}
                    disabled={currentIndex === items.length - 1}
                    className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    Câu Tiếp Theo <Play className="w-4 h-4 fill-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
    </NavigationGuard>
  )
}
