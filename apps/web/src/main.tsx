import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { NativeBridge } from './mobile/NativeBridge';
import { App } from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NativeBridge />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
