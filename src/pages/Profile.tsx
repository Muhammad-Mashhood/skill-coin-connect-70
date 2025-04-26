
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Coins, Edit, Star, UserPlus, Users } from "lucide-react";

const Profile = () => {
  // This would be replaced with actual Firebase Auth/Firestore hooks
  const user = {
    displayName: "Guest User",
    initials: "GU",
    bio: "This is a demo profile. Update with your own details once logged in.",
    skills: ["Programming", "Teaching", "Design"],
    following: 0,
    followers: 0,
    reviews: 0,
    courses: [],
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            <AvatarFallback className="text-lg">{user.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.displayName}</h1>
            <p className="text-muted-foreground">
              {user.bio}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {user.skills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
          </Badge>
        ))}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Coins className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">1,000</h3>
            <p className="text-sm text-muted-foreground">Coins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Star className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">0</h3>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Users className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{user.followers}</h3>
            <p className="text-sm text-muted-foreground">Followers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <UserPlus className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{user.following}</h3>
            <p className="text-sm text-muted-foreground">Following</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <Tabs defaultValue="courses">
            <TabsList>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="followers">Followers</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="courses" className="mt-0">
            {user.courses.length === 0 ? (
              <div className="py-8 text-center">
                <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any courses yet.
                </p>
                <Button>Upload Your First Course</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.courses.map((course) => (
                  <Card key={course.id}>
                    <CardContent>
                      {/* Course content */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="followers" className="mt-0">
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Followers Yet</h3>
              <p className="text-muted-foreground">
                Build your profile and start teaching to attract followers.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="following" className="mt-0">
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium mb-2">Not Following Anyone Yet</h3>
              <p className="text-muted-foreground mb-4">
                Find teachers and follow them to keep track of their courses.
              </p>
              <Button>Find Teachers</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-0">
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
              <p className="text-muted-foreground">
                You'll see reviews from students after you teach your first course.
              </p>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
