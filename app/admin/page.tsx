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

type Tab = 'home' | 'pending' | 'playing' | 'completed' | 'rejected'

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [displayCount, setDisplayCount] = useState(3)
  const [activeTab, setActiveTab] = useState<Tab>('home')

  async function loadData() {
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (messageError) {
      alert(JSON.stringify(messageError))
      return
    }

    const { data: settingData } = await supabase
      .from('settings')
      .select('display_count')
      .eq('id', 1)
      .single()

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
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    loadData()
  }

  async function stopMessage(id: number) {
    const ok = confirm('確定要停止這則留言播放嗎？')
    if (!ok) return

    const { error } = await supabase
      .from('messages')
      .update({ status: 'rejected' })
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
    setActiveTab('playing')
  }

  async function backToPending(id: number) {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'pending',
        play_count: 0,
      })
      .eq('id', id)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    loadData()
    setActiveTab('pending')
  }

  async function clearAllMessages() {
    const ok = confirm(
      '⚠️ 確定要清空所有留言嗎？這個動作無法復原！'
    )

    if (!ok) return

    const secondOk = confirm(
      '再次確認：所有待審核、播放中、已完成、已拒絕留言都會被刪除。確定清空？'
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
    loadData()
  }

  useEffect(() => {
    loadData()

    const timer = setInterval(loadData, 2000)
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

  function TabButton({
    tab,
    label,
    count,
  }: {
    tab: Tab
    label: string
    count?: number
  }) {
    const active = activeTab === tab

    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`rounded-2xl px-6 py-4 text-lg font-black transition ${
          active
            ? 'bg-cyan-400 text-slate-950'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {label}
        {typeof count === 'number' && (
          <span className="ml-2 rounded-full bg-black/30 px-3 py-1 text-sm">
            {count}
          </span>
        )}
      </button>
    )
  }

  function MessageCard({
    msg,
    mode,
  }: {
    msg: Message
    mode: 'pending' | 'playing' | 'completed' | 'rejected'
  }) {
    const target = msg.play_target || 0
    const count = msg.play_count || 0
    const percent =
      target > 0 ? Math.min(Math.round((count / target) * 100), 100) : 0

    return (
      <div className="rounded-[28px] border border-white/15 bg-white/10 p-6">
        <p className="mb-4 text-2xl font-black leading-relaxed">
          {msg.sender} 想對 {msg.receiver} 說：{msg.content}
        </p>

        {mode !== 'pending' && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-lg">
              <p className="text-cyan-200">
                已播放：
                <span className="mx-1 font-black text-white">{count}</span>
                /
                <span className="mx-1 font-black text-white">{target}</span>
                次
              </p>

              <p className="font-black text-white">{percent}%</p>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
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

        {mode === 'playing' && (
          <button
            onClick={() => stopMessage(msg.id)}
            className="rounded-2xl bg-red-600 px-8 py-4 text-xl font-black text-white hover:bg-red-500"
          >
            ⛔ 立即停止播放
          </button>
        )}

        {mode === 'completed' && (
          <button
            onClick={() => replayMessage(msg.id)}
            className="rounded-2xl bg-cyan-400 px-8 py-4 text-xl font-black text-slate-950 hover:bg-cyan-300"
          >
            🔁 重新播放
          </button>
        )}

        {mode === 'rejected' && (
          <button
            onClick={() => backToPending(msg.id)}
            className="rounded-2xl bg-yellow-400 px-8 py-4 text-xl font-black text-slate-950 hover:bg-yellow-300"
          >
            ↩ 重新審核
          </button>
        )}
      </div>
    )
  }

  function MessageList({
    title,
    emptyText,
    data,
    mode,
  }: {
    title: string
    emptyText: string
    data: Message[]
    mode: 'pending' | 'playing' | 'completed' | 'rejected'
  }) {
    return (
      <section>
        <h2 className="mb-6 text-4xl font-black">{title}</h2>

        <div className="grid gap-6">
          {data.length === 0 ? (
            <div className="rounded-3xl bg-white/10 p-8 text-white/50">
              {emptyText}
            </div>
          ) : (
            data.map((msg) => (
              <MessageCard key={msg.id} msg={msg} mode={mode} />
            ))
          )}
        </div>
      </section>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="font-bold text-cyan-300">
              Graduation Message Wall
            </p>

            <h1 className="mb-2 text-5xl font-black">
              留言審核後台
            </h1>

            <p className="text-white/60">
              分頁式管理，避免留言太多時一直往下滑
            </p>
          </div>

          <button
            onClick={clearAllMessages}
            className="rounded-3xl bg-red-700 px-8 py-4 text-xl font-black text-white hover:bg-red-600"
          >
            🗑 清空全部留言
          </button>
        </div>

        <nav className="sticky top-0 z-20 mb-8 flex flex-wrap gap-3 bg-slate-950/95 py-4 backdrop-blur">
          <TabButton tab="home" label="總頁" />
          <TabButton tab="pending" label="新留言" count={pending.length} />
          <TabButton tab="playing" label="正在跑" count={playing.length} />
          <TabButton tab="completed" label="跑完" count={completed.length} />
          <TabButton tab="rejected" label="拒絕/停止" count={rejected.length} />
        </nav>

        {activeTab === 'home' && (
          <>
            <section className="mb-10 grid grid-cols-4 gap-5">
              <button
                onClick={() => setActiveTab('pending')}
                className="rounded-3xl bg-yellow-500/20 p-6 text-left hover:bg-yellow-500/30"
              >
                <p className="text-yellow-200">新留言</p>
                <p className="text-5xl font-black">{pending.length}</p>
              </button>

              <button
                onClick={() => setActiveTab('playing')}
                className="rounded-3xl bg-cyan-500/20 p-6 text-left hover:bg-cyan-500/30"
              >
                <p className="text-cyan-200">正在跑</p>
                <p className="text-5xl font-black">{playing.length}</p>
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className="rounded-3xl bg-green-500/20 p-6 text-left hover:bg-green-500/30"
              >
                <p className="text-green-200">跑完</p>
                <p className="text-5xl font-black">{completed.length}</p>
              </button>

              <button
                onClick={() => setActiveTab('rejected')}
                className="rounded-3xl bg-red-500/20 p-6 text-left hover:bg-red-500/30"
              >
                <p className="text-red-200">拒絕 / 停止</p>
                <p className="text-5xl font-black">{rejected.length}</p>
              </button>
            </section>

            <section className="rounded-[32px] border border-cyan-300/30 bg-white/10 p-8">
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

              <p className="mt-4 text-white/50">
                在「新留言」頁按通過時，會使用這裡當下的次數。
              </p>
            </section>
          </>
        )}

        {activeTab === 'pending' && (
          <>
            <section className="mb-8 rounded-[32px] border border-cyan-300/30 bg-white/10 p-8">
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

            <MessageList
              title="新留言"
              emptyText="目前沒有新的待審核留言"
              data={pending}
              mode="pending"
            />
          </>
        )}

        {activeTab === 'playing' && (
          <MessageList
            title="正在顯示 / 播放中的留言"
            emptyText="目前沒有正在播放的留言"
            data={playing}
            mode="playing"
          />
        )}

        {activeTab === 'completed' && (
          <MessageList
            title="已跑完的留言"
            emptyText="目前沒有已完成播放的留言"
            data={completed}
            mode="completed"
          />
        )}

        {activeTab === 'rejected' && (
          <MessageList
            title="已拒絕 / 已停止"
            emptyText="目前沒有拒絕或停止的留言"
            data={rejected}
            mode="rejected"
          />
        )}
      </div>
    </main>
  )
}