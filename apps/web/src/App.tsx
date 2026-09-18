import {
  Route,
  Routes,
} from 'react-router-dom';

import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { CollectionPage } from './pages/CollectionPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { LoginPage } from './pages/LoginPage';
import { PokedexPage } from './pages/PokedexPage';
import { PokemonDetailPage } from './pages/PokemonDetailPage';
import { RecommendationSetupPage } from './pages/RecommendationSetupPage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<PokedexPage />}
        />

        <Route
          path="/pokemon/:id"
          element={
            <PokemonDetailPage />
          }
        />

        <Route
          path="/pokemon/:id/variants/:variantId"
          element={
            <PokemonDetailPage />
          }
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          element={<ProtectedRoute />}
        >
          <Route
            path="/collection"
            element={
              <CollectionPage />
            }
          />

          <Route
            path="/favorites"
            element={
              <FavoritesPage />
            }
          />

          <Route
            path="/recommendations"
            element={
              <RecommendationSetupPage />
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;