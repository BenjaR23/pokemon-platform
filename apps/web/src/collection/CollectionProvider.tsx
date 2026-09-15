import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/useAuth';
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

  const [collection, setCollection] = useState<
    CollectionEntry[]
  >([]);

  const [collectionLoading, setCollectionLoading] =
    useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;

    async function loadCollection() {
      setCollectionLoading(true);

      try {
        const data = await getCollection();

        if (!cancelled) {
          setCollection(data);
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
  }, [user, authLoading]);

  const visibleCollection = user
    ? collection
    : [];

  const loading =
    authLoading ||
    (user !== null && collectionLoading);

  function isCollected(pokemonId: number) {
    return visibleCollection.some(
      (entry) =>
        entry.species.externalId === pokemonId,
    );
  }

  async function toggleCollection(
    pokemonId: number,
  ) {
    if (!user) {
      return;
    }

    if (isCollected(pokemonId)) {
      await removeFromCollection(pokemonId);

      setCollection((current) =>
        current.filter(
          (entry) =>
            entry.species.externalId !== pokemonId,
        ),
      );

      return;
    }

    const newEntry =
    await addToCollection(pokemonId);

    setCollection((current) => {
    const alreadyExists = current.some(
        (entry) =>
        entry.species.externalId === pokemonId,
    );

    if (alreadyExists) {
        return current;
    }

    return [newEntry, ...current];
    });
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