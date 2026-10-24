// Lets the phone's back button close what's on top (a sheet, a page, another tab).
// Each open layer adds a history entry; back closes the most recently opened layer.
import { useEffect, useRef } from 'preact/hooks'

const layers: (() => void)[] = []
let skip = 0 // popstates caused by our own history.go, not the back button
let unwind = 0 // entries to drop for layers closed in the app

addEventListener('popstate', () => {
  if (skip) return void skip--
  layers.pop()?.()
})

export function useBack(open: boolean, close: () => void) {
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    if (!open) return
    const layer = () => closeRef.current()
    layers.push(layer)
    history.pushState(null, '')
    return () => {
      const i = layers.indexOf(layer)
      if (i === -1) return // closed by the back button, so its entry is already gone
      layers.splice(i, 1)
      // Closed in the app: drop its entry, batching layers that close together
      if (unwind++ === 0) {
        queueMicrotask(() => {
          skip++
          history.go(-unwind)
          unwind = 0
        })
      }
    }
  }, [open])
}
