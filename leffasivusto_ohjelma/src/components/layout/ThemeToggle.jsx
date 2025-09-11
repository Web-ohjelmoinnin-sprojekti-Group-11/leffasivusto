import { Button } from 'react-bootstrap'
import { useTheme } from '../../state/ThemeContext.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button size="sm" variant="outline-secondary" onClick={toggleTheme} title="Toggle theme">
      {theme === 'dark' ? '🌙' : '💗'}
    </Button>
  )
}
