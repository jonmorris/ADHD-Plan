import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from './app.tsx'
import { trackVisualViewport } from './viewport'

trackVisualViewport()

// Look for a new version each time the app is opened or brought back, and reload into it
// once it's ready (an installed app is often resumed rather than restarted).
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration?.update()
    })
  },
})

render(<App />, document.getElementById('app')!)
