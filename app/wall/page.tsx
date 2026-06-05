'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

type Message = {
  id: number
  sender: string
  receiver: string
  content: string
  play_target: number
  play_count: number
}

const PX_PER_SECOND = 140

export default function WallPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const textRef = useRef<HTMLDivElement>(null)
  const durationRef = useRef(20)
  const [animKey, setAnimKey] = useState(0) // 強制重啟動畫用
  const messagesRef = useRef<Message[]>([])

  // 同步 messages 到 ref，讓 timer callback 不會拿到 stale value
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  async function loadMessages() {
    // 用 filter 在 JS 端過濾，避免 Supabase 無法比較兩欄位
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender, receiver, content, play_target, play_count')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    // 過濾 play_count < play_target（在 JS 端做欄位比較）
    const filtered = (data || []).filter(
      (msg) => (msg.play_count || 0) < (msg.play_target || 1)
    )

    setMessages(filtered)
  }

  const countOnePlay = useCallback(async () => {
    const current = messagesRef.current
    if (current.length === 0) return

    for (const msg of current) {
      const nextCount = (msg.play_count || 0) + 1
      const isDone = nextCount >= (msg.play_target || 1)

      await supabase
        .from('messages')
        .update({
          play_count: nextCount,
          status: isDone ? 'completed' : 'approved',
        })
        .eq('id', msg.id)
    }

    loadMessages()
  }, [])

  // 初始載入 + 定時刷新
  useEffect(() => {
    loadMessages()
    const refreshTimer = setInterval(loadMessages, 3000)
    return () => clearInterval(refreshTimer)
  }, [])

  // messages 變動時重算動畫時長，並強制重啟動畫
  useEffect(() => {
    if (!textRef.current) return

    // 等 DOM 更新後再量寬度
    requestAnimationFrame(() => {
      if (!textRef.current) return
      const width = textRef.current.scrollWidth / 2
      const secs = Math.max(width / PX_PER_SECOND, 8)
      durationRef.current = secs
      setAnimKey((k) => k + 1) // 重啟動畫
    })
  }, [messages])

  // 每跑完一圈計一次播放
  useEffect(() => {
    if (messages.length === 0) return

    const secs = durationRef.current
    const playTimer = setTimeout(() => {
      countOnePlay()
    }, secs * 1000)

    return () => clearTimeout(playTimer)
  }, [messages, countOnePlay])

  const text =
    messages.length > 0
      ? messages
          .map((msg) => `【${msg.sender} 想對 ${msg.receiver} 說】 ${msg.content}`)
          .join('　　　✦　　　')
      : '歡迎留下畢業祝福'

  const fullText = `${text}　　　✦　　　${text}`

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#00ff00',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        key={animKey}
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: '60px',
          fontWeight: 900,
          color: '#ffffff',
          textShadow: '0 0 10px rgba(0,0,0,.8), 0 0 20px rgba(0,0,0,.8)',
          animation: `marquee ${durationRef.current}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {fullText}
      </div>

      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #00ff00;
        }

        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  )
}
