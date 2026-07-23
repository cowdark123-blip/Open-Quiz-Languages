'use client'

import Link from 'next/link'
import { Sparkles, Brain, Mic, Flame, CheckCircle2, ArrowRight, Zap, Volume2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'flashcard' | 'speaking'>('flashcard')
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
                OpenQuiz <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">SRS & Speaking Reflex</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
            <a href="#features" className="hover:text-purple-400 transition-colors">Tính năng</a>
            <a href="#demo" className="hover:text-purple-400 transition-colors">Mô phỏng 3D</a>
            <a href="#srs" className="hover:text-purple-400 transition-colors">Thuật toán SRS</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-8 animate-pulse">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Mô Phỏng Chuẩn OpenQuiz.ai Với Công Nghệ AI</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight mb-6">
          Chuyển Từ Nhớ Từ Vựng Thụ Động Sang <span className="text-gradient">Phản Xạ Nói Chủ Động</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Kết hợp thuật toán lặp lại ngắt quãng SM-2, tự động tạo bài học bằng AI và chấm điểm phát âm ngữ điệu từng từ chi tiết.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            href="/register"
            className="w-full sm:w-auto text-center px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-95 text-white font-bold text-base shadow-xl shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>Tạo Bộ Từ Vựng AI</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto text-center px-8 py-4 rounded-xl glass-panel text-slate-200 font-semibold text-base hover:bg-slate-800/80 transition-all border border-slate-700/60"
          >
            Thử Bản Demo
          </a>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">SRS SM-2</div>
              <div className="text-xs text-slate-400">Nhớ lâu 10x</div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">AI Auto-Fill</div>
              <div className="text-xs text-slate-400">Tự tạo ví dụ & IPA</div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Luyện Nói AI</div>
              <div className="text-xs text-slate-400">Tình huống thực tế</div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Chấm Phát Âm</div>
              <div className="text-xs text-slate-400">Phân tích từ từ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Interactive Preview Section */}
      <section id="demo" className="max-w-5xl mx-auto px-6 py-16">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative shadow-2xl">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Trải Nghiệm Trực Quan OpenQuiz AI</span>
              </h3>
              <p className="text-xs text-slate-400">Thử nghiệm giao diện lật thẻ 3D và chấm điểm luyện nói</p>
            </div>
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('flashcard')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'flashcard' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Thẻ Ghi Nhớ 3D
              </button>
              <button
                onClick={() => setActiveTab('speaking')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'speaking' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chấm Điểm Luyện Nói
              </button>
            </div>
          </div>

          {activeTab === 'flashcard' ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div
                onClick={() => setFlipped(!flipped)}
                className="w-full max-w-md h-64 cursor-pointer perspective-1000 select-none group"
              >
                <div
                  className={`w-full h-full glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-transform duration-500 transform-style-3d relative ${
                    flipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {!flipped ? (
                    <div className="space-y-4">
                      <span className="text-xs uppercase tracking-widest font-semibold text-purple-400">Từ mục tiêu</span>
                      <h2 className="text-4xl font-extrabold text-white tracking-wide">Resilience</h2>
                      <p className="text-slate-400 text-sm italic font-mono">/rɪˈzɪl.jəns/</p>
                      <button className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white">
                        <Volume2 className="w-4 h-4 text-purple-400" />
                        <span>Phát âm chuẩn</span>
                      </button>
                      <p className="text-xs text-slate-500 pt-2">(Nhấp chuột để lật thẻ)</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="text-xs uppercase tracking-widest font-semibold text-cyan-400">Định nghĩa & Ví dụ</span>
                      <h4 className="text-lg font-bold text-white">Khả năng phục hồi, sự kiên cường</h4>
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-left">
                        &quot;Her resilience helped her overcome difficult situations in life.&quot;
                      </p>
                      <p className="text-xs text-purple-300 text-left">
                        <strong>Từ đồng nghĩa:</strong> adaptability, strength, toughness
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SRS Rating Buttons Preview */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <button className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all">
                  Nhắc lại (1 ngày)
                </button>
                <button className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-all">
                  Khó (3 ngày)
                </button>
                <button className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-all">
                  Tốt (7 ngày)
                </button>
                <button className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all">
                  Dễ (14 ngày)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-left">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Tình huống Luyện nói AI:</span>
                <p className="text-sm text-slate-200 mt-1">
                  Hãy miêu tả một thử thách công việc gần đây và cách bạn sử dụng từ <strong className="text-purple-400">&quot;resilience&quot;</strong> để vượt qua nó.
                </p>
              </div>

              {/* Audio Score Breakdown Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="glass-card p-4 rounded-xl">
                  <div className="text-3xl font-black text-emerald-400">92/100</div>
                  <div className="text-xs text-slate-400 mt-1">Điểm Tổng Thể</div>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <div className="text-2xl font-bold text-blue-400">95%</div>
                  <div className="text-xs text-slate-400 mt-1">Độ chính xác</div>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <div className="text-2xl font-bold text-purple-400">88%</div>
                  <div className="text-xs text-slate-400 mt-1">Độ lưu khoát</div>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <div className="text-2xl font-bold text-cyan-400">90%</div>
                  <div className="text-xs text-slate-400 mt-1">Ngữ điệu</div>
                </div>
              </div>

              {/* Word Level Color Output */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2">
                <div className="text-xs text-slate-400 font-medium">Kết quả phân tích từ từ của giọng nói:</div>
                <div className="flex flex-wrap gap-2 text-base font-medium leading-relaxed">
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Showing</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">resilience</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">during</span>
                  <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">tough</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">projects</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">is</span>
                  <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">crucial</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">for success.</span>
                </div>
                <div className="flex items-center gap-4 pt-3 text-xs text-slate-400 border-t border-slate-800/80">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Tốt (&gt;85%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Khá (60-84%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Cần sửa (&lt;60%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-slate-300">OpenQuiz AI</span> © 2026 - Nền tảng Học Từ Vựng & Luyện Nói AI.
          </div>
          <div className="flex items-center gap-6">
            <span>Chính sách bảo mật</span>
            <span>Điều khoản sử dụng</span>
            <span>Hướng dẫn Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
