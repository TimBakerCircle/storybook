import { twMerge } from "tailwind-merge";

export interface TailwindClassOccurrence {
  className: string;
  classes: string[];
  normalized: string;
  filePath: string;
  line: number;
  column: number;
  conflicting: boolean;
}

export interface RepeatedTailwindClassGroup {
  normalized: string;
  className: string;
  occurrences: TailwindClassOccurrence[];
  conflicting: boolean;
}

export function splitTailwindClasses(className: string): string[] {
  return className
    .split(/\s+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function normalizeTailwindClassGroup(className: string): string {
  return splitTailwindClasses(twMerge(className)).sort().join(" ");
}

export function hasTailwindConflict(className: string): boolean {
  return twMerge(className) !== splitTailwindClasses(className).join(" ");
}

export function findRepeatedTailwindClassGroups(
  occurrences: readonly TailwindClassOccurrence[],
  minimumOccurrences = 2
): RepeatedTailwindClassGroup[] {
  const groups = new Map<string, TailwindClassOccurrence[]>();

  for (const occurrence of occurrences) {
    const existing = groups.get(occurrence.normalized) || [];
    existing.push(occurrence);
    groups.set(occurrence.normalized, existing);
  }

  return [...groups.entries()]
    .filter(([, values]) => values.length >= minimumOccurrences)
    .map(([normalized, values]) => ({
      normalized,
      className: values[0]?.className || normalized,
      occurrences: values,
      conflicting: values.some((value) => value.conflicting),
    }))
    .sort((a, b) => b.occurrences.length - a.occurrences.length || a.normalized.localeCompare(b.normalized));
}
