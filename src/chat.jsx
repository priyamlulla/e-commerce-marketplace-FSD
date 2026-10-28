import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatPage from './components/ChatPage.jsx'
import './style.css'

ReactDOM.createRoot(document.getElementById('chat-app')).render(
  <React.StrictMode>
    <ChatPage />
  </React.StrictMode>,
)
