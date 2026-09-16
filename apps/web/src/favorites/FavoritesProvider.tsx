import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/useAuth';
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  type FavoriteEntry,
} from './favorites.api';
import { FavoritesContext } from './FavoritesContext';

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({
  children,
}: FavoritesProviderProps) {
  const { user, loading: authLoading } = useAuth();

  const [favorites, setFavorites] = useState<
    FavoriteEntry[]
  >([]);

  const [favoritesLoading, setFavoritesLoading] =
    useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;

    async function loadFavorites() {
      setFavoritesLoading(true);

      try {
        const data = await getFavorites();

        if (!cancelled) {
          setFavorites(data);
        }
      } finally {
        if (!cancelled) {
          setFavoritesLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const visibleFavorites = user
    ? favorites
    : [];

  const loading =
    authLoading ||
    (user !== null && favoritesLoading);

  function isFavorite(pokemonId: number) {
    return visibleFavorites.some(
      (entry) =>
        entry.species.externalId === pokemonId,
    );
  }

  async function toggleFavorite(
    pokemonId: number,
  ) {
    if (!user) {
      return;
    }

    if (isFavorite(pokemonId)) {
      await removeFavorite(pokemonId);

      setFavorites((current) =>
        current.filter(
          (entry) =>
            entry.species.externalId !== pokemonId,
        ),
      );

      return;
    }

    const newFavorite =
      await addFavorite(pokemonId);

    setFavorites((current) => {
      const alreadyExists = current.some(
        (entry) =>
          entry.species.externalId === pokemonId,
      );

      if (alreadyExists) {
        return current;
      }

      return [...current, newFavorite].sort(
        (a, b) =>
          a.species.externalId -
          b.species.externalId,
      );
    });
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites: visibleFavorites,
        loading,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}