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

    if (activeMessages.length === 0) {
      setCurrentMessage(null)
      return
    }

    setCurrentMessage(activeMessages[0])
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
      if (!currentMessage) {
        loadNextMessage()
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [currentMessage])

  const text = currentMessage
    ? `【${currentMessage.sender} 想對 ${currentMessage.receiver} 說】 ${currentMessage.content}`
    : ''

  useEffect(() => {
    if (!textRef.current || !text) return

    const textWidth = textRef.current.scrollWidth
    const screenWidth = window.innerWidth
    const distance = textWidth + screenWidth
    const secs = Math.max(distance / PX_PER_SECOND, 8)

    setDuration(secs)
  }, [text])

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
      {text && (
        <div
          key={currentMessage?.id + '-' + currentMessage?.play_count}
          ref={textRef}
          onAnimationEnd={finishOnePlay}
          style={{
            whiteSpace: 'nowrap',
            fontSize: '60px',
            fontWeight: 900,
            color: '#ffffff',
            textShadow:
              '0 0 10px rgba(0,0,0,.9), 0 0 20px rgba(0,0,0,.9)',
            animation: `marquee ${duration}s linear forwards`,
            willChange: 'transform',
          }}
        >
          {text}
        </div>
      )}

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
            transform: translateX(100vw);
          }

          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </main>
  )
}