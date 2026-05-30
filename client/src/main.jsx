import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <GoogleOAuthProvider clientId="359141177905-s8712e23lrd5krumo0mg1r6ceda3c2n0.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
