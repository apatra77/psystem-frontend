import { createContext, useContext, useMemo } from 'react'
import { colors } from '@/app/themes/colors'
import { useUiStore } from '@/app/store/uiStore'

const ThemeContext = createContext({ colors, mode: 'dark' })

/** Exposes design tokens through context so components can theme without imports. */
export default function ThemeProvider({ children }) {
  const mode = useUiStore((s) => s.themeMode)
  const value = useMemo(() => ({ colors, mode }), [mode])

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={mode} style={{ background: colors.bg, minHeight: '100vh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
