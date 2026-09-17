import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/useAuth';
import {
  createProfile as createProfileRequest,
  deleteProfile as deleteProfileRequest,
  getProfile,
  getProfiles,
  updateProfile as updateProfileRequest,
  type CollectionProfile,
  type CollectionProfileDetail,
  type CreateProfileInput,
  type UpdateProfileInput,
} from './profiles.api';
import { ProfileContext } from './ProfileContext';

interface ProfileProviderProps {
  children: ReactNode;
}

const ACTIVE_PROFILE_KEY =
  'active-profile-id';

export function ProfileProvider({
  children,
}: ProfileProviderProps) {
  const { user, loading: authLoading } =
    useAuth();

  const [profiles, setProfiles] = useState<
    CollectionProfile[]
  >([]);

  const [
    activeProfile,
    setActiveProfile,
  ] =
    useState<CollectionProfileDetail | null>(
      null,
    );

  const [
    profilesLoading,
    setProfilesLoading,
  ] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;

    async function loadProfiles() {
      setProfilesLoading(true);

      try {
        const loadedProfiles =
          await getProfiles();

        if (cancelled) {
          return;
        }

        setProfiles(loadedProfiles);

        if (loadedProfiles.length === 0) {
          setActiveProfile(null);
          return;
        }

        const savedProfileId =
          localStorage.getItem(
            ACTIVE_PROFILE_KEY,
          );

        const selectedProfile =
          loadedProfiles.find(
            (profile) =>
              profile.id ===
              savedProfileId,
          ) ?? loadedProfiles[0];

        const detail = await getProfile(
          selectedProfile.id,
        );

        if (cancelled) {
          return;
        }

        setActiveProfile(detail);

        localStorage.setItem(
          ACTIVE_PROFILE_KEY,
          detail.id,
        );
      } finally {
        if (!cancelled) {
          setProfilesLoading(false);
        }
      }
    }

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  async function setActiveProfileId(
    profileId: string,
  ) {
    const detail =
      await getProfile(profileId);

    setActiveProfile(detail);

    localStorage.setItem(
      ACTIVE_PROFILE_KEY,
      profileId,
    );
  }

  async function createProfile(
    input: CreateProfileInput,
  ) {
    const created =
      await createProfileRequest(input);

    setProfiles((current) => [
      ...current,
      created,
    ]);

    const detail =
      await getProfile(created.id);

    setActiveProfile(detail);

    localStorage.setItem(
      ACTIVE_PROFILE_KEY,
      created.id,
    );
  }

  async function updateActiveProfile(
    input: UpdateProfileInput,
  ) {
    if (!activeProfile) {
      return;
    }

    const updated =
      await updateProfileRequest(
        activeProfile.id,
        input,
      );

    setProfiles((current) =>
      current.map((profile) =>
        profile.id === updated.id
          ? updated
          : profile,
      ),
    );

    const detail =
      await getProfile(updated.id);

    setActiveProfile(detail);
  }

  async function deleteActiveProfile() {
    if (!activeProfile) {
      return;
    }

    const deletedProfileId =
      activeProfile.id;

    await deleteProfileRequest(
      deletedProfileId,
    );

    const remainingProfiles =
      profiles.filter(
        (profile) =>
          profile.id !== deletedProfileId,
      );

    setProfiles(remainingProfiles);

    const nextProfile =
      remainingProfiles[0];

    if (!nextProfile) {
      setActiveProfile(null);

      localStorage.removeItem(
        ACTIVE_PROFILE_KEY,
      );

      return;
    }

    const detail =
      await getProfile(nextProfile.id);

    setActiveProfile(detail);

    localStorage.setItem(
      ACTIVE_PROFILE_KEY,
      detail.id,
    );
  }

  async function refreshActiveProfile() {
    if (!activeProfile) {
      return;
    }

    const detail =
      await getProfile(
        activeProfile.id,
      );

    setActiveProfile(detail);
  }

  const visibleProfiles = user
    ? profiles
    : [];

  const visibleActiveProfile = user
    ? activeProfile
    : null;

  const loading =
    authLoading ||
    (!!user && profilesLoading);

  return (
    <ProfileContext.Provider
      value={{
        profiles: visibleProfiles,
        activeProfile:
          visibleActiveProfile,
        loading,
        setActiveProfileId,
        createProfile,
        updateActiveProfile,
        deleteActiveProfile,
        refreshActiveProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}