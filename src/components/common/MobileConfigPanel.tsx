'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BottomSheet } from '@/components/common/BottomSheet'

interface ConfigPanelProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function MobileConfigPanel({ isOpen, onClose, title = 'Cài đặt', children, className = '' }: ConfigPanelProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className={`p-6 space-y-6 ${className}`}>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {children}
        <div className="pt-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-500/20"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}