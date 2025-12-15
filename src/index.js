/**
 * Punto de entrada de la aplicación.
 * Renderiza la raíz de React y monta el componente App.
 */
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);