import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import App from './App.jsx';
import { seedIfNeeded } from './data/seed.js';

seedIfNeeded();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
