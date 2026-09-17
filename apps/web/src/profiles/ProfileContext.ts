import { createContext } from "react";
import type {
    CollectionProfile,
    CollectionProfileDetail,
    CreateProfileInput,
    UpdateProfileInput
} from "./profiles.api";

export interface ProfileContextValue {
    profiles: CollectionProfile[];
    activeProfile: CollectionProfileDetail | null;
    loading: boolean;
    setActiveProfileId: (
        profileId: string,
    ) => Promise<void>;
    createProfile: (
        input: CreateProfileInput,
    ) => Promise<void>;
    updateActiveProfile: (
        input: UpdateProfileInput,
    ) => Promise<void>;
    deleteActiveProfile: () => Promise<void>;
    refreshActiveProfile: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextValue | null>(
    null,
);