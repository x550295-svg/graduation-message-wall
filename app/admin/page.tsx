'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Message = {
  id: number
  sender: string
  receiver: string
  content: string
  status: string
  play_target: number
  play_count: number
  created_at: string
}

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [displayCount, setDisplayCount] = useState(3)

  async function loadData() {
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (messageError) {
      alert(JSON.stringify(messageError))
      return
    }

    const { data: settingData, error: settingError } = await supabase
      .from('settings')
      .select('display_count')
      .eq('id', 1)
      .single()

    if (settingError) {
      alert(JSON.stringify(settingError))
      return
    }

    setMessages(messageData || [])
    setDisplayCount(settingData?.display_count || 3)
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

  async function approveMessage(id: number) {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'approved',
        play_target: displayCount,
        play_count: 0,
      })
      .eq('id', id)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    loadData()
  }

  async function rejectMessage(id: number) {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'rejected',
      })
      .eq('id', id)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    loadData()
  }

  async function replayMessage(id: number) {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'approved',
        play_count: 0,
      })
      .eq('id', id)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    loadData()
  }

  useEffect(() => {
    loadData()

    const timer = setInterval(loadData, 3000)
    return () => clearInterval(timer)
  }, [])

  const pending = messages.filter((m) => m.status === 'pending')
  const playing = messages.filter(
    (m) =>
      m.status === 'approved' &&
      (m.play_count || 0) < (m.play_target || 0)
  )
  const completed = messages.filter(
    (m) =>
      m.status === 'completed' ||
      (m.status === 'approved' &&
        (m.play_target || 0) > 0 &&
        (m.play_count || 0) >= (m.play_target || 0))
  )
  const rejected = messages.filter((m) => m.status === 'rejected')

  function MessageCard({
    msg,
    mode,
  }: {
    msg: Message
    mode: 'pending' | 'playing' | 'completed' | 'rejected'
  }) {
    return (
      <div className="rounded-[28px] border border-white/15 bg-white/10 p-6">
        <p className="mb-4 text-2xl font-black leading-relaxed">
          {msg.sender} 想對 {msg.receiver} 說：{msg.content}
        </p>

        {mode !== 'pending' && (
          <div className="mb-5 text-lg text-cyan-200">
            已播放：
            <span className="font-black text-white">
              {msg.play_count || 0}
            </span>
            {' / '}
            目標：
            <span className="font-black text-white">
              {msg.play_target || 0}
            </span>
          </div>
        )}

        {mode === 'pending' && (
          <div className="grid grid-cols-2 gap-16">
            <button
              onClick={() => approveMessage(msg.id)}
              className="rounded-3xl bg-green-500 py-5 text-2xl font-black text-slate-950 hover:bg-green-400"
            >
              ✅ 通過
            </button>

            <button
              onClick={() => rejectMessage(msg.id)}
              className="rounded-3xl bg-red-600 py-5 text-2xl font-black text-white hover:bg-red-500"
            >
              ❌ 拒絕
            </button>
          </div>
        )}

        {mode === 'completed' && (
          <button
            onClick={() => replayMessage(msg.id)}
            className="rounded-2xl bg-cyan-400 px-8 py-4 text-xl font-black text-slate-950 hover:bg-cyan-300"
          >
            🔁 重新播放
          </button>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="font-bold text-cyan-300">
          Graduation Message Wall
        </p>

        <h1 className="mb-2 text-5xl font-black">
          留言審核後台
        </h1>

        <p className="mb-8 text-white/60">
          通過時會鎖定當下播放次數，不會被之後設定影響
        </p>

        <section className="mb-10 grid grid-cols-4 gap-5">
          <div className="rounded-3xl bg-white/10 p-6">
            <p className="text-white/50">總留言</p>
            <p className="text-4xl font-black">{messages.length}</p>
          </div>

          <div className="rounded-3xl bg-yellow-500/20 p-6">
            <p className="text-yellow-200">待審核</p>
            <p className="text-4xl font-black">{pending.length}</p>
          </div>

          <div className="rounded-3xl bg-cyan-500/20 p-6">
            <p className="text-cyan-200">播放中</p>
            <p className="text-4xl font-black">{playing.length}</p>
          </div>

          <div className="rounded-3xl bg-green-500/20 p-6">
            <p className="text-green-200">已完成</p>
            <p className="text-4xl font-black">{completed.length}</p>
          </div>
        </section>

        <section className="mb-10 rounded-[32px] border border-cyan-300/30 bg-white/10 p-8">
          <p className="mb-4 text-xl font-bold text-cyan-200">
            新通過留言預設播放次數
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

        <section className="mb-12">
          <h2 className="mb-5 text-3xl font-black text-yellow-300">
            待審核留言
          </h2>

          <div className="grid gap-6">
            {pending.length === 0 ? (
              <p className="text-white/50">目前沒有待審核留言</p>
            ) : (
              pending.map((msg) => (
                <MessageCard key={msg.id} msg={msg} mode="pending" />
              ))
            )}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-5 text-3xl font-black text-cyan-300">
            播放中留言
          </h2>

          <div className="grid gap-6">
            {playing.length === 0 ? (
              <p className="text-white/50">目前沒有播放中的留言</p>
            ) : (
              playing.map((msg) => (
                <MessageCard key={msg.id} msg={msg} mode="playing" />
              ))
            )}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-5 text-3xl font-black text-green-300">
            已播放完成
          </h2>

          <div className="grid gap-6">
            {completed.length === 0 ? (
              <p className="text-white/50">目前沒有完成播放的留言</p>
            ) : (
              completed.map((msg) => (
                <MessageCard key={msg.id} msg={msg} mode="completed" />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-3xl font-black text-red-300">
            已拒絕
          </h2>

          <div className="grid gap-6">
            {rejected.length === 0 ? (
              <p className="text-white/50">目前沒有拒絕留言</p>
            ) : (
              rejected.map((msg) => (
                <MessageCard key={msg.id} msg={msg} mode="rejected" />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}