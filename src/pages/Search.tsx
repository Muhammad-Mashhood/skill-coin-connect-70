import { useState, useEffect } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { calculateSkillMatch } from "@/lib/utils";
import { useSkillParser } from "@/hooks/use-skill-parser";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star, Search as SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const { currentUser } = useAuth();
  const { parsedSkills, parseQuery } = useSkillParser();
  
  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // Get users who have role as "teacher"
        const usersRef = collection(db, "users");
        const q = query(
          usersRef, 
          where("role", "==", "teacher"),
          limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const teachers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          avatar: doc.data().displayName?.split(' ').map(n => n[0]).join('') || "U",
          skills: doc.data().skills || [] // Ensure skills property exists
        }));
        
        setResults(teachers);
        
        // Extract all unique skills
        const allSkills = new Set();
        teachers.forEach(teacher => {
          (teacher.skills || []).forEach(skill => allSkills.add(skill));
        });
        setAvailableSkills(Array.from(allSkills));
        
      } catch (error) {
        console.error("Error fetching teachers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Parse the query for skills
    const skills = parseQuery(searchQuery);
    
    try {
      // Get all teachers
      const usersRef = collection(db, "users");
      const q = query(
        usersRef, 
        where("role", "==", "teacher")
      );
      
      const querySnapshot = await getDocs(q);
      let teachers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        avatar: doc.data().displayName?.split(' ').map(n => n[0]).join('') || "U",
        matchScore: 0,
        skills: doc.data().skills || [], // Ensure skills property exists
        pricePerHour: doc.data().pricePerHour || 0 // Ensure pricePerHour property exists
      }));
      
      // No search query? Return all teachers
      if (!searchQuery.trim()) {
        setResults(teachers);
        setIsLoading(false);
        return;
      }
      
      // Calculate match scores
      teachers = teachers.map(teacher => {
        let score = 0;
        
        // Highest priority: Match what the user wants to learn with what teacher can teach
        if (skills.wantsSkills.length > 0 && teacher.skills) {
          skills.wantsSkills.forEach(skill => {
            teacher.skills.forEach(teacherSkill => {
              if (teacherSkill.toLowerCase().includes(skill.toLowerCase())) {
                score += 5; // High priority match
              }
            });
          });
        }
        
        // Also match regular search terms
        score += calculateSkillMatch(searchQuery, teacher.skills || []);
        
        return {
          ...teacher,
          matchScore: score
        };
      });
      
      // Apply filters
      teachers = teachers.filter(teacher => {
        // Price filter
        const price = teacher.pricePerHour || 0;
        if (price < priceRange[0] || price > priceRange[1]) return false;
        
        // Skill filter
        if (selectedSkills.length > 0) {
          const teacherSkills = teacher.skills || [];
          const hasSelectedSkill = selectedSkills.some(skill => 
            teacherSkills.includes(skill)
          );
          if (!hasSelectedSkill) return false;
        }
        
        return true;
      });
      
      // Filter by minimum match score and sort by highest match
      if (searchQuery.trim()) {
        teachers = teachers
          .filter(teacher => teacher.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore);
      }
      
      setResults(teachers);
    } catch (error) {
      console.error("Error searching teachers:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Find a Teacher</h1>
        <p className="text-muted-foreground mb-6">
          Search for teachers by skill or topic. Try terms like "I want to learn JavaScript" or "looking for piano lessons".
        </p>
        
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for skills, topics, or teachers..."
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </form>
      </div>
      
      {/* Show parsed skills if any */}
      {(parsedSkills.hasSkills.length > 0 || parsedSkills.wantsSkills.length > 0) && (
        <div className="bg-muted p-4 rounded-md">
          {parsedSkills.hasSkills.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">Your skills: </span>
              {parsedSkills.hasSkills.map(skill => (
                <Badge key={skill} variant="outline" className="mr-1">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
          
          {parsedSkills.wantsSkills.length > 0 && (
            <div>
              <span className="font-medium">You want to learn: </span>
              {parsedSkills.wantsSkills.map(skill => (
                <Badge key={skill} className="mr-1 bg-skill-purple text-white">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Price Range (coins)</Label>
                <div className="pt-2">
                  <Slider 
                    defaultValue={[0, 1000]} 
                    max={1000} 
                    step={10}
                    onValueChange={(value) => setPriceRange(value)}
                  />
                  <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                    <span>{priceRange[0]}</span>
                    <span>{priceRange[1]}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Skills</Label>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`skill-${skill}`}
                        checked={selectedSkills.includes(skill)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSkills([...selectedSkills, skill]);
                          } else {
                            setSelectedSkills(selectedSkills.filter(s => s !== skill));
                          }
                        }}
                      />
                      <Label htmlFor={`skill-${skill}`} className="text-sm">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSelectedSkills([]);
                  setPriceRange([0, 1000]);
                }}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:w-3/4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="p-6 animate-pulse">
                    <div className="flex items-center gap-4 pb-4">
                      <div className="w-12 h-12 rounded-full bg-muted"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded"></div>
                        <div className="h-3 w-16 bg-muted rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-muted rounded"></div>
                      <div className="h-3 w-4/5 bg-muted rounded"></div>
                    </div>
                    <div className="flex gap-1 mt-4">
                      <div className="h-6 w-16 rounded bg-muted"></div>
                      <div className="h-6 w-16 rounded bg-muted"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((teacher) => (
                <Card key={teacher.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{teacher.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{teacher.displayName}</h3>
                      {teacher.matchScore > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {teacher.matchScore > 10 ? "Perfect match" : 
                           teacher.matchScore > 5 ? "Great match" : "Good match"}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {teacher.bio || "No bio available."}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(teacher.skills || []).slice(0, 4).map((skill) => (
                        <Badge 
                          key={skill} 
                          variant={parsedSkills.wantsSkills.includes(skill.toLowerCase()) ? "default" : "outline"}
                          className={parsedSkills.wantsSkills.some(s => skill.toLowerCase().includes(s)) ? "bg-skill-purple" : ""}
                        >
                          {skill}
                        </Badge>
                      ))}
                      {(teacher.skills || []).length > 4 && (
                        <Badge variant="outline">+{teacher.skills.length - 4} more</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= (teacher.rating || 0)
                                ? "fill-current"
                                : "stroke-current"
                            }
                          />
                        ))}
                        <span className="ml-1 text-xs">
                          {teacher.reviews || 0} reviews
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {teacher.pricePerHour || 50} coins/hr
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/profile/${teacher.id}`}>View Profile</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <SearchIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search or filter criteria. Remember you can use natural language like "I want to learn JavaScript" for better results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
