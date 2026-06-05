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

const DEFAULT_TEXT = '✨ 每一句祝福，都是青春最珍貴的紀念 ✨'

// 數字越大，跑越快
const PX_PER_SECOND = 120

export default function WallPage() {
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null)
  const [duration, setDuration] = useState(12)

  const textRef = useRef<HTMLDivElement>(null)
  const isCountingRef = useRef(false)

  async function loadNextMessage() {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender, receiver, content, play_target, play_count')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    const activeMessages = (data || []).filter((msg) => {
      const target = msg.play_target || 1
      const count = msg.play_count || 0
      return count < target
    })

    setCurrentMessage(activeMessages[0] || null)
  }

  async function finishOnePlay() {
    if (!currentMessage) return
    if (isCountingRef.current) return

    isCountingRef.current = true

    const nextCount = (currentMessage.play_count || 0) + 1
    const target = currentMessage.play_target || 1
    const isDone = nextCount >= target

    const { error } = await supabase
      .from('messages')
      .update({
        play_count: nextCount,
        status: isDone ? 'completed' : 'approved',
      })
      .eq('id', currentMessage.id)

    if (error) {
      console.error(error)
    }

    setTimeout(async () => {
      isCountingRef.current = false
      await loadNextMessage()
    }, 300)
  }

  useEffect(() => {
    loadNextMessage()

    const timer = setInterval(() => {
      loadNextMessage()
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  const text = currentMessage
    ? `【${currentMessage.sender} 想對 ${currentMessage.receiver} 說】 ${currentMessage.content}`
    : DEFAULT_TEXT

  useEffect(() => {
    requestAnimationFrame(() => {
      if (!textRef.current) return

      const textWidth = textRef.current.scrollWidth
      const screenWidth = window.innerWidth

      // 從右邊外面跑到左邊外面，需要跑過「畫面寬 + 文字寬」
      const distance = screenWidth + textWidth

      // 依照文字長度自動調整秒數
      const seconds = Math.max(distance / PX_PER_SECOND, 8)

      setDuration(seconds)
    })
  }, [text])

  return (
    <main className="wall-page">
      <div
        key={
          currentMessage
            ? `${currentMessage.id}-${currentMessage.play_count}`
            : 'default-marquee'
        }
        ref={textRef}
        className={currentMessage ? 'marquee once' : 'marquee infinite'}
        onAnimationEnd={currentMessage ? finishOnePlay : undefined}
        style={{
          animationDuration: `${duration}s`,
        }}
      >
        {text}
      </div>

      <style>{`
        html,
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #00ff00;
        }

        .wall-page {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #00ff00;
          display: flex;
          align-items: center;
          position: relative;
        }

        .marquee {
          position: absolute;
          white-space: nowrap;
          font-size: 60px;
          font-weight: 900;
          color: #ffffff;
          text-shadow:
            0 0 10px rgba(0,0,0,.9),
            0 0 20px rgba(0,0,0,.9);
          will-change: transform;
          animation-name: marqueeMove;
          animation-timing-function: linear;
        }

        .marquee.infinite {
          animation-iteration-count: infinite;
        }

        .marquee.once {
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }

        @keyframes marqueeMove {
          0% {
            transform: translateX(100vw);
          }

          100% {
            transform: translateX(calc(-100% - 100vw));
          }
        }
      `}</style>
    </main>
  )
}