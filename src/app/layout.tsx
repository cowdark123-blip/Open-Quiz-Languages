import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenQuiz AI - Học Từ Vựng & Luyện Nói Phản Xạ Thông Minh',
  description: 'Nền tảng học từ vựng SRS lặp lại ngắt quãng, tự động tạo từ vựng bằng AI và luyện phát âm nói phản xạ chi tiết.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-purple-500/30 selection:text-purple-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
