// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/theme.css'
import './index.css'
import './styles/intro.css'
import './styles/heroGreeting.css'
import { ThemeProvider } from './state/ThemeContext.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { IntroProvider } from './state/IntroContext.jsx'
import IntroFX from './components/intro/IntroFX.jsx'
import './styles/movies.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 1 },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <IntroProvider>
              <IntroFX />{/* intro wipe */}
              <App />
            </IntroProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
