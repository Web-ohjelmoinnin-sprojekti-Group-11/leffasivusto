// src/components/layout/HeroBanner.jsx
import heroLight from '../../assets/hero/hero_light.png'
import heroDark  from '../../assets/hero/hero_light.png'
import { useEffect, useMemo, useState } from 'react'

export default function HeroBanner() {
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-bs-theme') || 'light')
  useEffect(() => {
    const el = document.documentElement
    const mo = new MutationObserver(() => setTheme(el.getAttribute('data-bs-theme') || 'light'))
    mo.observe(el, { attributes: true, attributeFilter: ['data-bs-theme'] })
    return () => mo.disconnect()
  }, [])
  const src = useMemo(() => (theme === 'dark' ? heroDark : heroLight), [theme])

  return (
    <div className="hero-bleed">{/* tärkeä: sama luokka kuin CSS:ssä */}
      <img className="hero-img" src={src} alt="Pink Baby Dragons movie night" />
    </div>
  )
}
