'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { Flashcards3D } from '@/components/study/Flashcards3D'
import { QuizEngine } from '@/components/study/QuizEngine'
import { SRSView } from '@/components/study/SRSView'
import { AIVocabGenerator } from '@/components/study/AIVocabGenerator'
import { VocabItem } from '@/types/database'
import {
  Sparkles,
  Brain,
  Mic,
  Flame,
  ArrowRight,
  Volume2,
  CalendarClock,
  Trophy,
  Layers,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Bot,
  Play,
  Bookmark,
} from 'lucide-react'

function OAuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      const supabase = createClient()
      supabase
        .auth.exchangeCodeForSession(code)
        .then(() => {
          router.push('/dashboard')
        })
        .catch(() => {
          router.push('/dashboard')
        })
    }
  }, [searchParams, router])

  return null
}

const sampleDemoItems: VocabItem[] = [
  {
    id: 'demo-1',
    set_id: 'demo-set',
    term: 'Atmosphere',
    ipa: '/ˈæt.mə.sfɪər/',
    definition: 'The envelope of gases surrounding the earth or another planet, or the pervading tone/mood.',
    vietnamese_translation: 'Bầu không khí, khí quyển',
    example_sentence: 'The atmosphere in the conference hall was electric before the speech.',
    synonyms: ['air', 'environment', 'ambiance', 'mood'],
    is_starred: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    set_id: 'demo-set',
    term: 'Resilience',
    ipa: '/rɪˈzɪl.jəns/',
    definition: 'The capacity to withstand or recover quickly from difficult conditions.',
    vietnamese_translation: 'Khả năng phục hồi, sự kiên cường',
    example_sentence: 'Courage and resilience helped her navigate through tough economic times.',
    synonyms: ['toughness', 'flexibility', 'durability'],
    is_starred: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    set_id: 'demo-set',
    term: 'Meticulous',
    ipa: '/məˈtɪk.jə.ləs/',
    definition: 'Showing great attention to detail; very careful and precise.',
    vietnamese_translation: 'Tỉ mỉ, cẩn thận',
    example_sentence: 'He performed a meticulous examination of the financial reports.',
    synonyms: ['thorough', 'scrupulous', 'precise'],
    is_starred: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    set_id: 'demo-set',
    term: 'Ubiquitous',
    ipa: '/juːˈbɪk.wə.təs/',
    definition: 'Present, appearing, or found everywhere.',
    vietnamese_translation: 'Có mặt ở khắp mọi nơi',
    example_sentence: 'Smartphones have become ubiquitous in daily life across the globe.',
    synonyms: ['omnipresent', 'pervasive', 'universal'],
    is_starred: true,
    created_at: new Date().toISOString(),
  },
]

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<'flashcard' | 'srs' | 'quiz' | 'ai'>('flashcard')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsLoggedIn(true)
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative overflow-hidden flex flex-col justify-between responsive-boundary">
      <Suspense fallback={null}>
        <OAuthCallbackHandler />
      </Suspense>

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[650px] h-[650px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[450px] h-[450px] bg-emerald-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-14 text-center relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-bold mb-6"
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
          <span>Thế Hệ Tiếp Theo Với Thuật Toán SRS SM-2 & Groq AI</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-5xl mx-auto leading-tight mb-6 font-outfit"
        >
          Chuyển Từ Nhớ Từ Vựng Thụ Động Sang{' '}
          <span className="text-gradient">Phản Xạ Nói Chủ Động</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-400 text-base md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
        >
          Tích hợp thuật toán lặp lại ngắt quãng SM-2 đỉnh cao, thẻ lật 3D đa chiều, chấm điểm phát âm ngữ điệu tức thì và tạo bài học tự động với trí tuệ nhân tạo AI.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14"
        >
          <Link
            href={isLoggedIn ? '/dashboard' : '/register'}
            className="w-full sm:w-auto text-center px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>{isLoggedIn ? 'Bảng Điều Khiển' : 'Bắt Đầu Học Miễn Phí'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#demo-showcase"
            className="w-full sm:w-auto text-center px-8 py-4 rounded-2xl glass-panel text-slate-200 font-semibold text-sm hover:bg-slate-800/80 transition-all border border-slate-700/60 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-purple-400" />
            <span>Thử Mô Phỏng Trực Tiếp</span>
          </a>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
          <div className="glass-card p-4.5 rounded-2xl flex items-center gap-3.5 border border-purple-500/20">
            <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-outfit">SRS SM-2</div>
              <div className="text-xs text-slate-400">Ghi nhớ gấp 10x</div>
            </div>
          </div>

          <div className="glass-card p-4.5 rounded-2xl flex items-center gap-3.5 border border-cyan-500/20">
            <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-outfit">AI Vocab Auto-Fill</div>
              <div className="text-xs text-slate-400">IPA & ví dụ tự động</div>
            </div>
          </div>

          <div className="glass-card p-4.5 rounded-2xl flex items-center gap-3.5 border border-emerald-500/20">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-outfit">Luyện Phát Âm AI</div>
              <div className="text-xs text-slate-400">Chấm điểm từ từng âm</div>
            </div>
          </div>

          <div className="glass-card p-4.5 rounded-2xl flex items-center gap-3.5 border border-amber-500/20">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-outfit">Quiz Testing Engine</div>
              <div className="text-xs text-slate-400">Confetti & Timer Ring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Module Showcase Section */}
      <section id="demo-showcase" className="max-w-6xl mx-auto px-4 py-16 w-full">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 relative shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4" />
                Trải Nghiệm Mô Phỏng Trực Tiếp
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-outfit">
                Các Module Học Tập Đa Dạng
              </h2>
            </div>

            {/* Showcase Selector Tabs */}
            <div className="flex flex-wrap bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('flashcard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'flashcard'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Flashcards 3D</span>
              </button>

              <button
                onClick={() => setActiveTab('srs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'srs'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarClock className="w-4 h-4" />
                <span>Lặp Ngắt Quãng SRS</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'quiz'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Quiz Engine</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'ai'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Vocab Generator</span>
              </button>
            </div>
          </div>

          {/* Module Content Views */}
          <div className="py-2">
            {activeTab === 'flashcard' && (
              <Flashcards3D items={sampleDemoItems} setTitle="Demo Bộ Từ Vựng IELTS" />
            )}

            {activeTab === 'srs' && <SRSView items={sampleDemoItems} />}

            {activeTab === 'quiz' && (
              <QuizEngine items={sampleDemoItems} questionCount={4} timerSeconds={15} />
            )}

            {activeTab === 'ai' && <AIVocabGenerator />}
          </div>
        </div>
      </section>

      {/* Bottom Footer */}
      <Footer />
    </div>
  )
}
