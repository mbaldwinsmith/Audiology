import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { runSelfVerification } from './utils/testVerification';

if (import.meta.env.DEV) {
  runSelfVerification().catch(console.error);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

