import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import useDocumentTitle from '../hooks/useDocumentTitle.js'

const socketUrl = import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin

export default function ChatPage() {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [errorMessage, setErrorMessage] = useState('')
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  useDocumentTitle('Live Chat - ShopSphere')

  useEffect(() => {
    const socket = io(socketUrl, { autoConnect: false })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnectionStatus('connected')
      setErrorMessage('')
    })

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected')
      setErrorMessage('Connection lost. Reconnecting…')
    })

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected')
      setErrorMessage('Unable to connect to chat. Retrying…')
    })

    socket.on('chatMessage', (chatMessage) => {
      setMessages((currentMessages) => [...currentMessages, chatMessage])
    })

    socket.connect()

    return () => {
      socketRef.current = null
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(event) {
    event.preventDefault()

    const trimmedUsername = username.trim()
    const trimmedMessage = message.trim()

    if (!trimmedUsername || trimmedUsername.length > 24) {
      setErrorMessage('Enter a username between 1 and 24 characters.')
      return
    }

    if (!trimmedMessage || trimmedMessage.length > 500) {
      setErrorMessage('Enter a message between 1 and 500 characters.')
      return
    }

    if (connectionStatus !== 'connected') {
      setErrorMessage('Wait for the chat connection before sending.')
      return
    }

    setErrorMessage('')
    socketRef.current?.emit('chatMessage', {
      username: trimmedUsername,
      message: trimmedMessage,
    }, (response) => {
      if (response?.ok) {
        setMessage('')
      } else {
        setErrorMessage(response?.error || 'Message could not be sent.')
      }
    })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Main">
          <a href="index.html" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">ShopSphere</span>
          </a>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <a href="index.html" className="hidden hover:text-indigo-600 sm:inline">Home</a>
            <a href="products.html" className="hidden hover:text-indigo-600 sm:inline">Products</a>
            <a href="cart.html" className="hover:text-indigo-600">Cart</a>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">ShopSphere community</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Live chat</h1>
          <p className="mt-2 text-slate-600">Chat with everyone connected in real time.</p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Live chat">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-900">Community room</h2>
              <p className="mt-1 text-xs text-slate-500">Messages are kept only while this page is open.</p>
            </div>
            <div
              className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              role="status"
              aria-live="polite"
              data-testid="connection-status"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                aria-hidden="true"
              />
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting…' : 'Disconnected'}
            </div>
          </div>

          <ol
            className="flex h-[min(55vh,32rem)] min-h-72 flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6"
            aria-label="Chat message history"
            aria-live="polite"
            data-testid="message-history"
          >
            {messages.length === 0 ? (
              <li className="m-auto max-w-xs text-center text-sm text-slate-500">
                No messages yet. Say hello to start the conversation.
              </li>
            ) : (
              messages.map((chatMessage, index) => (
                <li
                  className="max-w-[90%] self-start rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm sm:max-w-[75%]"
                  key={`${chatMessage.sentAt}-${index}`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-indigo-700">{chatMessage.username}</span>
                    <time className="text-xs text-slate-400" dateTime={chatMessage.sentAt}>
                      {new Date(chatMessage.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{chatMessage.message}</p>
                </li>
              ))
            )}
            <li ref={messagesEndRef} aria-hidden="true" />
          </ol>

          <form className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(0,2fr)_auto] sm:items-end sm:p-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="chat-username">Username</label>
              <input
                autoComplete="nickname"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                id="chat-username"
                maxLength={24}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Your name"
                value={username}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="chat-message">Message</label>
              <input
                autoComplete="off"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={connectionStatus !== 'connected'}
                id="chat-message"
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={connectionStatus === 'connected' ? 'Write a message…' : 'Waiting for connection…'}
                value={message}
              />
            </div>
            <button
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={connectionStatus !== 'connected'}
              type="submit"
            >
              Send
            </button>
            <p className="text-sm text-red-600 sm:col-span-3" role="alert" aria-live="assertive">
              {errorMessage}
            </p>
          </form>
        </section>
      </main>
    </div>
  )
}
