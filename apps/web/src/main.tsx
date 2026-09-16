import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './auth/authProvider.tsx';
import { CollectionProvider } from './collection/CollectionProvider.tsx';
import { FavoritesProvider } from './favorites/FavoritesProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CollectionProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </FavoritesProvider>  
      </CollectionProvider>
    </AuthProvider>
  </StrictMode>,
);
