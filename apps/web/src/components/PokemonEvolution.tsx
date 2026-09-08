import { Link } from 'react-router-dom';
import type {
  PokemonEvolutionChain,
  PokemonEvolutionRule,
  PokemonNextEvolution,
} from '../types/pokemon';

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

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-zinc-100">
        Evolution
      </h2>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-wrap items-center justify-center gap-5">
          {evolutionChain.pokemon.map((pokemon, index) => {
            const isCurrent = pokemon.id === currentPokemonId;

            return (
              <div
                key={pokemon.id}
                className="flex items-center gap-5"
              >
                {index > 0 && (
                  <span className="text-2xl text-zinc-600">
                    →
                  </span>
                )}

                <Link
                  to={`/pokemon/${pokemon.id}`}
                  className={`group flex w-36 flex-col items-center rounded-xl border p-4 transition ${
                    isCurrent
                      ? 'border-zinc-500 bg-zinc-900'
                      : 'border-zinc-800 bg-black hover:border-zinc-600'
                  }`}
                >
                  <img
                    src={pokemon.image}
                    alt={pokemon.name}
                    className="h-24 w-24 object-contain transition group-hover:scale-105"
                  />

                  <span className="mt-3 text-xs text-zinc-500">
                    #{pokemon.id.toString().padStart(4, '0')}
                  </span>

                  <span className="mt-1 text-sm font-medium text-zinc-200">
                    {formatName(pokemon.name)}
                  </span>
                </Link>
              </div>
            );
          })}
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
                key={evolution.pokemon.id}
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

                <div className="mt-5 border-t border-zinc-900 pt-4">
                  <p className="text-sm text-zinc-400">
                    Trigger:{' '}
                    <span className="text-zinc-200">
                      {formatName(evolution.trigger)}
                    </span>
                  </p>

                  <div className="mt-3 space-y-2">
                    {evolution.rules.map((rule, index) => (
                      <EvolutionRuleDetails
                        key={index}
                        rule={rule}
                      />
                    ))}
                  </div>
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

  if (rule.item) {
    requirements.push(`Use ${formatName(rule.item)}`);
  }

  if (rule.heldItem) {
    requirements.push(`Hold ${formatName(rule.heldItem)}`);
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

  if (rule.minMoveCount !== null) {
    requirements.push(`${rule.minMoveCount}+ moves`);
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

function formatName(value: string) {
  return value
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}