import { createContext, useContext, useEffect, useRef, useState } from 'react'

const IntroContext = createContext()

/** Vaihda tähän 'heavy' | 'light' kun haluat vaihtaa moodia. */
const INTRO_MODE = 'heavy'  // <-- raskas intro käyttöön

// Raskaan intron ajoitukset
const WIPE_MS   = 2500   // pinkin wipe-haalistuksen kesto
const PAUSE_MS  = 500    // lyhyt tauko wipen jälkeen ennen reveal-animaatiota
// Kummassakin moodissa käytetty reveal-kesto (index.css: revealUp ~1.5s)
const REVEAL_MS = 1500

export function IntroProvider({ children }) {
  // Ei pysyvää muistia: intro näytetään joka latauksella
  const [introDone, setIntroDone] = useState(false)
  const timers = useRef([])

  const pushTimer = (id) => timers.current.push(id)

  // Hallitse <html>-luokkia navigoinneissa ja elinkaaressa
  useEffect(() => {
    const html = document.documentElement
    if (!introDone) {
      html.classList.add('intro-open')
      html.classList.remove('intro-leaving', 'intro-just-done')
    } else {
      html.classList.remove('intro-open', 'intro-leaving')
    }
    return () => {
      ['intro-open', 'intro-leaving', 'intro-just-done'].forEach(c => html.classList.remove(c))
      timers.current.forEach(clearTimeout)
    }
  }, [introDone])

  const completeIntro = () => {
    const html = document.documentElement

    if (INTRO_MODE === 'light') {
      // Kevyt: nappi pois heti, kertaluokkainen reveal
      html.classList.remove('intro-open')
      html.classList.add('intro-just-done')
      setIntroDone(true)
      pushTimer(setTimeout(() => {
        html.classList.remove('intro-just-done')
      }, REVEAL_MS + 100))
      return
    }

    // Raskas: estä tuplaklikkaukset
    if (html.classList.contains('intro-leaving')) return

    // Nappi pois heti + käynnistä pinkki wipe (CSS animoi .intro-leaving .intro-wipe)
    html.classList.add('intro-leaving')

    // Odota wipe + tauko -> sitten varsinaiset sisääntulo-animaatiot
    pushTimer(setTimeout(() => {
      setIntroDone(true)
      html.classList.remove('intro-open', 'intro-leaving')

      // Kertaluokkainen reveal
      html.classList.add('intro-just-done')
      pushTimer(setTimeout(() => {
        html.classList.remove('intro-just-done')
      }, REVEAL_MS + 100))
    }, WIPE_MS + PAUSE_MS))
  }

  return (
    <IntroContext.Provider value={{ introDone, completeIntro }}>
      {children}
    </IntroContext.Provider>
  )
}

export const useIntro = () => useContext(IntroContext)
