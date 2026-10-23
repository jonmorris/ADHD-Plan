import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'
import { trackVisualViewport } from './viewport'

trackVisualViewport()

render(<App />, document.getElementById('app')!)
