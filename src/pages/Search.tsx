
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon } from "lucide-react";

// Mock data for initial development
const mockTeachers = [
  {
    id: "1",
    name: "Alex Johnson",
    avatar: "AJ",
    skills: ["JavaScript", "React", "Node.js"],
    pricePerHour: 50,
    bio: "Full-stack developer with 5 years of experience",
  },
  {
    id: "2",
    name: "Maria Garcia",
    avatar: "MG",
    skills: ["UI/UX Design", "Figma", "Adobe XD"],
    pricePerHour: 60,
    bio: "UI/UX designer specialized in user-centered design",
  },
  {
    id: "3",
    name: "David Kim",
    avatar: "DK",
    skills: ["Python", "Data Science", "Machine Learning"],
    pricePerHour: 75,
    bio: "Data scientist with expertise in ML and AI",
  },
  {
    id: "4",
    name: "Sarah Smith",
    avatar: "SS",
    skills: ["Digital Marketing", "SEO", "Content Strategy"],
    pricePerHour: 45,
    bio: "Marketing specialist with focus on digital channels",
  },
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(mockTeachers);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Filter mock data based on search query
      // In a real app, this would be a Firebase query or Cloud Function call
      const filtered = mockTeachers.filter(
        teacher => 
          teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          teacher.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
          teacher.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
      setIsLoading(false);
    }, 500);

    // Firebase Cloud Function integration would look something like:
    // const searchResults = await callSearchFunction(searchQuery);
    // where callSearchFunction would be a Firebase Cloud Function that uses
    // Vertex AI/Gemini to process the natural language query
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Skills & Teachers</h1>
        <p className="text-muted-foreground mt-1">
          Search for skills you want to learn or teachers to connect with
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex w-full max-w-2xl gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="I have JavaScript skills, want to learn UI/UX" 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {results.map((teacher) => (
          <Card key={teacher.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{teacher.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{teacher.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {teacher.bio}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-4">
                {teacher.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-skill-purple font-semibold">
                    {teacher.pricePerHour}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    coins/hr
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Book Session</Button>
            </CardFooter>
          </Card>
        ))}
        
        {results.length === 0 && (
          <div className="col-span-full flex justify-center py-8">
            <p className="text-muted-foreground">No matching teachers found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
