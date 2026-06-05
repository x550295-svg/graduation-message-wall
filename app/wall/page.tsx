'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Message = {
  id: number
  sender: string
  receiver: string
  content: string
}

const PX_PER_SECOND = 120 // 調整這個數字控制跑馬燈速度

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
    const timer = setInterval(loadData, 3000)
    return () => clearInterval(timer)
  }, [])

  // 文字或訊息數量變動時，重新計算動畫時長
  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.scrollWidth / 2 // 只算一份的寬度
      const secs = Math.max(width / PX_PER_SECOND, 5)
      setDuration(secs)
    }
  }, [messages, displayCount])

  const repeatedMessages = Array(displayCount).fill(messages).flat()

  const text =
    repeatedMessages.length > 0
      ? repeatedMessages
          .map((msg) => `${msg.sender} 想對 ${msg.receiver} 說：${msg.content}`)
          .join('　　｜　　')
      : '等待留言中…'

  // 首尾相接：兩份相同文字，讓第一份跑完時第二份剛好接上
  const fullText = `${text}　　｜　　${text}　　｜　　`

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#070022',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: '96px',
          fontWeight: 900,
          color: '#ffffff',
          // 動畫：移動距離是「一份文字寬度 + 分隔符」= 50% of 兩份
          animation: `marquee ${duration}s linear infinite`,
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
          background: #070022;
        }

        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  )
}

