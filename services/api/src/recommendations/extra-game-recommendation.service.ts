import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RecommendationCoverageService } from './recommendation-coverage.service';

export interface MissingSpecies {
  externalId: number;
  name: string;
}

interface CandidateGame {
  externalId: number;
  name: string;
  coveredSpeciesIds: Set<number>;
}

export interface SuggestedGame {
  externalId: number;
  name: string;
  coveredSpecies: MissingSpecies[];
}

@Injectable()
export class ExtraGameRecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverageService: RecommendationCoverageService,
  ) {}

  async recommendExtraGames(
    uncoveredSpecies: MissingSpecies[],
    configuredGameIds: number[],
  ) {
    if (uncoveredSpecies.length === 0) {
      return {
        suggestedGames: [],
        stillUncovered: [],
      };
    }

    const uncoveredById = new Map(
      uncoveredSpecies.map((species) => [species.externalId, species]),
    );

    const games = await this.prisma.game.findMany({
      where: {
        externalId: {
          notIn: configuredGameIds,
        },
      },
      select: {
        externalId: true,
        name: true,
      },
      orderBy: {
        externalId: 'asc',
      },
    });

    const candidates: CandidateGame[] = [];

    for (const game of games) {
      const coverage = await this.coverageService.getGameCoverage(
        game.externalId,
      );

      const coveredSpeciesIds = new Set<number>();

      for (const species of coverage.species) {
        if (uncoveredById.has(species.externalId)) {
          coveredSpeciesIds.add(species.externalId);
        }
      }

      if (coveredSpeciesIds.size === 0) {
        continue;
      }

      candidates.push({
        externalId: game.externalId,
        name: game.name,
        coveredSpeciesIds,
      });
    }

    const targetSpeciesIds = new Set(
      uncoveredSpecies.map((species) => species.externalId),
    );

    const selectedCandidates = this.findBestCombination(
      candidates,
      targetSpeciesIds,
    );

    const coveredBySuggestions = new Set<number>();

    const suggestedGames: SuggestedGame[] = selectedCandidates.map(
      (candidate) => {
        const coveredSpecies = Array.from(candidate.coveredSpeciesIds)
          .filter((speciesId) => !coveredBySuggestions.has(speciesId))
          .map((speciesId) => uncoveredById.get(speciesId))
          .filter((species): species is MissingSpecies => species !== undefined)
          .sort((a, b) => a.externalId - b.externalId);

        for (const species of coveredSpecies) {
          coveredBySuggestions.add(species.externalId);
        }

        return {
          externalId: candidate.externalId,
          name: candidate.name,
          coveredSpecies,
        };
      },
    );

    const stillUncovered = uncoveredSpecies
      .filter((species) => !coveredBySuggestions.has(species.externalId))
      .sort((a, b) => a.externalId - b.externalId);

    return {
      suggestedGames,
      stillUncovered,
    };
  }

  async inspectCandidateGames(
    uncoveredSpecies: MissingSpecies[],
    configuredGameIds: number[],
  ) {
    const uncoveredIds = new Set(
      uncoveredSpecies.map((species) => species.externalId),
    );

    const games = await this.prisma.game.findMany({
      where: {
        externalId: {
          notIn: configuredGameIds,
        },
      },
      select: {
        externalId: true,
        name: true,
      },
      orderBy: {
        externalId: 'asc',
      },
    });

    const candidates: Array<{
      externalId: number;
      name: string;
      coverageCount: number;
      coveredSpeciesIds: number[];
    }> = [];

    for (const game of games) {
      const coverage = await this.coverageService.getGameCoverage(
        game.externalId,
      );

      const coveredSpeciesIds = coverage.species
        .filter((species) => uncoveredIds.has(species.externalId))
        .map((species) => species.externalId)
        .sort((a, b) => a - b);

      if (coveredSpeciesIds.length === 0) {
        continue;
      }

      candidates.push({
        externalId: game.externalId,
        name: game.name,
        coverageCount: coveredSpeciesIds.length,
        coveredSpeciesIds,
      });
    }

    return {
      totalCandidates: candidates.length,
      candidates,
    };
  }

  private findBestCombination(
    candidates: CandidateGame[],
    targetSpeciesIds: Set<number>,
  ) {
    if (candidates.length === 0) {
      return [];
    }

    const normalizedCandidates = candidates
      .map((candidate) => ({
        ...candidate,
        coveredSpeciesIds: new Set(
          Array.from(candidate.coveredSpeciesIds).filter((speciesId) =>
            targetSpeciesIds.has(speciesId),
          ),
        ),
      }))
      .filter((candidate) => candidate.coveredSpeciesIds.size > 0);

    if (normalizedCandidates.length === 0) {
      return [];
    }

    const reducedCandidates = this.removeDominatedCandidates(
      normalizedCandidates,
    ).sort((a, b) => {
      const coverageDifference =
        b.coveredSpeciesIds.size - a.coveredSpeciesIds.size;

      if (coverageDifference !== 0) {
        return coverageDifference;
      }

      return a.externalId - b.externalId;
    });

    const achievableSpeciesIds = new Set<number>();

    for (const candidate of reducedCandidates) {
      for (const speciesId of candidate.coveredSpeciesIds) {
        achievableSpeciesIds.add(speciesId);
      }
    }

    if (achievableSpeciesIds.size === 0) {
      return [];
    }

    let bestCombination = this.createGreedyCombination(
      reducedCandidates,
      achievableSpeciesIds,
    );

    const selectedGameIds = new Set<number>();

    const memo = new Map<string, number>();

    const search = (
      selectedCandidates: CandidateGame[],
      coveredSpeciesIds: Set<number>,
    ) => {
      if (coveredSpeciesIds.size === achievableSpeciesIds.size) {
        if (selectedCandidates.length < bestCombination.length) {
          bestCombination = this.orderCombination(selectedCandidates);

          return;
        }

        if (
          selectedCandidates.length === bestCombination.length &&
          this.hasBetterCoverageOrder(selectedCandidates, bestCombination)
        ) {
          bestCombination = this.orderCombination(selectedCandidates);
        }

        return;
      }

      if (selectedCandidates.length >= bestCombination.length) {
        return;
      }

      const remainingSpeciesIds = new Set(
        Array.from(achievableSpeciesIds).filter(
          (speciesId) => !coveredSpeciesIds.has(speciesId),
        ),
      );

      const maximumAdditionalCoverage = this.getMaximumAdditionalCoverage(
        reducedCandidates,
        selectedGameIds,
        remainingSpeciesIds,
      );

      if (maximumAdditionalCoverage === 0) {
        return;
      }

      const minimumAdditionalGames = Math.ceil(
        remainingSpeciesIds.size / maximumAdditionalCoverage,
      );

      if (
        selectedCandidates.length + minimumAdditionalGames >
        bestCombination.length
      ) {
        return;
      }

      const memoKey = this.createCoverageKey(coveredSpeciesIds);

      const previousSelectionSize = memo.get(memoKey);

      if (
        previousSelectionSize !== undefined &&
        previousSelectionSize < selectedCandidates.length
      ) {
        return;
      }

      if (
        previousSelectionSize === undefined ||
        selectedCandidates.length < previousSelectionSize
      ) {
        memo.set(memoKey, selectedCandidates.length);
      }

      const pivotSpeciesId = this.findMostConstrainedSpecies(
        remainingSpeciesIds,
        reducedCandidates,
        selectedGameIds,
      );

      if (pivotSpeciesId === null) {
        return;
      }

      const options = reducedCandidates
        .filter(
          (candidate) =>
            !selectedGameIds.has(candidate.externalId) &&
            candidate.coveredSpeciesIds.has(pivotSpeciesId),
        )
        .map((candidate) => ({
          candidate,
          additionalCoverage: this.countIntersection(
            candidate.coveredSpeciesIds,
            remainingSpeciesIds,
          ),
        }))
        .sort((a, b) => {
          if (b.additionalCoverage !== a.additionalCoverage) {
            return b.additionalCoverage - a.additionalCoverage;
          }

          if (
            b.candidate.coveredSpeciesIds.size !==
            a.candidate.coveredSpeciesIds.size
          ) {
            return (
              b.candidate.coveredSpeciesIds.size -
              a.candidate.coveredSpeciesIds.size
            );
          }

          return a.candidate.externalId - b.candidate.externalId;
        });

      for (const option of options) {
        const candidate = option.candidate;

        selectedGameIds.add(candidate.externalId);

        const nextCoveredSpeciesIds = new Set(coveredSpeciesIds);

        for (const speciesId of candidate.coveredSpeciesIds) {
          nextCoveredSpeciesIds.add(speciesId);
        }

        search([...selectedCandidates, candidate], nextCoveredSpeciesIds);

        selectedGameIds.delete(candidate.externalId);
      }
    };

    search([], new Set<number>());

    return this.orderCombination(bestCombination);
  }

  private removeDominatedCandidates(candidates: CandidateGame[]) {
    return candidates.filter((candidate, candidateIndex) => {
      return !candidates.some((other, otherIndex) => {
        if (candidateIndex === otherIndex) {
          return false;
        }

        if (
          !this.isSubset(candidate.coveredSpeciesIds, other.coveredSpeciesIds)
        ) {
          return false;
        }

        if (other.coveredSpeciesIds.size > candidate.coveredSpeciesIds.size) {
          return true;
        }

        return other.externalId < candidate.externalId;
      });
    });
  }

  private createGreedyCombination(
    candidates: CandidateGame[],
    targetSpeciesIds: Set<number>,
  ) {
    const remainingSpeciesIds = new Set(targetSpeciesIds);

    const selectedCandidates: CandidateGame[] = [];

    const selectedGameIds = new Set<number>();

    while (remainingSpeciesIds.size > 0) {
      let bestCandidate: CandidateGame | null = null;

      let bestAdditionalCoverage = 0;

      for (const candidate of candidates) {
        if (selectedGameIds.has(candidate.externalId)) {
          continue;
        }

        const additionalCoverage = this.countIntersection(
          candidate.coveredSpeciesIds,
          remainingSpeciesIds,
        );

        if (additionalCoverage > bestAdditionalCoverage) {
          bestCandidate = candidate;

          bestAdditionalCoverage = additionalCoverage;

          continue;
        }

        if (
          additionalCoverage !== bestAdditionalCoverage ||
          additionalCoverage === 0 ||
          !bestCandidate
        ) {
          continue;
        }

        if (
          candidate.coveredSpeciesIds.size >
          bestCandidate.coveredSpeciesIds.size
        ) {
          bestCandidate = candidate;

          continue;
        }

        if (
          candidate.coveredSpeciesIds.size ===
            bestCandidate.coveredSpeciesIds.size &&
          candidate.externalId < bestCandidate.externalId
        ) {
          bestCandidate = candidate;
        }
      }

      if (!bestCandidate || bestAdditionalCoverage === 0) {
        break;
      }

      selectedCandidates.push(bestCandidate);

      selectedGameIds.add(bestCandidate.externalId);

      for (const speciesId of bestCandidate.coveredSpeciesIds) {
        remainingSpeciesIds.delete(speciesId);
      }
    }

    return this.orderCombination(selectedCandidates);
  }

  private getMaximumAdditionalCoverage(
    candidates: CandidateGame[],
    selectedGameIds: Set<number>,
    remainingSpeciesIds: Set<number>,
  ) {
    let maximumCoverage = 0;

    for (const candidate of candidates) {
      if (selectedGameIds.has(candidate.externalId)) {
        continue;
      }

      const coverage = this.countIntersection(
        candidate.coveredSpeciesIds,
        remainingSpeciesIds,
      );

      if (coverage > maximumCoverage) {
        maximumCoverage = coverage;
      }
    }

    return maximumCoverage;
  }

  private findMostConstrainedSpecies(
    remainingSpeciesIds: Set<number>,
    candidates: CandidateGame[],
    selectedGameIds: Set<number>,
  ) {
    let selectedSpeciesId: number | null = null;

    let fewestOptions = Number.POSITIVE_INFINITY;

    for (const speciesId of remainingSpeciesIds) {
      let optionCount = 0;

      for (const candidate of candidates) {
        if (selectedGameIds.has(candidate.externalId)) {
          continue;
        }

        if (candidate.coveredSpeciesIds.has(speciesId)) {
          optionCount++;
        }
      }

      if (optionCount === 0) {
        return null;
      }

      if (optionCount < fewestOptions) {
        fewestOptions = optionCount;

        selectedSpeciesId = speciesId;
      }
    }

    return selectedSpeciesId;
  }

  private countIntersection(first: Set<number>, second: Set<number>) {
    let count = 0;

    for (const value of first) {
      if (second.has(value)) {
        count++;
      }
    }

    return count;
  }

  private isSubset(subset: Set<number>, superset: Set<number>) {
    for (const value of subset) {
      if (!superset.has(value)) {
        return false;
      }
    }

    return true;
  }

  private createCoverageKey(coveredSpeciesIds: Set<number>) {
    return Array.from(coveredSpeciesIds)
      .sort((a, b) => a - b)
      .join(',');
  }

  private orderCombination(combination: CandidateGame[]) {
    return [...combination].sort((a, b) => {
      const coverageDifference =
        b.coveredSpeciesIds.size - a.coveredSpeciesIds.size;

      if (coverageDifference !== 0) {
        return coverageDifference;
      }

      return a.externalId - b.externalId;
    });
  }

  private hasBetterCoverageOrder(
    candidate: CandidateGame[],
    current: CandidateGame[],
  ) {
    const orderedCandidate = this.orderCombination(candidate);

    const orderedCurrent = this.orderCombination(current);

    for (let index = 0; index < orderedCandidate.length; index++) {
      const candidateGame = orderedCandidate[index];

      const currentGame = orderedCurrent[index];

      if (
        candidateGame.coveredSpeciesIds.size >
        currentGame.coveredSpeciesIds.size
      ) {
        return true;
      }

      if (
        candidateGame.coveredSpeciesIds.size <
        currentGame.coveredSpeciesIds.size
      ) {
        return false;
      }

      if (candidateGame.externalId < currentGame.externalId) {
        return true;
      }

      if (candidateGame.externalId > currentGame.externalId) {
        return false;
      }
    }

    return false;
  }
}
