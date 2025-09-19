import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/theme.css'
import './index.css'
import './styles/intro.css'
import './styles/heroGreeting.css';              
import { ThemeProvider } from './state/ThemeContext.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { IntroProvider } from './state/IntroContext.jsx'  
import IntroFX from './components/intro/IntroFX.jsx'
import "./styles/movies.css"      

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <IntroProvider>
            <IntroFX />                  {/* pinkki wipe, kuuntelee html-luokkia */}
            <App />
          </IntroProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
