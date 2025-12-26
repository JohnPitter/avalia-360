import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Initialize i18n before React renders
import './i18n/config';

console.log('🚀 main.tsx carregado');
console.log('📦 Environment:', import.meta.env.MODE);
console.log('🔧 Vite Base:', import.meta.env.BASE_URL);

try {
  const rootElement = document.getElementById('root');
  console.log('📍 Root element:', rootElement);

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  console.log('✅ React app montado com sucesso');
} catch (error) {
  console.error('❌ Erro ao montar app:', error);
}
