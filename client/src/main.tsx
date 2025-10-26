import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

// Set up axios defaults
axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-url.herokuapp.com' 
  : 'http://localhost:5000';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)