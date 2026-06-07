import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <GoogleOAuthProvider clientId="586115793465-l37g7kdi3kuj8ot7ll95isql9p6v4ubp.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
