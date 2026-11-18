import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import './styles.css'
import { App } from './ui/App'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

// Service worker for offline use (registered by vite-plugin-pwa).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}
