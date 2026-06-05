'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Message = {
  id: number
  sender: string
  receiver: string
  content: string
}

const PX_PER_SECOND = 140

export default function WallPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [displayCount, setDisplayCount] = useState(1)

  const textRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(20)

  async function loadData() {
    const { data: messageData } = await supabase
      .from('messages')
      .select('id, sender, receiver, content')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    const { data: settingData } = await supabase
      .from('settings')
      .select('display_count')
      .eq('id', 1)
      .single()

    setMessages(messageData || [])
    setDisplayCount(settingData?.display_count || 1)
  }

  useEffect(() => {
    loadData()

    const timer = setInterval(() => {
      loadData()
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.scrollWidth / 2
      const secs = Math.max(width / PX_PER_SECOND, 5)
      setDuration(secs)
    }
  }, [messages, displayCount])

  const repeatedMessages = Array(displayCount)
    .fill(messages)
    .flat()

  const text =
    repeatedMessages.length > 0
      ? repeatedMessages
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