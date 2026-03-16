import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // We removed .jsx and src/ to make it "foolproof"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
