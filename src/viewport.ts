// Keeps --vv-top and --vv-height in step with the part of the screen the on-screen
// keyboard leaves visible, so fixed overlays like the task form can fit inside it.
export function trackVisualViewport() {
  const vv = window.visualViewport
  if (!vv) return
  const root = document.documentElement.style
  const update = () => {
    root.setProperty('--vv-top', `${vv.offsetTop}px`)
    root.setProperty('--vv-height', `${vv.height}px`)
  }
  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
  update()
}
