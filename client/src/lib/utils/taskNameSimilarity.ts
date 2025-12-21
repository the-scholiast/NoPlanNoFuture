import { TaskData } from '@/types/todoTypes';

/**
 * Normalize a task name for comparison
 * Handles case variations, hyphens, spaces, and special characters
 * Examples: "coop" === "Coop" === "co-op" === "Co-Op"
 */
export function normalizeTaskName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_\s]/g, '') // Remove hyphens, underscores, and spaces
    .trim();
}

/**
 * Calculate similarity score between two task names (0-1)
 * Higher score means more similar
 */
export function calculateSimilarity(name1: string, name2: string): number {
  const normalized1 = normalizeTaskName(name1);
  const normalized2 = normalizeTaskName(name2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Check if one contains the other (for partial matches)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const longer = Math.max(normalized1.length, normalized2.length);
    const shorter = Math.min(normalized1.length, normalized2.length);
    return shorter / longer;
  }

  // Calculate Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  if (maxLength === 0) return 1.0;
  
  return 1 - (distance / maxLength);
}

/**
 * Levenshtein distance algorithm for string similarity
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1       // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Find similar tasks from a list of existing tasks
 * Returns tasks sorted by similarity score (highest first)
 */
export function findSimilarTasks(
  searchName: string,
  existingTasks: TaskData[],
  threshold: number = 0.6,
  maxResults: number = 5
): Array<{ task: TaskData; similarity: number }> {
  if (!searchName.trim()) {
    return [];
  }

  const results = existingTasks
    .map(task => ({
      task,
      similarity: calculateSimilarity(searchName, task.title)
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  return results;
}
