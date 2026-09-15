import { createContext } from "react";
import type { CollectionEntry } from "./collection.api";

export interface CollectionContextValue {
    collection: CollectionEntry[];
    loading: boolean;
    isCollected: (pokemonId: number) => boolean;
    toggleCollection: (pokemonId: number) => Promise<void>;
}

export const CollectionContext =
    createContext<CollectionContextValue | undefined>(
        undefined,
    );