'use client'

import React from 'react'
import Link from 'next/link'
import { Brain, Heart, Code, Globe, MessageSquare, ShieldCheck, Sparkles, Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#070b12]/90 backdrop-blur-xl py-12 px-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[150px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-lg text-white tracking-tight font-outfit">
                OpenQuiz <span className="text-purple-400">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nền tảng học từ vựng thông minh kết hợp lặp lại ngắt quãng SM-2, AI tạo bài học tự động & phản xạ phát âm chuẩn xác.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hệ thống AI & Supabase sẵn sàng</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Điều Hướng</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>
                <Link href="/dashboard" className="hover:text-purple-400 transition-colors">
                  Bảng Điều Khiển
                </Link>
              </li>
              <li>
                <Link href="/sets" className="hover:text-purple-400 transition-colors">
                  Kho Bộ Từ Vựng
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-purple-400 transition-colors">
                  Kiểm Tra Quiz Online
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-purple-400 transition-colors">
                  Cấu Hình Tài Khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Study Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Tính Năng Học Tập</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Thuật Toán SRS SM-2</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Flashcard 3D Đa Chiều</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Pronunciation Evaluation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                <span>Tự Tạo Bộ Từ Bằng Groq AI</span>
              </li>
            </ul>
          </div>

          {/* Community & Social */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Cộng Đồng & Hỗ Trợ</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Theo dõi tin tức phát triển tính năng mới & phản hồi góp ý sản phẩm.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-purple-500/50 transition-all"
                title="GitHub Repository"
              >
                <Code className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                title="Community Web"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all"
                title="Discord Server"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span>© 2026 OpenQuiz AI Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Bảo mật</span>
            <span className="hover:text-slate-400 cursor-pointer">Điều khoản</span>
            <span className="hover:text-slate-400 cursor-pointer">Chính sách cookie</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
