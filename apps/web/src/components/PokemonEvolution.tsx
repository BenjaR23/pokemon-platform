import { Link } from 'react-router-dom';
import type {
  PokemonEvolutionChain,
  PokemonEvolutionMethod,
  PokemonEvolutionRule,
  PokemonNextEvolution,
} from '../types/pokemon';

interface EvolutionNodeProps {
  nodeId: string;
  currentPokemonId: number;

  pokemonById: Map<
    string,
    {
      nodeId: string;
      id: number;
      name: string;
      image: string;
      form: {
        id: number;
        name: string;
      } | null;
    }
  >;

  childrenById: Map<string, string[]>;
  methodsByEdge: Map<string, PokemonEvolutionMethod[]>;
}

function EvolutionNode({
  nodeId,
  currentPokemonId,
  pokemonById,
  childrenById,
  methodsByEdge,
}: EvolutionNodeProps) {
  const pokemon = pokemonById.get(nodeId);
  const children = childrenById.get(nodeId) ?? [];

  if (!pokemon) {
    return null;
  }

  const isCurrentPokemon = pokemon.id === currentPokemonId;

  return (
    <div className="flex flex-col items-center">
      <Link
        to={`/pokemon/${pokemon.id}`}
        className={`flex flex-col items-center rounded-xl border p-3 transition ${
          isCurrentPokemon
            ? 'border-zinc-600 bg-zinc-800'
            : 'border-transparent hover:bg-zinc-800'
        }`}
      >
        <img
          src={pokemon.image}
          alt={pokemon.name}
          className="h-24 w-24 object-contain"
        />

        <span className="mt-2 font-medium text-zinc-200">
          {formatName(pokemon.name)}
        </span>

        <span className="text-xs text-zinc-500">
          #{pokemon.id.toString().padStart(4, '0')}
        </span>
      </Link>

      {children.length > 0 && (
        <div className="mt-3 flex flex-col items-center">
          <div className="h-6 w-px bg-zinc-700" />

          <div className="relative flex flex-wrap justify-center gap-8 pt-6">
            {children.length > 1 && (
              <div className="absolute left-1/2 top-0 h-px w-[calc(100%-4rem)] -translate-x-1/2 bg-zinc-700" />
            )}

            {children.map((childNodeId) => {
              const methods = methodsByEdge.get(
                `${nodeId}->${childNodeId}`,
              );

              return (
                <div
                  key={childNodeId}
                  className="relative flex flex-col items-center"
                >
                  <div className="absolute -top-6 h-6 w-px bg-zinc-700" />

                  {methods && (
                    <div className="mb-2 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-center text-xs text-zinc-400">
                      {methods
                        .map((method) => formatEvolutionMethod(method))
                        .join(' or ')}
                    </div>
                  )}

                  <EvolutionNode
                    nodeId={childNodeId}
                    currentPokemonId={currentPokemonId}
                    pokemonById={pokemonById}
                    childrenById={childrenById}
                    methodsByEdge={methodsByEdge}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface PokemonEvolutionProps {
  currentPokemonId: number;
  evolutionChain: PokemonEvolutionChain | null;
  nextEvolutions: PokemonNextEvolution[];
}

export function PokemonEvolution({
  currentPokemonId,
  evolutionChain,
  nextEvolutions,
}: PokemonEvolutionProps) {
  if (!evolutionChain) {
    return null;
  }

  const pokemonById = new Map(
    evolutionChain.pokemon.map((pokemon) => [
      pokemon.nodeId,
      pokemon,
    ]),
  );

  const childrenById = new Map<string, string[]>();

  for (const connection of evolutionChain.connections) {
    const children = childrenById.get(connection.from) ?? [];

    children.push(connection.to);

    childrenById.set(connection.from, children);
  }

  const childIds = new Set(
    evolutionChain.connections.map((connection) => connection.to),
  );

  const rootPokemonNodes = evolutionChain.pokemon.filter(
    (pokemon) => !childIds.has(pokemon.nodeId),
  );

  if (rootPokemonNodes.length === 0) {
    return null;
  }

  const methodsByEdge = new Map(
    evolutionChain.connections.map((connection) => [
      `${connection.from}->${connection.to}`,
      connection.methods,
    ]),
  );

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-zinc-100">
        Evolution
      </h2>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-wrap items-center justify-center gap-5">
          {rootPokemonNodes.map((rootPokemon) => (
            <EvolutionNode
              key={rootPokemon.nodeId}
              nodeId={rootPokemon.nodeId}
              currentPokemonId={currentPokemonId}
              pokemonById={pokemonById}
              childrenById={childrenById}
              methodsByEdge={methodsByEdge}
            />
          ))}
        </div>
      </div>

      {nextEvolutions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-zinc-100">
            How to evolve
          </h3>

          <div className="mt-4 space-y-4">
            {nextEvolutions.map((evolution) => (
              <div
                key={evolution.pokemon.nodeId}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={evolution.pokemon.image}
                    alt={evolution.pokemon.name}
                    className="h-16 w-16 object-contain"
                  />

                  <div>
                    <p className="text-sm text-zinc-500">
                      Evolves into
                    </p>

                    <Link
                      to={`/pokemon/${evolution.pokemon.id}`}
                      className="font-medium text-zinc-100 transition hover:text-white"
                    >
                      {formatName(evolution.pokemon.name)}
                    </Link>
                  </div>
                </div>

                <div className="mt-5 space-y-4 border-t border-zinc-900 pt-4">
                  {evolution.methods.map((method, methodIndex) => (
                    <div key={`${method.trigger}-${methodIndex}`}>
                      {methodIndex > 0 && (
                        <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-zinc-600">
                          or
                        </p>
                      )}

                      <p className="text-sm text-zinc-400">
                        Trigger:{' '}
                        <span className="text-zinc-200">
                          {formatName(method.trigger)}
                        </span>
                      </p>

                      <div className="mt-3 space-y-2">
                        {Array.from(
                          new Map(
                            method.rules.map((rule) => [
                              getEvolutionRuleKey(rule),
                              rule,
                            ]),
                          ).values(),
                        ).map((rule) => (
                          <EvolutionRuleDetails
                            key={getEvolutionRuleKey(rule)}
                            rule={rule}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface EvolutionRuleDetailsProps {
  rule: PokemonEvolutionRule;
}

function EvolutionRuleDetails({
  rule,
}: EvolutionRuleDetailsProps) {
  const requirements = getEvolutionRequirements(rule);

  if (requirements.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No additional requirements.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {requirements.map((requirement) => (
        <span
          key={requirement}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
        >
          {requirement}
        </span>
      ))}
    </div>
  );
}

function getEvolutionRequirements(
  rule: PokemonEvolutionRule,
): string[] {
  const requirements: string[] = [];

  if (rule.minLevel !== null) {
    requirements.push(`Level ${rule.minLevel}`);
  }

  if (rule.relativePhysicalStats !== null) {
    if (rule.relativePhysicalStats > 0) {
      requirements.push('Attack > Defense');
    } else if (rule.relativePhysicalStats < 0) {
      requirements.push('Attack < Defense');
    } else {
      requirements.push('Attack = Defense');
    }
  }

  if (rule.gender !== null) {
    if (rule.gender === 1) {
      requirements.push('Female');
    } else if (rule.gender === 2) {
      requirements.push('Male');
    }
  }

  if (rule.item) {
    requirements.push(`Use ${formatName(rule.item)}`);
  }

  if (rule.heldItem) {
    requirements.push(`Hold ${formatName(rule.heldItem)}`);
  }

  if (rule.knownMove) {
    requirements.push(`Know ${formatName(rule.knownMove.name)}`);
  }

  if (rule.usedMove && rule.minMoveCount !== null) {
    requirements.push(
      `Use ${formatName(rule.usedMove.name)} ${rule.minMoveCount} times`,
    );
  } else {
    if (rule.usedMove) {
      requirements.push(`Use ${formatName(rule.usedMove.name)}`);
    }

    if (rule.minMoveCount !== null) {
      requirements.push(`${rule.minMoveCount}+ moves`);
    }
  }

  if (rule.minHappiness !== null) {
    requirements.push(`Happiness ${rule.minHappiness}+`);
  }

  if (rule.minBeauty !== null) {
    requirements.push(`Beauty ${rule.minBeauty}+`);
  }

  if (rule.minAffection !== null) {
    requirements.push(`Affection ${rule.minAffection}+`);
  }

  if (rule.timeOfDay) {
    requirements.push(formatName(rule.timeOfDay));
  }

  if (rule.location) {
    requirements.push(`At ${formatName(rule.location)}`);
  }

  if (rule.knownType) {
    requirements.push(
      `Know a ${formatName(rule.knownType)}-type move`,
    );
  }

  if (rule.partySpecies) {
    requirements.push(
      `${formatName(rule.partySpecies.name)} in party`,
    );
  }

  if (rule.partyType) {
    requirements.push(
      `${formatName(rule.partyType)}-type Pokémon in party`,
    );
  }

  if (rule.tradeSpecies) {
    requirements.push(
      `Trade for ${formatName(rule.tradeSpecies.name)}`,
    );
  }

  if (rule.region) {
    requirements.push(`Region: ${formatName(rule.region)}`);
  }

  if (rule.needsOverworldRain) {
    requirements.push('Rain required');
  }

  if (rule.turnUpsideDown) {
    requirements.push('Turn device upside down');
  }

  if (rule.nearSpecialRock) {
    requirements.push('Near special rock');
  }

  if (rule.needsMultiplayer) {
    requirements.push('Multiplayer required');
  }

  if (rule.minSteps !== null) {
    requirements.push(`${rule.minSteps}+ steps`);
  }

  if (rule.minDamageTaken !== null) {
    requirements.push(
      `${rule.minDamageTaken}+ damage taken`,
    );
  }

  return requirements;
}

function getEvolutionRuleKey(rule: PokemonEvolutionRule): string {
  return getEvolutionRequirements(rule).join('|');
}

function formatName(value: string) {
  return value
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

function formatEvolutionMethod(
  method: PokemonEvolutionMethod,
) {
  const alternatives = Array.from(
    new Set(
      method.rules
        .map((rule) => getEvolutionRequirements(rule))
        .filter((requirements) => requirements.length > 0)
        .map((requirements) => requirements.join(' + ')),
    ),
  );

  if (alternatives.length === 0) {
    return formatName(method.trigger);
  }

  return alternatives.join(' or ');
}