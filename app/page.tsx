'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [sender, setSender] = useState('')
  const [receiver, setReceiver] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitMessage() {
    if (isSubmitting) return

    if (!sender || !receiver || !message) {
      alert('請填寫所有欄位')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.from('messages').insert([
      { sender, receiver, content: message, status: 'pending' },
    ])

    setIsSubmitting(false)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    setSender('')
    setReceiver('')
    setMessage('')
    setSuccess(true)

    setTimeout(() => {
      setSuccess(false)
    }, 4000)
  }

  const inputClass =
    'w-full rounded-xl md:rounded-2xl border-2 border-fuchsia-500/60 bg-white/8 px-4 py-2.5 md:px-5 md:py-3 text-base md:text-lg font-medium text-white outline-none placeholder:text-white/30 focus:border-cyan-400 focus:bg-white/12 focus:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-200'

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#070022] via-[#120044] to-[#020617] px-3 py-4 text-white md:px-4 md:py-5">

      {/* KV 圖 — 滿版 */}
      <div className="mb-4 w-full px-2 md:mb-5 md:px-4">
        <img
          src="/kv.jpg"
          alt="KCIS 2026"
          className="w-full rounded-[20px] shadow-[0_0_40px_rgba(0,229,255,0.45)] md:rounded-[28px]"
        />
      </div>

      {/* 表單卡片 — 滿版 */}
      <section
        className="w-full rounded-none px-4 py-5 md:px-12 md:py-7 lg:px-20"
        style={{
          background: 'linear-gradient(160deg, rgba(20,10,60,0.95) 0%, rgba(10,5,40,0.98) 100%)',
          borderTop: '1px solid rgba(168,85,247,0.5)',
          borderBottom: '1px solid rgba(168,85,247,0.5)',
          boxShadow: '0 0 45px rgba(168,85,247,0.3), 0 0 90px rgba(0,229,255,0.12)',
        }}
      >
        {/* 標題 */}
        <div className="mb-4 text-center md:mb-5">
          <h1
            className="text-3xl font-black tracking-wide text-white md:text-4xl lg:text-5xl"
            style={{ textShadow: '0 0 30px rgba(0,229,255,0.7), 0 0 60px rgba(168,85,247,0.5)' }}
          >
            留下你的畢業祝福
          </h1>
          <p className="mt-2 text-sm text-cyan-300/80 md:text-base">
            你的留言將於審核後出現在畢業典禮現場 🎓
          </p>
        </div>

        {/* 欄位 */}
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">

            <div>
              <label className="mb-1 block text-xs font-bold tracking-[0.2em] text-fuchsia-300 md:mb-2 md:text-sm">
                ✦ 我是誰
              </label>
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="例如：阿明、神秘人、隔壁班同學"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold tracking-[0.2em] text-fuchsia-300 md:mb-2 md:text-sm">
                ✦ 想對誰說
              </label>
              <input
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="例如：小美、班導、全體畢業生"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold tracking-[0.2em] text-fuchsia-300 md:mb-2 md:text-sm">
                ✦ 祝福內容
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="寫下你的畢業祝福..."
                rows={2}
                className={`${inputClass} h-[72px] resize-none md:h-[95px]`}
              />
            </div>

          </div>

          {/* 送出按鈕 */}
          <button
            onClick={submitMessage}
            disabled={isSubmitting}
            className="group relative mt-4 w-full overflow-hidden rounded-[18px] py-4 text-xl font-black tracking-widest text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 md:mt-5 md:rounded-[24px] md:py-5 md:text-3xl"
            style={{
              background: 'linear-gradient(90deg, #ff00cc 0%, #7c3aed 50%, #00e5ff 100%)',
              boxShadow: '0 0 25px rgba(255,0,204,0.55), 0 0 50px rgba(124,58,237,0.45), 0 0 70px rgba(0,229,255,0.35)',
              border: '2px solid rgba(255,255,255,0.4)',
            }}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
              {isSubmitting ? '送出中...' : '✨ 送出祝福 ✨'}
            </span>
          </button>

          {success && (
            <div
              className="mt-3 rounded-2xl py-3 text-center text-sm font-bold text-cyan-300 md:mt-4 md:py-4 md:text-base"
              style={{
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.4)',
                boxShadow: '0 0 20px rgba(0,229,255,0.2)',
              }}
            >
              🎉 留言已送出，等待審核！
            </div>
          )}

          <div className="mt-4 border-t border-white/10 pt-3 text-right text-[10px] leading-5 text-white/40 md:mt-5 md:pt-4 md:text-xs">
            <p>※ 請勿輸入不雅或攻擊性內容</p>
            <p>※ 留言經審核後才會顯示於現場大螢幕</p>
          </div>
        </div>
      </section>
    </main>
  )
}