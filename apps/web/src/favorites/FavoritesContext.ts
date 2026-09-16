import { createContext } from "react";
import type { FavoriteEntry } from "./favorites.api";

export interface FavoritesContextValue {
    favorites: FavoriteEntry[];
    loading: boolean;
    isFavorite: (pokemonId: number) => boolean;
    toggleFavorite: (pokemonId: number) => Promise<void>;
}

export const FavoritesContext =
    createContext<FavoritesContextValue | undefined>(
        undefined,
    );