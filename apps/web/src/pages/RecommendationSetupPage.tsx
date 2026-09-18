import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getGames,
  type GameOption,
} from '../games/games.api';

import {
  getProfileGames,
  updateProfileGames,
} from '../profiles/profile-games.api';

import {
  getRecommendationPlan,
  type RecommendationPlan,
} from '../recommendations/recommendations.api';

import { useProfile } from '../profiles/useProfile';

export function RecommendationSetupPage() {
  const { activeProfile } = useProfile();

  const [games, setGames] =
    useState<GameOption[]>([]);

  const [
    primaryGameIds,
    setPrimaryGameIds,
  ] = useState<number[]>([]);

  const [
    auxiliaryGameIds,
    setAuxiliaryGameIds,
  ] = useState<number[]>([]);

  const [
    primarySelection,
    setPrimarySelection,
  ] = useState('');

  const [
    auxiliarySelection,
    setAuxiliarySelection,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    savedMessage,
    setSavedMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    recommendationPlan,
    setRecommendationPlan,
  ] = useState<RecommendationPlan | null>(
    null,
  );

  const [
    planLoading,
    setPlanLoading,
  ] = useState(false);

  const [
    planError,
    setPlanError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadData() {
      if (!activeProfile) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setPlanError(null);

        const [
          gamesResponse,
          profileGamesResponse,
          recommendationPlanResponse,
        ] = await Promise.all([
          getGames(),
          getProfileGames(
            activeProfile.id,
          ),
          getRecommendationPlan(
            activeProfile.id,
          ),
        ]);

        setGames(
          gamesResponse,
        );

        setPrimaryGameIds(
          profileGamesResponse.primary.map(
            (game) =>
              game.externalId,
          ),
        );

        setAuxiliaryGameIds(
          profileGamesResponse.auxiliary.map(
            (game) =>
              game.externalId,
          ),
        );

        setRecommendationPlan(
          recommendationPlanResponse,
        );
      } catch {
        setError(
          'Could not load recommendation setup.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [activeProfile]);

  const gamesById = useMemo(
    () =>
      new Map(
        games.map((game) => [
          game.externalId,
          game,
        ]),
      ),
    [games],
  );

  const selectedGameIds =
    useMemo(
      () =>
        new Set([
          ...primaryGameIds,
          ...auxiliaryGameIds,
        ]),
      [
        primaryGameIds,
        auxiliaryGameIds,
      ],
    );

  const availableGames = useMemo(
    () =>
      games.filter(
        (game) =>
          !selectedGameIds.has(
            game.externalId,
          ),
      ),
    [
      games,
      selectedGameIds,
    ],
  );

  async function loadRecommendationPlan(
    profileId: string,
  ) {
    setPlanLoading(true);
    setPlanError(null);

    try {
      const plan =
        await getRecommendationPlan(
          profileId,
        );

      setRecommendationPlan(
        plan,
      );
    } catch {
      setRecommendationPlan(
        null,
      );

      setPlanError(
        'Could not load recommendation plan.',
      );
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleSave() {
    if (!activeProfile) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSavedMessage(null);

      await updateProfileGames(
        activeProfile.id,
        {
          primaryGameIds,
          auxiliaryGameIds,
        },
      );

      await loadRecommendationPlan(
        activeProfile.id,
      );

      setSavedMessage(
        'Game configuration saved.',
      );
    } catch {
      setError(
        'Could not save game configuration.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function addPrimaryGame() {
    if (!primarySelection) {
      return;
    }

    const gameId = Number(
      primarySelection,
    );

    setPrimaryGameIds(
      (current) => [
        ...current,
        gameId,
      ],
    );

    setPrimarySelection('');
    setSavedMessage(null);
  }

  function addAuxiliaryGame() {
    if (!auxiliarySelection) {
      return;
    }

    const gameId = Number(
      auxiliarySelection,
    );

    setAuxiliaryGameIds(
      (current) => [
        ...current,
        gameId,
      ],
    );

    setAuxiliarySelection('');
    setSavedMessage(null);
  }

  function removePrimaryGame(
    gameId: number,
  ) {
    setPrimaryGameIds(
      (current) =>
        current.filter(
          (id) =>
            id !== gameId,
        ),
    );

    setSavedMessage(null);
  }

  function removeAuxiliaryGame(
    gameId: number,
  ) {
    setAuxiliaryGameIds(
      (current) =>
        current.filter(
          (id) =>
            id !== gameId,
        ),
    );

    setSavedMessage(null);
  }

  if (!activeProfile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <p className="text-zinc-400">
            Select a profile to configure
            recommendations.
          </p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <p className="text-zinc-400">
            Loading recommendation setup...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <header className="mb-10">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            {activeProfile.name}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Recommendation Setup
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Configure the games that should
            be prioritized when building your
            Pokémon acquisition plan.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-950 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {savedMessage && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
            {savedMessage}
          </div>
        )}

        <div className="space-y-8">
          <GameSection
            title="Primary games"
            description="Pokémon will be assigned to these games first, following the order shown."
            gameIds={
              primaryGameIds
            }
            gamesById={
              gamesById
            }
            selection={
              primarySelection
            }
            availableGames={
              availableGames
            }
            onSelectionChange={
              setPrimarySelection
            }
            onAdd={
              addPrimaryGame
            }
            onRemove={
              removePrimaryGame
            }
            onMove={(
              index,
              direction,
            ) => {
              setPrimaryGameIds(
                (current) =>
                  moveGame(
                    current,
                    index,
                    direction,
                  ),
              );

              setSavedMessage(
                null,
              );
            }}
          />

          <GameSection
            title="Auxiliary games"
            description="These games are considered after all primary games, also following the order shown."
            gameIds={
              auxiliaryGameIds
            }
            gamesById={
              gamesById
            }
            selection={
              auxiliarySelection
            }
            availableGames={
              availableGames
            }
            onSelectionChange={
              setAuxiliarySelection
            }
            onAdd={
              addAuxiliaryGame
            }
            onRemove={
              removeAuxiliaryGame
            }
            onMove={(
              index,
              direction,
            ) => {
              setAuxiliaryGameIds(
                (current) =>
                  moveGame(
                    current,
                    index,
                    direction,
                  ),
              );

              setSavedMessage(
                null,
              );
            }}
          />

          <RecommendationPlanSection
            plan={
              recommendationPlan
            }
            isLoading={
              planLoading
            }
            error={
              planError
            }
            selectedGameIds={
              selectedGameIds
            }
            onAddPrimary={(
              gameId,
            ) => {
              if (
                selectedGameIds.has(
                  gameId,
                )
              ) {
                return;
              }

              setPrimaryGameIds(
                (current) => [
                  ...current,
                  gameId,
                ],
              );

              setSavedMessage(
                null,
              );
            }}
            onAddAuxiliary={(
              gameId,
            ) => {
              if (
                selectedGameIds.has(
                  gameId,
                )
              ) {
                return;
              }

              setAuxiliaryGameIds(
                (current) => [
                  ...current,
                  gameId,
                ],
              );

              setSavedMessage(
                null,
              );
            }}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={
                isSaving ||
                planLoading
              }
              className="cursor-pointer rounded-xl bg-zinc-100 px-5 py-3 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? 'Saving...'
                : 'Save configuration'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

interface RecommendationPlanSectionProps {
  plan:
    | RecommendationPlan
    | null;

  isLoading: boolean;

  error:
    | string
    | null;

  selectedGameIds:
    Set<number>;

  onAddPrimary: (
    gameId: number,
  ) => void;

  onAddAuxiliary: (
    gameId: number,
  ) => void;
}

function RecommendationPlanSection({
  plan,
  isLoading,
  error,
  selectedGameIds,
  onAddPrimary,
  onAddAuxiliary,
}: RecommendationPlanSectionProps) {
  const assignmentCountByGame =
    new Map<number, number>();

  if (plan) {
    for (
      const assignment
      of plan.assignments
    ) {
      const gameId =
        assignment.game.externalId;

      assignmentCountByGame.set(
        gameId,
        (
          assignmentCountByGame.get(
            gameId,
          ) ?? 0
        ) + 1,
      );
    }
  }

  const visibleSuggestedGames =
    plan?.suggestedGames.filter(
      (game) =>
        !selectedGameIds.has(
          game.externalId,
        ),
    ) ?? [];

  const capturedUncoveredCount =
    plan
      ? plan.uncovered.length -
        plan.remainingUncovered.length
      : 0;

  return (
    <section className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-100">
          Recommendation plan
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Pokémon are assigned to your
          configured games in order.
          Additional games are suggested
          when your current configuration
          cannot cover the complete
          objective.
        </p>
      </div>

      {isLoading && (
        <div className="mt-6 rounded-xl border border-zinc-900 bg-black px-4 py-5">
          <p className="text-sm text-zinc-500">
            Calculating recommendations...
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-950 bg-red-950/20 px-4 py-4">
          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      {!isLoading &&
        !error &&
        plan && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <PlanMetric
                label="Objective"
                value={
                  plan.objective.total
                }
              />

              <PlanMetric
                label="Covered"
                value={
                  plan.assignments.length
                }
              />

              <PlanMetric
                label="Uncovered"
                value={
                  plan.uncovered.length
                }
              />
            </div>

            {plan.configuredGames.length >
              0 && (
              <div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">
                    Configured game coverage
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Pokémon are assigned to the
                    first configured game that
                    can obtain them.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {plan.configuredGames.map(
                    (game, index) => {
                      const assignedCount =
                        assignmentCountByGame.get(
                          game.externalId,
                        ) ?? 0;

                      return (
                        <div
                          key={
                            game.externalId
                          }
                          className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-zinc-200">
                                {formatName(
                                  game.name,
                                )}
                              </p>

                              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-500">
                                {game.role ===
                                'PRIMARY'
                                  ? 'Primary'
                                  : 'Auxiliary'}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-zinc-500">
                              {assignedCount}{' '}
                              Pokémon assigned
                            </p>
                          </div>

                          <p className="text-xs text-zinc-600">
                            Priority{' '}
                            {index + 1}
                          </p>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            {plan.uncovered.length ===
              0 && (
              <div className="rounded-xl border border-emerald-950 bg-emerald-950/20 px-4 py-4">
                <p className="text-sm font-medium text-emerald-300">
                  Your configured games
                  cover the complete
                  objective.
                </p>
              </div>
            )}

            {capturedUncoveredCount >
              0 && (
              <div className="rounded-xl border border-sky-950 bg-sky-950/20 px-4 py-4">
                <p className="text-sm font-medium text-sky-300">
                  {plan.remainingUncovered
                    .length === 0
                    ? 'No additional games are needed.'
                    : 'Some uncovered Pokémon are already captured.'}
                </p>

                <p className="mt-1 text-sm leading-6 text-sky-400/70">
                  {plan.remainingUncovered
                    .length === 0
                    ? `All ${capturedUncoveredCount} Pokémon not covered by your configured games are already in your collection, so they are excluded from extra game recommendations.`
                    : `${capturedUncoveredCount} uncovered ${
                        capturedUncoveredCount ===
                        1
                          ? 'Pokémon is'
                          : 'Pokémon are'
                      } already in your collection and ${
                        capturedUncoveredCount ===
                        1
                          ? 'is'
                          : 'are'
                      } excluded from extra game recommendations.`}
                </p>
              </div>
            )}

            {visibleSuggestedGames.length >
              0 && (
              <div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">
                    Suggested extra games
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    These games improve
                    coverage but are not
                    automatically added to
                    your profile.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {visibleSuggestedGames.map(
                    (
                      game,
                      index,
                    ) => (
                      <SuggestedGameCard
                        key={
                          game.externalId
                        }
                        game={
                          game
                        }
                        index={
                          index
                        }
                        onAddPrimary={
                          onAddPrimary
                        }
                        onAddAuxiliary={
                          onAddAuxiliary
                        }
                      />
                    ),
                  )}
                </div>
              </div>
            )}

            {plan.remainingUncovered
              .length > 0 &&
              visibleSuggestedGames.length ===
                0 && (
                <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
                  <p className="text-sm text-zinc-400">
                    No additional game
                    recommendations are
                    available for the
                    remaining uncovered
                    Pokémon.
                  </p>
                </div>
            )}

            {plan.stillUncovered.length >
              0 && (
              <div className="rounded-xl border border-amber-950 bg-amber-950/20 px-4 py-4">
                <p className="text-sm font-medium text-amber-300">
                  Still unavailable
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-400/70">
                  {
                    plan.stillUncovered
                      .length
                  }{' '}
                  Pokémon could not be
                  covered by any available
                  game.
                </p>
              </div>
            )}
          </div>
        )}
    </section>
  );
}

interface SuggestedGameCardProps {
  game:
    RecommendationPlan['suggestedGames'][number];

  index: number;

  onAddPrimary: (
    gameId: number,
  ) => void;

  onAddAuxiliary: (
    gameId: number,
  ) => void;
}

function SuggestedGameCard({
  game,
  index,
  onAddPrimary,
  onAddAuxiliary,
}: SuggestedGameCardProps) {
  const [
    isExpanded,
    setIsExpanded,
  ] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-zinc-200">
              {formatName(
                game.name,
              )}
            </p>

            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-500">
              Suggested
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Covers{' '}
            {
              game.coveredSpecies
                .length
            }{' '}
            remaining Pokémon
          </p>

          <p className="mt-1 text-xs text-zinc-700">
            Extra game{' '}
            {index + 1}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setIsExpanded(
                (current) =>
                  !current,
              )
            }
            className="cursor-pointer rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
          >
            {isExpanded
              ? 'Hide Pokémon'
              : 'View Pokémon'}
          </button>

          <button
            type="button"
            onClick={() =>
              onAddPrimary(
                game.externalId,
              )
            }
            className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            Add as Primary
          </button>

          <button
            type="button"
            onClick={() =>
              onAddAuxiliary(
                game.externalId,
              )
            }
            className="cursor-pointer rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
          >
            Add as Auxiliary
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-zinc-900 pt-4">
          <div className="flex flex-wrap gap-2">
            {game.coveredSpecies.map(
              (species) => (
                <span
                  key={
                    species.externalId
                  }
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-400"
                >
                  #
                  {
                    species.externalId
                  }{' '}
                  {formatName(
                    species.name,
                  )}
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PlanMetricProps {
  label: string;
  value: number;
}

function PlanMetric({
  label,
  value,
}: PlanMetricProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
        {value}
      </p>
    </div>
  );
}

interface GameSectionProps {
  title: string;
  description: string;
  gameIds: number[];

  gamesById: Map<
    number,
    GameOption
  >;

  availableGames:
    GameOption[];

  selection: string;

  onSelectionChange: (
    value: string,
  ) => void;

  onAdd: () => void;

  onRemove: (
    gameId: number,
  ) => void;

  onMove: (
    index: number,
    direction: -1 | 1,
  ) => void;
}

function GameSection({
  title,
  description,
  gameIds,
  gamesById,
  availableGames,
  selection,
  onSelectionChange,
  onAdd,
  onRemove,
  onMove,
}: GameSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-100">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {gameIds.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-5 text-sm text-zinc-600">
            No games selected.
          </p>
        ) : (
          gameIds.map(
            (
              gameId,
              index,
            ) => {
              const game =
                gamesById.get(
                  gameId,
                );

              if (!game) {
                return null;
              }

              return (
                <div
                  key={
                    gameId
                  }
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-zinc-200">
                      {formatName(
                        game.name,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Generation{' '}
                      {
                        game.generation
                          .externalId
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onMove(
                          index,
                          -1,
                        )
                      }
                      disabled={
                        index ===
                        0
                      }
                      aria-label={`Move ${game.name} up`}
                      className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onMove(
                          index,
                          1,
                        )
                      }
                      disabled={
                        index ===
                        gameIds.length -
                          1
                      }
                      aria-label={`Move ${game.name} down`}
                      className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onRemove(
                          gameId,
                        )
                      }
                      aria-label={`Remove ${game.name}`}
                      className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 transition hover:border-red-950 hover:bg-red-950/20 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            },
          )
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <select
          value={
            selection
          }
          onChange={(
            event,
          ) =>
            onSelectionChange(
              event.target.value,
            )
          }
          className="min-w-0 flex-1 cursor-pointer rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-zinc-500"
        >
          <option value="">
            Select a game
          </option>

          {availableGames.map(
            (game) => (
              <option
                key={
                  game.externalId
                }
                value={
                  game.externalId
                }
              >
                {formatName(
                  game.name,
                )}{' '}
                — Gen{' '}
                {
                  game.generation
                    .externalId
                }
              </option>
            ),
          )}
        </select>

        <button
          type="button"
          onClick={
            onAdd
          }
          disabled={
            !selection
          }
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add game
        </button>
      </div>
    </section>
  );
}

function moveGame(
  gameIds: number[],
  index: number,
  direction: -1 | 1,
) {
  const newIndex =
    index + direction;

  if (
    newIndex < 0 ||
    newIndex >=
      gameIds.length
  ) {
    return gameIds;
  }

  const updated = [
    ...gameIds,
  ];

  [
    updated[index],
    updated[newIndex],
  ] = [
    updated[newIndex],
    updated[index],
  ];

  return updated;
}

function formatName(
  value: string,
) {

  return value
    .split('-')
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}