import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate skill match score between user query and teacher skills
 */
export function calculateSkillMatch(query: string, teacherSkills: string[]): number {
  if (!query.trim() || !teacherSkills?.length) return 0;
  
  // Normalize everything to lowercase
  const normalizedQuery = query.toLowerCase();
  const normalizedSkills = teacherSkills.map(s => s.toLowerCase());
  
  // Extract potential skills from the query
  const queryWords = normalizedQuery.split(/\s+/);
  
  // Calculate matches
  let matchScore = 0;
  
  // Direct skill matches
  normalizedSkills.forEach(skill => {
    if (normalizedQuery.includes(skill)) {
      matchScore += 3; // Direct match has highest score
    }
    
    // Partial matches
    queryWords.forEach(word => {
      if (word.length > 3 && skill.includes(word)) {
        matchScore += 1;
      }
    });
  });
  
  return matchScore;
}
