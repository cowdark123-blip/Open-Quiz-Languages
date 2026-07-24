'use client'

import { useState, useEffect } from 'react'
import { fetchUserVocabSets, fetchVocabItems, getCurrentUserProfile } from '@/lib/supabase/data-service'
import { VocabSet, VocabItem } from '@/types/database'
import { Headphones, Loader2, Play, Volume2, FastForward, CheckCircle2, RotateCcw } from 'lucide-react'
import NavigationGuard from '@/components/NavigationGuard'

export default function DictationPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [items, setItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(false)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [diffResult, setDiffResult] = useState<{ word: string, status: 'correct' | 'wrong' | 'missing' }[]>([])
  const [targetBand, setTargetBand] = useState('co_ban')

  useEffect(() => {
    loadSets()
  }, [])

  const loadSets = async () => {
    setLoading(true)
    const [userSets, { profile }] = await Promise.all([
      fetchUserVocabSets(),
      getCurrentUserProfile()
    ])
    
    if (profile?.target_band) setTargetBand(profile.target_band)

    setSets(userSets)
    if (userSets.length > 0) {
      setSelectedSet(userSets[0].id)
      loadItems(userSets[0].id)
    }
    setLoading(false)
  }

  const loadItems = async (setId: string) => {
    setLoading(true)
    const fetched = await fetchVocabItems(setId)
    // Only keep items that have example sentences
    const withSentences = fetched.filter(item => item.example_sentence && item.example_sentence.trim() !== '')
    setItems(withSentences)
    setCurrentIndex(0)
    setInput('')
    setChecked(false)
    setLoading(false)
  }

  const handleSetChange = (setId: string) => {
    setSelectedSet(setId)
    loadItems(setId)
  }

  const playAudio = (isSlow: boolean = false) => {
    const sentence = items[currentIndex]?.example_sentence
    if (!sentence) return
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.lang = 'en-US'
      
      let rate = 1.0
      if (targetBand === 'mat_goc') rate = 0.85
      else if (targetBand === 'nang_cao') rate = 1.1
      
      if (isSlow) rate = rate * 0.75

      utterance.rate = rate
      window.speechSynthesis.speak(utterance)
    }
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
  }

  const nextSentence = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setInput('')
      setChecked(false)
      setDiffResult([])
    }
  }

  if (loading && sets.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <NavigationGuard isDirty={input.trim().length > 0 && !checked}>
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Headphones className="w-6 h-6 text-amber-400" />
            Nghe Chép Chính Tả (Dictation)
          </h2>
          <p className="text-xs text-slate-400">Luyện nghe sâu với các câu ví dụ từ bộ từ vựng</p>
        </div>
        
        <select 
          className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none w-full md:w-64 focus:border-amber-500"
          value={selectedSet}
          onChange={(e) => handleSetChange(e.target.value)}
        >
          {sets.map(set => (
            <option key={set.id} value={set.id}>{set.title}</option>
          ))}
        </select>
      </div>

      {!loading && items.length === 0 ? (
        <div className="glass-card p-10 text-center rounded-3xl border border-slate-800">
          <p className="text-slate-400">Bộ từ vựng này chưa có câu ví dụ nào để luyện nghe chép.</p>
        </div>
      ) : !loading && items.length > 0 ? (
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
                  <p className="text-slate-200">{items[currentIndex].example_sentence}</p>
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
