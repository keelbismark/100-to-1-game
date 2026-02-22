import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/game/:roomId/board" element={<App view="board" />} />
        <Route path="/game/:roomId/admin" element={<App view="admin" />} />
        <Route path="/game/:roomId/buzzer" element={<App view="buzzer" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
