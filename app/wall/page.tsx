'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Message = {
  id: number
  sender: string
  receiver: string
  content: string
  play_target?: number
  play_count?: number
}

const PX_PER_SECOND = 120

export default function WallPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('歡迎留下畢業祝福')
  const [duration, setDuration] = useState(20)

  const textRef = useRef<HTMLDivElement>(null)
  const currentIdsRef = useRef<number[]>([])

  async function loadMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender, receiver, content, play_target, play_count')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    const filtered = (data || []).filter((msg) => {
      const target = msg.play_target || 1
      const count = msg.play_count || 0
      return count < target
    })

    setMessages(filtered)
  }

  async function countOnePlay(ids: number[]) {
    if (ids.length === 0) return

    for (const id of ids) {
      const { data, error } = await supabase
        .from('messages')
        .select('play_target, play_count')
        .eq('id', id)
        .single()

      if (error || !data) continue

      const nextCount = (data.play_count || 0) + 1
      const target = data.play_target || 1

      await supabase
        .from('messages')
        .update({
          play_count: nextCount,
          status: nextCount >= target ? 'completed' : 'approved',
        })
        .eq('id', id)
    }

    loadMessages()
  }

  useEffect(() => {
    loadMessages()

    const timer = setInterval(() => {
      loadMessages()
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (messages.length === 0) {
      setText('歡迎留下畢業祝福')
      currentIdsRef.current = []
      return
    }

    const newText = messages
      .map((msg) => `【${msg.sender} 想對 ${msg.receiver} 說】 ${msg.content}`)
      .join('　　　✦　　　')

    setText(newText)
    currentIdsRef.current = messages.map((msg) => msg.id)
  }, [messages])

  useEffect(() => {
    const calculate = () => {
      if (!textRef.current) return

      const textWidth = textRef.current.scrollWidth
      const screenWidth = window.innerWidth
      const distance = textWidth + screenWidth
      const seconds = Math.max(distance / PX_PER_SECOND, 10)

      setDuration(seconds)
    }

    requestAnimationFrame(calculate)
  }, [text])

  useEffect(() => {
    if (currentIdsRef.current.length === 0) return

    const timer = setTimeout(() => {
      countOnePlay(currentIdsRef.current)
    }, duration * 1000)

    return () => clearTimeout(timer)
  }, [duration, text])

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#00ff00',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        ref={textRef}
        style={{
          whiteSpace: 'nowrap',
          fontSize: '60px',
          fontWeight: 900,
          color: '#ffffff',
          textShadow:
            '0 0 10px rgba(0,0,0,.9), 0 0 20px rgba(0,0,0,.9)',
          animation: `marquee ${duration}s linear infinite`,
          willChange: 'transform',
          paddingLeft: '100vw',
        }}
      >
        {text}
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
            transform: translateX(calc(-100% - 100vw));
          }
        }
      `}</style>
    </main>
  )
}