'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Brain, AlertCircle, ShieldCheck, ArrowRight, Loader2, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider)
    setErrorMsg('')

    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })

      if (error) {
        setErrorMsg(`Không thể kết nối ${provider}: ${error.message}`)
        setLoadingProvider(null)
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối: ${err.message || 'Vui lòng thử lại'}`)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 relative overflow-hidden responsive-boundary">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative z-10 space-y-6 bg-slate-950/80"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2 group mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform duration-300">
              <Brain className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl font-black text-white font-outfit tracking-tight">
            Đăng Nhập OpenQuiz AI
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
            Xác thực an toàn qua tài khoản Google hoặc GitHub của bạn
          </p>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-rose-300 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* OAuth Buttons Container */}
        <div className="space-y-3 pt-2">
          {/* Google Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOAuthLogin('google')}
            disabled={loadingProvider !== null}
            className="w-full py-3.5 px-4 rounded-2xl glass-card hover:bg-slate-800 text-slate-100 font-bold text-xs border border-slate-700/80 hover:border-purple-500/50 transition-all shadow-lg flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loadingProvider === 'google' ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}</span>
          </motion.button>

          {/* GitHub Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOAuthLogin('github')}
            disabled={loadingProvider !== null}
            className="w-full py-3.5 px-4 rounded-2xl glass-card hover:bg-slate-800 text-slate-100 font-bold text-xs border border-slate-700/80 hover:border-purple-500/50 transition-all shadow-lg flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
          >
            {loadingProvider === 'github' ? (
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            ) : (
              <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            <span>{loadingProvider === 'github' ? 'Đang kết nối GitHub...' : 'Tiếp tục với GitHub'}</span>
          </motion.button>
        </div>

        <div className="pt-2 text-center border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-bold text-purple-400 hover:text-purple-300 underline ml-1">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Bảo mật thông tin người dùng với Supabase Auth SSL
          </p>
        </div>
      </motion.div>
    </div>
  )
}
