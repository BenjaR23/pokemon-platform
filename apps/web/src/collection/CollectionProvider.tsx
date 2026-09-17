import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/useAuth';
import { useProfile } from '../profiles/useProfile';
import {
  addToCollection,
  getCollection,
  removeFromCollection,
  type CollectionEntry,
} from './collection.api';
import { CollectionContext } from './CollectionContext';

interface CollectionProviderProps {
  children: ReactNode;
}

export function CollectionProvider({
  children,
}: CollectionProviderProps) {
  const { user, loading: authLoading } = useAuth();

  const {
    activeProfile,
    loading: profileLoading,
    refreshActiveProfile,
  } = useProfile();

  const [collection, setCollection] = useState<
    CollectionEntry[]
  >([]);

  const [collectionLoading, setCollectionLoading] =
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

    async function loadCollection() {
      setCollectionLoading(true);

      try {
        const loadedCollection = await getCollection(profileId);

        if (!cancelled) {
          setCollection(
            loadedCollection,
          );
        }
      } finally {
        if (!cancelled) {
          setCollectionLoading(false);
        }
      }
    }

    void loadCollection();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    profileLoading,
    user,
    activeProfileId,
  ]);

  const visibleCollection =
    user && activeProfile
      ? collection
      : [];

  const loading =
    authLoading ||
    profileLoading ||
    (!!user &&
      !!activeProfile &&
      collectionLoading);

  function isCollected(pokemonId: number) {
    return visibleCollection.some(
      (entry) =>
        entry.species.externalId ===
        pokemonId,
    );
  }

  async function toggleCollection(
    pokemonId: number,
  ) {
    if (!user || !activeProfile) {
      return;
    }

    const collected =
      collection.some(
        (entry) =>
          entry.species.externalId ===
          pokemonId,
      );

    if (collected) {
      await removeFromCollection(
        activeProfile.id,
        pokemonId,
      );

      setCollection((current) =>
        current.filter(
          (entry) =>
            entry.species.externalId !==
            pokemonId,
        ),
      );
    } else {
      const entry =
        await addToCollection(
          activeProfile.id,
          pokemonId,
        );

      setCollection((current) => {
        const alreadyExists =
          current.some(
            (currentEntry) =>
              currentEntry.species
                .externalId ===
              pokemonId,
          );

        if (alreadyExists) {
          return current;
        }

        return [...current, entry];
      });
    }

    await refreshActiveProfile();
  }

  return (
    <CollectionContext.Provider
      value={{
        collection: visibleCollection,
        loading,
        isCollected,
        toggleCollection,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}