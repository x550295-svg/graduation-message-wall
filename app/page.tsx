'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [sender, setSender] = useState('')
  const [receiver, setReceiver] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function submitMessage() {
    if (!sender || !receiver || !message) {
      alert('請填寫所有欄位')
      return
    }

    const { error } = await supabase.from('messages').insert([
      { sender, receiver, content: message, status: 'pending' },
    ])

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    setSender('')
    setReceiver('')
    setMessage('')
    setSuccess(true)
  }

  const inputClass =
    'w-full rounded-2xl border-2 border-fuchsia-500/60 bg-white/8 px-5 py-4 text-lg font-medium text-white outline-none placeholder:text-white/30 focus:border-cyan-400 focus:bg-white/12 focus:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-200'

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#070022] via-[#120044] to-[#020617] px-4 py-10 text-white">

      {/* KV 圖 — 滿版 */}
      <div className="w-full px-4 mb-10">
        <img
          src="/kv.jpg"
          alt="KCIS 2026"
          className="w-full rounded-[28px] shadow-[0_0_50px_rgba(0,229,255,0.5)]"
        />
      </div>

      {/* 表單卡片 — 滿版 */}
      <section
        className="w-full rounded-none px-6 py-12 md:px-16 lg:px-24"
        style={{
          background: 'linear-gradient(160deg, rgba(20,10,60,0.95) 0%, rgba(10,5,40,0.98) 100%)',
          borderTop: '1px solid rgba(168,85,247,0.5)',
          borderBottom: '1px solid rgba(168,85,247,0.5)',
          boxShadow: '0 0 60px rgba(168,85,247,0.35), 0 0 120px rgba(0,229,255,0.15)',
        }}
      >
        {/* 標題 */}
        <div className="mb-10 text-center">
          <h1
            className="text-4xl font-black tracking-wide text-white md:text-5xl"
            style={{ textShadow: '0 0 30px rgba(0,229,255,0.7), 0 0 60px rgba(168,85,247,0.5)' }}
          >
            留下你的畢業祝福
          </h1>
          <p className="mt-3 text-base text-cyan-300/80">
            你的留言將於審核後出現在畢業典禮現場 🎓
          </p>
        </div>

        {/* 欄位 — 最大寬度限制在內容上，讓整體卡片仍然滿版 */}
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-bold tracking-[0.2em] text-fuchsia-300">
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
              <label className="mb-2 block text-sm font-bold tracking-[0.2em] text-fuchsia-300">
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
              <label className="mb-2 block text-sm font-bold tracking-[0.2em] text-fuchsia-300">
                ✦ 祝福內容
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="寫下你的畢業祝福..."
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

          </div>

          {/* 送出按鈕 */}
          <button
            onClick={submitMessage}
            className="group relative mt-8 w-full overflow-hidden rounded-[24px] py-6 text-3xl font-black tracking-widest text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(90deg, #ff00cc 0%, #7c3aed 50%, #00e5ff 100%)',
              boxShadow: '0 0 30px rgba(255,0,204,0.6), 0 0 60px rgba(124,58,237,0.5), 0 0 90px rgba(0,229,255,0.4)',
              border: '2px solid rgba(255,255,255,0.4)',
            }}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
              ✨ 送出祝福 ✨
            </span>
          </button>

          {success && (
            <div
              className="mt-6 rounded-2xl py-5 text-center text-lg font-bold text-cyan-300"
              style={{
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.4)',
                boxShadow: '0 0 20px rgba(0,229,255,0.2)',
              }}
            >
              🎉 留言已送出，等待審核！
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-5 text-right text-xs leading-6 text-white/40">
            <p>※ 請勿輸入不雅或攻擊性內容</p>
            <p>※ 留言經審核後才會顯示於現場大螢幕</p>
          </div>
        </div>
      </section>
    </main>
  )
}
