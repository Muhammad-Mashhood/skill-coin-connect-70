import { useState, useCallback } from 'react';

interface ParsedSkills {
  hasSkills: string[];
  wantsSkills: string[];
}

export function useSkillParser() {
  const [parsedSkills, setParsedSkills] = useState<ParsedSkills>({
    hasSkills: [],
    wantsSkills: []
  });
  
  const parseQuery = useCallback((query: string): ParsedSkills => {
    const result: ParsedSkills = {
      hasSkills: [],
      wantsSkills: []
    };
    
    // Pattern matching for different phrases
    const hasPatterns = [
      /I have (.*?)(?:skills|knowledge|experience)/i,
      /I know (.*?)(?:and|,|$)/i,
      /I'm good at (.*?)(?:and|,|$)/i,
      /skilled in (.*?)(?:and|,|$)/i
    ];
    
    const wantPatterns = [
      /I want to learn (.*?)(?:and|,|$)/i,
      /looking for (.*?)(?:lessons|tutoring|teaching|skills)/i,
      /need help with (.*?)(?:and|,|$)/i,
      /interested in (.*?)(?:and|,|$)/i
    ];
    
    // Extract "have" skills
    hasPatterns.forEach(pattern => {
      const match = query.match(pattern);
      if (match && match[1]) {
        const skills = match[1].split(/,|and/).map(s => s.trim());
        result.hasSkills = [...result.hasSkills, ...skills.filter(s => s)];
      }
    });
    
    // Extract "want" skills
    wantPatterns.forEach(pattern => {
      const match = query.match(pattern);
      if (match && match[1]) {
        const skills = match[1].split(/,|and/).map(s => s.trim());
        result.wantsSkills = [...result.wantsSkills, ...skills.filter(s => s)];
      }
    });
    
    setParsedSkills(result);
    return result;
  }, []);
  
  return { parsedSkills, parseQuery };
}