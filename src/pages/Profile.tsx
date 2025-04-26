import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Coins, Edit, Star, UserPlus, Users, Calendar, BookOpen, FileEdit } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  // This would be replaced with actual Firebase Auth/Firestore hooks
  const [user, setUser] = useState({
    displayName: "Alex Johnson",
    initials: "AJ",
    bio: "Full-stack developer with 5 years of experience. I enjoy teaching JavaScript, React, and Node.js.",
    skills: ["JavaScript", "React", "Node.js", "UI/UX Design"],
    following: 8,
    followers: 12,
    coins: 1250,
    reviews: 4,
    courses: [
      {
        id: "1",
        title: "JavaScript Fundamentals",
        students: 24,
        rating: 4.8,
        thumbnail: "https://placehold.co/300x200/7C3AED/FFFFFF/png?text=JavaScript+Fundamentals"
      },
      {
        id: "2",
        title: "React Hooks Masterclass",
        students: 18,
        rating: 4.9,
        thumbnail: "https://placehold.co/300x200/7C3AED/FFFFFF/png?text=React+Hooks"
      }
    ],
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: user.displayName,
    bio: user.bio,
    skillInput: "",
  });

  const handleEditProfile = () => {
    setEditFormData({
      displayName: user.displayName,
      bio: user.bio,
      skillInput: "",
    });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    setUser({
      ...user,
      displayName: editFormData.displayName,
      bio: editFormData.bio,
    });
    setIsEditing(false);
  };

  const addSkill = () => {
    if (editFormData.skillInput.trim() && !user.skills.includes(editFormData.skillInput.trim())) {
      setUser({
        ...user,
        skills: [...user.skills, editFormData.skillInput.trim()]
      });
      setEditFormData({
        ...editFormData,
        skillInput: ""
      });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setUser({
      ...user,
      skills: user.skills.filter(skill => skill !== skillToRemove)
    });
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-skill-purple to-skill-purple-light"></div>
        <CardContent className="pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-12">
            <div className="flex items-center gap-4">
              <Avatar className="w-24 h-24 border-4 border-background bg-background">
                <AvatarFallback className="text-xl">{user.initials}</AvatarFallback>
              </Avatar>
              <div className="mt-12 md:mt-0">
                <h1 className="text-3xl font-bold">{user.displayName}</h1>
                <p className="text-muted-foreground">
                  {user.bio}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Button variant="outline" onClick={handleEditProfile}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {user.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Coins className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{user.coins.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Coins</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Star className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{user.reviews}</h3>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Users className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{user.followers}</h3>
            <p className="text-sm text-muted-foreground">Followers</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <UserPlus className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{user.following}</h3>
            <p className="text-sm text-muted-foreground">Following</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <Tabs defaultValue="courses">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="courses" className="mt-0">
              {user.courses.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any courses yet.
                  </p>
                  <Button asChild>
                    <Link to="/upload">Upload Your First Course</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-32 object-cover" />
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{course.title}</h3>
                          <Badge variant="outline">{course.rating} ★</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{course.students} students enrolled</p>
                        <div className="flex justify-between mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/courses/${course.id}`}>
                              <FileEdit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            {course.rating}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Card className="flex items-center justify-center border-dashed p-6">
                    <Button asChild variant="outline">
                      <Link to="/upload" className="flex items-center">
                        <BookOpen className="mr-2 h-5 w-5" />
                        Create New Course
                      </Link>
                    </Button>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="bookings" className="mt-0">
              <div className="py-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't booked any courses yet.
                </p>
                <Button asChild>
                  <Link to="/search">Find Courses</Link>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="network" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Followers ({user.followers})</CardTitle>
                    <CardDescription>People following your profile</CardDescription>
                  </CardHeader>
                  {user.followers === 0 ? (
                    <CardContent>
                      <div className="py-4 text-center">
                        <p className="text-muted-foreground">
                          Build your profile and start teaching to attract followers.
                        </p>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent>
                      <p className="text-muted-foreground">Implement follower list here...</p>
                    </CardContent>
                  )}
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Following ({user.following})</CardTitle>
                    <CardDescription>People you're following</CardDescription>
                  </CardHeader>
                  {user.following === 0 ? (
                    <CardContent>
                      <div className="py-4 text-center">
                        <p className="text-muted-foreground">
                          Find teachers and follow them to keep track of their courses.
                        </p>
                        <Button className="mt-4" asChild>
                          <Link to="/search">Find Teachers</Link>
                        </Button>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent>
                      <p className="text-muted-foreground">Implement following list here...</p>
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-0">
              <div className="py-8 text-center">
                <Star className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground">
                  You'll see reviews from students after you teach your first course.
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={editFormData.displayName}
                onChange={(e) => setEditFormData({...editFormData, displayName: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editFormData.bio}
                onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  value={editFormData.skillInput}
                  onChange={(e) => setEditFormData({...editFormData, skillInput: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => removeSkill(skill)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-3 w-3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
