import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Fuentes alojadas en nuestro propio servidor: la web no se conecta a Google para cargarlas.
import '@fontsource/nunito/latin-300.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-400-italic.css'
import '@fontsource/nunito/latin-500.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/nunito/latin-900.css'
import '@fontsource/montserrat/latin-800.css'
import './styles/index.css'
import { keepVideosMuted } from './utils/muteVideos'

keepVideosMuted()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
