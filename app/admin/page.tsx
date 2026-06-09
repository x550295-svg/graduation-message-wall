'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Message = {
  id: number
  sender: string
  receiver: string
  content: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [displayCount, setDisplayCount] = useState(3)

  async function loadMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    setMessages(data || [])
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('display_count')
      .eq('id', 1)
      .single()

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    setDisplayCount(data?.display_count || 3)
  }

  async function updateDisplayCount(count: number) {
    if (count < 1) return

    const { error } = await supabase
      .from('settings')
      .update({ display_count: count })
      .eq('id', 1)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    setDisplayCount(count)
  }

  async function updateStatus(id: number, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('messages')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    loadMessages()
  }

  async function clearAllMessages() {
    const ok = confirm(
      '⚠️ 確定要清空所有留言嗎？這個動作無法復原！'
    )

    if (!ok) return

    const secondOk = confirm(
      '再次確認：所有待審核、已通過、已拒絕的留言都會被刪除。確定清空？'
    )

    if (!secondOk) return

    const { error } = await supabase
      .from('messages')
      .delete()
      .neq('id', 0)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    alert('✅ 所有留言已清空')
    loadMessages()
  }

  useEffect(() => {
    loadMessages()
    loadSettings()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-bold text-cyan-300">Graduation Message Wall</p>
        <h1 className="mb-2 text-5xl font-black">留言審核後台</h1>
        <p className="mb-8 text-white/60">
          通過後的留言才會出現在 LED 留言牆
        </p>

        <div className="mb-8 flex justify-end">
          <button
            onClick={clearAllMessages}
            className="rounded-3xl bg-red-700 px-8 py-4 text-xl font-black text-white hover:bg-red-600"
          >
            🗑 清空全部留言
          </button>
        </div>

        <section className="mb-10 rounded-[32px] border border-cyan-300/30 bg-white/10 p-8 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
          <p className="mb-4 text-xl font-bold text-cyan-200">
            全體留言播放次數
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => updateDisplayCount(displayCount - 1)}
              className="rounded-2xl bg-white/20 px-8 py-4 text-4xl font-black hover:bg-white/30"
            >
              -
            </button>

            <div className="w-24 text-center text-6xl font-black">
              {displayCount}
            </div>

            <button
              onClick={() => updateDisplayCount(displayCount + 1)}
              className="rounded-2xl bg-white/20 px-8 py-4 text-4xl font-black hover:bg-white/30"
            >
              +
            </button>
          </div>
        </section>

        {messages.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white/60">
            目前沒有待審核留言
          </div>
        ) : (
          <div className="grid gap-8">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-[32px] border border-white/15 bg-white/10 p-8 shadow-xl"
              >
                <p className="mb-4 text-sm font-bold text-cyan-300">
                  待審核留言
                </p>

                <p className="mb-10 text-3xl font-black leading-relaxed">
                  {msg.sender} 想對 {msg.receiver} 說：{msg.content}
                </p>

                <div className="grid grid-cols-2 gap-16">
                  <button
                    onClick={() => updateStatus(msg.id, 'approved')}
                    className="rounded-3xl bg-green-500 py-6 text-3xl font-black text-slate-950 hover:bg-green-400"
                  >
                    ✅ 通過
                  </button>

                  <button
                    onClick={() => updateStatus(msg.id, 'rejected')}
                    className="rounded-3xl bg-red-600 py-6 text-3xl font-black text-white hover:bg-red-500"
                  >
                    ❌ 拒絕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}