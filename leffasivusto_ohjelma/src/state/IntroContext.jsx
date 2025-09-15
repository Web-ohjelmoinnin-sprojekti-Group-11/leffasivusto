// src/state/IntroContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

const IntroContext = createContext()

export function IntroProvider({ children }) {
  const [introDone, setIntroDone] = useState(() =>
    sessionStorage.getItem('introDone') === '1'
  )
  const leavingRef = useRef(false)

  useEffect(() => {
    const html = document.documentElement
    if (introDone) {
      html.classList.remove('intro-open', 'intro-leaving')
      html.classList.add('intro-done')
    } else {
      html.classList.add('intro-open')
      html.classList.remove('intro-done', 'intro-leaving')
    }
  }, [introDone])

  const completeIntro = () => {
    if (introDone || leavingRef.current) return
    leavingRef.current = true

    const WIPE_MS  = 2500  // pink fade kesto
    const PAUSE_MS = 500   // lyhyt tauko wipen jälkeen

    const html = document.documentElement
    html.classList.add('intro-leaving')   // -> nappi katoaa heti, pinkki wipe alkaa

    // 2.5 s wipe + 0.5 s tauko -> sitten reveal
    setTimeout(() => {
      sessionStorage.setItem('introDone', '1')
      setIntroDone(true)
      html.classList.remove('intro-open', 'intro-leaving')
      html.classList.add('intro-done')
      leavingRef.current = false
    }, WIPE_MS + PAUSE_MS)
  }

  const value = useMemo(() => ({ introDone, completeIntro }), [introDone])
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>
}

export const useIntro = () => useContext(IntroContext)
