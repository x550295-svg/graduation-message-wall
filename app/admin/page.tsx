'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type MessageStatus = 'pending' | 'approved' | 'completed' | 'rejected'
type AdminTab = 'home' | 'pending' | 'running' | 'completed'

type Message = {
  id: number
  sender: string
  receiver: string
  content: string
  status: MessageStatus
  created_at: string
}

const tabLabels: Record<AdminTab, string> = {
  home: '總頁',
  pending: '新的留言',
  running: '正在跑',
  completed: '跑完的留言',
}

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [displayCount, setDisplayCount] = useState(3)
  const [activeTab, setActiveTab] = useState<AdminTab>('home')
  const [loading, setLoading] = useState(false)

  const pendingMessages = useMemo(
    () => messages.filter((message) => message.status === 'pending'),
    [messages]
  )

  const runningMessages = useMemo(
    () => messages.filter((message) => message.status === 'approved'),
    [messages]
  )

  const completedMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.status === 'completed' || message.status === 'rejected'
      ),
    [messages]
  )

  async function loadMessages() {
    setLoading(true)

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    setMessages((data || []) as Message[])
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

  async function updateStatus(id: number, status: MessageStatus) {
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
    const ok = confirm('確定要清空所有留言嗎？這個動作無法復原。')

    if (!ok) return

    const secondOk = confirm(
      '再次確認：所有新的留言、正在跑、跑完與已拒絕留言都會被刪除。確定清空？'
    )

    if (!secondOk) return

    const { error } = await supabase.from('messages').delete().neq('id', 0)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    alert('所有留言已清空')
    loadMessages()
  }

  useEffect(() => {
    loadMessages()
    loadSettings()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-bold text-cyan-300">Graduation Message Wall</p>
            <h1 className="mt-2 text-4xl font-black md:text-5xl">
              留言審核後台
            </h1>
            <p className="mt-3 text-white/60">
              分頁管理新的留言、正在播放與已結束的留言
            </p>
          </div>

          <button
            onClick={clearAllMessages}
            className="rounded-2xl bg-red-700 px-6 py-4 text-lg font-black text-white hover:bg-red-600"
          >
            清空全部留言
          </button>
        </div>

        <nav className="mb-8 grid gap-3 md:grid-cols-4">
          {(Object.keys(tabLabels) as AdminTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl border px-5 py-4 text-left font-black transition ${
                activeTab === tab
                  ? 'border-cyan-300 bg-cyan-300 text-slate-950'
                  : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </nav>

        {loading && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-white/70">
            正在更新資料...
          </div>
        )}

        {activeTab === 'home' && (
          <section className="grid gap-5 md:grid-cols-3">
            <DashboardCard
              title="新的留言"
              count={pendingMessages.length}
              description="審核通過後會進入正在跑"
              onClick={() => setActiveTab('pending')}
            />
            <DashboardCard
              title="正在跑"
              count={runningMessages.length}
              description={`目前每則播放 ${displayCount} 次`}
              onClick={() => setActiveTab('running')}
            />
            <DashboardCard
              title="跑完的留言"
              count={completedMessages.length}
              description="包含已跑完與已拒絕留言"
              onClick={() => setActiveTab('completed')}
            />
          </section>
        )}

        {activeTab === 'pending' && (
          <section className="grid gap-8">
            <DisplayCountPanel
              displayCount={displayCount}
              onChange={updateDisplayCount}
            />

            <MessageList
              emptyText="目前沒有新的留言"
              messages={pendingMessages}
              badgeText="新的留言"
              actions={(message) => (
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    onClick={() => updateStatus(message.id, 'approved')}
                    className="rounded-2xl bg-green-500 py-5 text-2xl font-black text-slate-950 hover:bg-green-400"
                  >
                    通過
                  </button>
                  <button
                    onClick={() => updateStatus(message.id, 'rejected')}
                    className="rounded-2xl bg-red-600 py-5 text-2xl font-black text-white hover:bg-red-500"
                  >
                    拒絕
                  </button>
                </div>
              )}
            />
          </section>
        )}

        {activeTab === 'running' && (
          <MessageList
            emptyText="目前沒有正在跑的留言"
            messages={runningMessages}
            badgeText="正在跑"
            actions={(message) => (
              <button
                onClick={() => updateStatus(message.id, 'completed')}
                className="w-full rounded-2xl bg-cyan-300 py-5 text-2xl font-black text-slate-950 hover:bg-cyan-200"
              >
                標記跑完
              </button>
            )}
          />
        )}

        {activeTab === 'completed' && (
          <MessageList
            emptyText="目前沒有跑完的留言"
            messages={completedMessages}
            badgeText="已結束"
            actions={(message) => (
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => updateStatus(message.id, 'approved')}
                  className="rounded-2xl bg-cyan-300 py-5 text-2xl font-black text-slate-950 hover:bg-cyan-200"
                >
                  重新播放
                </button>
                <button
                  onClick={() => updateStatus(message.id, 'pending')}
                  className="rounded-2xl bg-white/20 py-5 text-2xl font-black text-white hover:bg-white/30"
                >
                  回到審核
                </button>
              </div>
            )}
          />
        )}
      </div>
    </main>
  )
}

function DashboardCard({
  title,
  count,
  description,
  onClick,
}: {
  title: string
  count: number
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/10 p-7 text-left shadow-xl transition hover:border-cyan-300/50 hover:bg-white/15"
    >
      <p className="text-lg font-bold text-cyan-200">{title}</p>
      <p className="mt-4 text-6xl font-black">{count}</p>
      <p className="mt-4 text-white/60">{description}</p>
      <p className="mt-8 font-black text-cyan-300">前往</p>
    </button>
  )
}

function DisplayCountPanel({
  displayCount,
  onChange,
}: {
  displayCount: number
  onChange: (count: number) => void
}) {
  return (
    <section className="rounded-2xl border border-cyan-300/30 bg-white/10 p-6 shadow-[0_0_35px_rgba(34,211,238,0.18)] md:p-8">
      <p className="mb-4 text-xl font-bold text-cyan-200">全體留言播放次數</p>

      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={() => onChange(displayCount - 1)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-4xl font-black hover:bg-white/30"
        >
          -
        </button>

        <div className="w-24 text-center text-6xl font-black">
          {displayCount}
        </div>

        <button
          onClick={() => onChange(displayCount + 1)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-4xl font-black hover:bg-white/30"
        >
          +
        </button>
      </div>
    </section>
  )
}

function MessageList({
  emptyText,
  messages,
  badgeText,
  actions,
}: {
  emptyText: string
  messages: Message[]
  badgeText: string
  actions: (message: Message) => ReactNode
}) {
  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/10 p-8 text-white/60">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {messages.map((message) => (
        <article
          key={message.id}
          className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl md:p-8"
        >
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-bold text-cyan-300">{badgeText}</p>
            <p className="text-sm text-white/45">
              {new Date(message.created_at).toLocaleString('zh-TW')}
            </p>
          </div>

          <p className="mb-8 text-2xl font-black leading-relaxed md:text-3xl">
            {message.sender} 想對 {message.receiver} 說：{message.content}
          </p>

          {actions(message)}
        </article>
      ))}
    </div>
  )
}
