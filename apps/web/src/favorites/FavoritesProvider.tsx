import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/useAuth';
import { useProfile } from '../profiles/useProfile';
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

  const {
    activeProfile,
    loading: profileLoading,
  } = useProfile();

  const [favorites, setFavorites] = useState<
    FavoriteEntry[]
  >([]);

  const [favoritesLoading, setFavoritesLoading] =
    useState(false);

  const activeProfileId = activeProfile?.id;

  useEffect(() => {
    if (
      authLoading ||
      profileLoading ||
      !user ||
      !activeProfileId
    ) {
      return;
    }

    const profileId = activeProfileId;

    let cancelled = false;

    async function loadFavorites() {
      setFavoritesLoading(true);

      try {
        const loadedFavorites = await getFavorites(profileId);

        if (!cancelled) {
          setFavorites(
            loadedFavorites,
          );
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
  }, [
    authLoading,
    profileLoading,
    user,
    activeProfileId,
  ]);

  const visibleFavorites =
    user && activeProfile
      ? favorites
      : [];

  const loading =
    authLoading ||
    profileLoading ||
    (!!user &&
      !!activeProfile &&
      favoritesLoading);

  function isFavorite(pokemonId: number) {
    return visibleFavorites.some(
      (entry) =>
        entry.species.externalId ===
        pokemonId,
    );
  }

  async function toggleFavorite(
    pokemonId: number,
  ) {
    if (!user || !activeProfile) {
      return;
    }

    const favorite =
      favorites.some(
        (entry) =>
          entry.species.externalId ===
          pokemonId,
      );

    if (favorite) {
      await removeFavorite(
        activeProfile.id,
        pokemonId,
      );

      setFavorites((current) =>
        current.filter(
          (entry) =>
            entry.species.externalId !==
            pokemonId,
        ),
      );

      return;
    }

    const newFavorite =
      await addFavorite(
        activeProfile.id,
        pokemonId,
      );

    setFavorites((current) => {
      const alreadyExists =
        current.some(
          (entry) =>
            entry.species.externalId ===
            pokemonId,
        );

      if (alreadyExists) {
        return current;
      }

      return [
        ...current,
        newFavorite,
      ].sort(
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