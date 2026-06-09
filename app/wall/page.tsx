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

type MarqueeItem = {
  uid: string
  type: 'message' | 'default'
  text: string
  message?: Message
}

const DEFAULT_TEXT = '✨ 每一句祝福，都是青春最珍貴的紀念 ✨'

// 數字越大，跑越快
const PX_PER_SECOND = 120

export default function WallPage() {
  const [items, setItems] = useState<MarqueeItem[]>([])

  const messagesRef = useRef<Message[]>([])
  const itemsRef = useRef<MarqueeItem[]>([])
  const nextIndexRef = useRef(0)
  const uidRef = useRef(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  async function loadMessages() {
    if (isLoadingRef.current) return
    isLoadingRef.current = true

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender, receiver, content, play_target, play_count')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    isLoadingRef.current = false

    if (error) {
      console.error(error)
      return
    }

    const activeMessages = (data || []).filter((msg) => {
      const target = msg.play_target || 1
      const count = msg.play_count || 0
      return count < target
    })

    messagesRef.current = activeMessages
  }

  function createItem(): MarqueeItem {
    uidRef.current += 1

    const messages = messagesRef.current

    if (messages.length === 0) {
      return {
        uid: `default-${uidRef.current}`,
        type: 'default',
        text: DEFAULT_TEXT,
      }
    }

    const msg = messages[nextIndexRef.current % messages.length]
    nextIndexRef.current += 1

    return {
      uid: `message-${msg.id}-${uidRef.current}`,
      type: 'message',
      message: msg,
      text: `【${msg.sender} 想對 ${msg.receiver} 說】 ${msg.content}`,
    }
  }

  function spawnNextItem() {
    setItems((current) => {
      // 避免同時在畫面上塞太多則
      if (current.length >= 5) return current

      return [...current, createItem()]
    })
  }

  async function finishItem(item: MarqueeItem) {
    setItems((current) =>
      current.filter((i) => i.uid !== item.uid)
    )

    if (item.type === 'message' && item.message) {
      const { data, error } = await supabase
        .from('messages')
        .select('play_target, play_count')
        .eq('id', item.message.id)
        .single()

      if (!error && data) {
        const nextCount = (data.play_count || 0) + 1
        const target = data.play_target || 1

        await supabase
          .from('messages')
          .update({
            play_count: nextCount,
            status: nextCount >= target ? 'completed' : 'approved',
          })
          .eq('id', item.message.id)
      }

      await loadMessages()
    }

    // 如果畫面上沒有東西了，補一則，避免空畫面
    setTimeout(() => {
      if (itemsRef.current.length === 0) {
        spawnNextItem()
      }
    }, 100)
  }

  useEffect(() => {
    async function init() {
      await loadMessages()
      spawnNextItem()
    }

    init()

    const timer = setInterval(async () => {
      await loadMessages()

      if (itemsRef.current.length === 0) {
        spawnNextItem()
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  return (
    <main className="wall-page">
      {items.map((item) => (
        <MarqueeItemView
          key={item.uid}
          item={item}
          onTriggerNext={spawnNextItem}
          onFinish={finishItem}
        />
      ))}

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
          position: relative;
        }

        .marquee-item {
          position: absolute;
          top: 50%;
          left: 0;
          white-space: nowrap;
          font-size: 60px;
          font-weight: 900;
          color: #ffffff;
          text-shadow:
            0 0 10px rgba(0,0,0,.9),
            0 0 20px rgba(0,0,0,.9);
          will-change: transform;
          transform: translateX(100vw) translateY(-50%);
        }

        .marquee-item.running {
          animation-name: marqueeMove;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        @keyframes marqueeMove {
          0% {
            transform: translateX(100vw) translateY(-50%);
          }

          100% {
            transform: translateX(-100%) translateY(-50%);
          }
        }
      `}</style>
    </main>
  )
}

function MarqueeItemView({
  item,
  onTriggerNext,
  onFinish,
}: {
  item: MarqueeItem
  onTriggerNext: () => void
  onFinish: (item: MarqueeItem) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(12)
  const [ready, setReady] = useState(false)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      if (!ref.current) return

      const textWidth = ref.current.scrollWidth
      const screenWidth = window.innerWidth

      // 整則從右邊外面跑到左邊外面
      const totalDistance = screenWidth + textWidth

      // 最後一個字到畫面中央時，下一則出現
      const triggerDistance = textWidth + screenWidth / 2

      const totalSeconds = Math.max(totalDistance / PX_PER_SECOND, 8)
      const triggerSeconds = Math.max(triggerDistance / PX_PER_SECOND, 1)

      setDuration(totalSeconds)
      setReady(true)

      const triggerTimer = setTimeout(() => {
        if (hasTriggeredRef.current) return
        hasTriggeredRef.current = true
        onTriggerNext()
      }, triggerSeconds * 1000)

      return () => clearTimeout(triggerTimer)
    })
  }, [item.uid, onTriggerNext])

  return (
    <div
      ref={ref}
      className={`marquee-item ${ready ? 'running' : ''}`}
      onAnimationEnd={() => onFinish(item)}
      style={{
        animationDuration: `${duration}s`,
      }}
    >
      {item.text}
    </div>
  )
}