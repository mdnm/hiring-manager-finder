import { Actions, ExperienceLevel, MatchResult, Source } from "@prisma/client";

export function toExperienceLevel(experienceLevel: string): ExperienceLevel | undefined {
  const existingExperienceLevel = Object.values(ExperienceLevel).find(level => level === experienceLevel)

  if (existingExperienceLevel) {
    return existingExperienceLevel
  }

  if (experienceLevel === 'Mid-Senior level') {
    return ExperienceLevel.MidSeniorLevel
  }

  if (experienceLevel === 'Entry level') {
    return ExperienceLevel.EntryLevel
  }

  return undefined
}

export function toSource(source: string): Source | undefined {
  switch (source) {
    case 'linkedin':
      return Source.LinkedIn
    case 'indeed':
      return Source.Indeed
    default:
      return undefined
  }
}

export function toAction(action: string): Actions | undefined {
  if (action === 'AutoUp' || action === 'AutoUp BDR') {
    return Actions.AutoUp
  }

  if (action === "J2BD Marketing") {
    return Actions.J2BDMarketing
  }

  if (action === 'J2BD Chef de Secteur') {
    return Actions.J2BDChefSecteur
  }

  if (action === 'J2BD Head of Sales') {
    return Actions.J2BDSalesHead
  }

  if (action === 'J2BD Export') {
    return Actions.J2BDLogistics
  }

  if (action === 'J2BD HR Manager') {
    return Actions.J2BDHRManager
  }

  if (action === 'Digital Orbis IT') {
    return Actions.DigitalOrbisIT
  }

  if (action === 'Digital Orbis Fin') {
    return Actions.DigitalOrbisFinance
  }

  if (action === 'Decent') {
    return Actions.Decent
  }

  return undefined
}

export function toMatchResult(matchResult: string): MatchResult {
  if (matchResult === 'Mateus API') {
    return MatchResult.MatchFound
  }

  if (matchResult === 'Mateus API (No match found)') {
    return MatchResult.MatchNotFound
  }

  if (matchResult === 'Mateus API (Company not found)') {
    return MatchResult.CompanyNotFound
  }

  return MatchResult.MatchNotFound
}

export const USStates: Record<string, string> = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "DC": "District Of Columbia",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming"
}