export interface PokemonListItem {
    id: number;
    name: string;
    generation: number | null;
    image: string;
    types: string[];
}

export interface PokemonPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface PokemonListResponse {
    items: PokemonListItem[];
    pagination: PokemonPagination;
}