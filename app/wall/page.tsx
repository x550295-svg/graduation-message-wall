'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [duration, setDuration] = useState(20)

  async function loadMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender, receiver, content, play_target, play_count')
      .eq('status', 'approved')
      .lt('play_count', 'play_target')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setMessages(data || [])
  }

  async function countOnePlay() {
    if (messages.length === 0) return

    for (const msg of messages) {
      const nextCount = (msg.play_count || 0) + 1
      const isDone = nextCount >= (msg.play_target || 0)

      await supabase
        .from('messages')
        .update({
          play_count: nextCount,
          status: isDone ? 'completed' : 'approved',
        })
        .eq('id', msg.id)
    }

    loadMessages()
  }

  useEffect(() => {
    loadMessages()

    const refreshTimer = setInterval(() => {
      loadMessages()
    }, 3000)

    return () => clearInterval(refreshTimer)
  }, [])

  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.scrollWidth / 2
      const secs = Math.max(width / PX_PER_SECOND, 8)
      setDuration(secs)
    }
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) return

    const playTimer = setTimeout(() => {
      countOnePlay()
    }, duration * 1000)

    return () => clearTimeout(playTimer)
  }, [messages, duration])

  const text =
    messages.length > 0
      ? messages
          .map(
            (msg) =>
              `【${msg.sender} 想對 ${msg.receiver} 說】 ${msg.content}`
          )
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
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: '60px',
          fontWeight: 900,
          color: '#ffffff',
          textShadow:
            '0 0 10px rgba(0,0,0,.8), 0 0 20px rgba(0,0,0,.8)',
          animation: `marquee ${duration}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {fullText}
      </div>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #00ff00;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  )
}