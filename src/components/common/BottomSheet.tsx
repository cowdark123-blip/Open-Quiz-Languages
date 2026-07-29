'use client'

import { useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BottomSheetProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function BottomSheet({ children, isOpen, onClose, className = '' }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!mounted && !isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 ${className}`}>
      <motion.div
        initial={{ y: '100%' }}
        animate={isOpen ? { y: 0 } : { y: '100%' }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`w-full max-w-md bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/50 shadow-2xl rounded-t-3xl`}
      >
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">Cài Đặt</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-hover text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      </motion.div>
    </div>
  )
}