import { ExperienceLevel, MatchResult } from "@prisma/client";

export function toExperienceLevel(
  experienceLevel: string
): ExperienceLevel | undefined {
  const existingExperienceLevel = Object.values(ExperienceLevel).find(
    (level) => level === experienceLevel
  );

  if (existingExperienceLevel) {
    return existingExperienceLevel;
  }

  if (experienceLevel === "Mid-Senior level") {
    return ExperienceLevel.MidSeniorLevel;
  }

  if (experienceLevel === "Entry level") {
    return ExperienceLevel.EntryLevel;
  }

  return undefined;
}

export function toMatchResult(matchResult: string): MatchResult {
  if (matchResult === "Mateus API") {
    return MatchResult.MatchFound;
  }

  if (matchResult === "Mateus API (No match found)") {
    return MatchResult.MatchNotFound;
  }

  if (matchResult === "Mateus API (Company not found)") {
    return MatchResult.CompanyNotFound;
  }

  return MatchResult.MatchNotFound;
}
