import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Coins, Edit, Star, UserPlus, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Profile = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    displayName: "Guest User",
    initials: "GU",
    bio: "This is a demo profile. Update with your own details once logged in.",
    skills: ["Programming", "Teaching", "Design"],
    following: 0,
    followers: 0,
    reviews: 0,
    coins: 1000,
    courses: [],
  });
  
  const [editForm, setEditForm] = useState({
    bio: "",
    newSkill: ""
  });
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userRef);
        
        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          const initials = currentUser.displayName
            ?.split(' ')
            .map(n => n[0])
            .join('') || "GU";
            
          setUserData({
            displayName: currentUser.displayName || "User",
            initials,
            bio: data.bio || "No bio yet",
            skills: data.skills || [],
            following: data.following || 0,
            followers: data.followers || 0,
            reviews: data.reviews || 0,
            coins: data.coins || 1000,
            courses: data.courses || [],
          });
          
          setEditForm({
            bio: data.bio || "",
            newSkill: ""
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      setIsEditing(false);
      
      toast({
        title: "Saving...",
        description: "Updating your profile information"
      });
      
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        bio: editForm.bio
      });
      
      setUserData({
        ...userData,
        bio: editForm.bio
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      
      let errorMessage = "Failed to update profile information";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  const addSkill = async () => {
    if (!editForm.newSkill.trim() || !currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        skills: arrayUnion(editForm.newSkill.trim())
      });
      
      setUserData({
        ...userData,
        skills: [...userData.skills, editForm.newSkill.trim()]
      });
      
      setEditForm({
        ...editForm,
        newSkill: ""
      });
      
      toast({
        title: "Skill added",
        description: `${editForm.newSkill.trim()} has been added to your skills`
      });
    } catch (error) {
      console.error("Error adding skill:", error);
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
    }
  };
  
  const removeSkill = async (skill) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        skills: arrayRemove(skill)
      });
      
      setUserData({
        ...userData,
        skills: userData.skills.filter(s => s !== skill)
      });
      
      toast({
        title: "Skill removed",
        description: `${skill} has been removed from your skills`
      });
    } catch (error) {
      console.error("Error removing skill:", error);
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            <AvatarFallback className="text-lg">{userData.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{userData.displayName}</h1>
            <p className="text-muted-foreground">
              {userData.bio}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEditProfile}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {userData.skills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
          </Badge>
        ))}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Coins className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{userData.coins}</h3>
            <p className="text-sm text-muted-foreground">Coins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Star className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{userData.reviews}</h3>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Users className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{userData.followers}</h3>
            <p className="text-sm text-muted-foreground">Followers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <UserPlus className="h-5 w-5 text-skill-purple mb-1" />
            <h3 className="font-semibold text-lg">{userData.following}</h3>
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
              {userData.courses && userData.courses.length === 0 ? (
                <div className="py-8 text-center">
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground">
                    You haven't created any courses yet.
                  </p>
                  <Button className="mt-4" asChild>
                    <a href="/upload">Create a Course</a>
                  </Button>
                </div>
              ) : (
                <div>
                  {/* Map through user's courses here when implemented */}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="bookings" className="mt-0">
              <div className="py-8 text-center">
                <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
                <p className="text-muted-foreground">
                  You haven't made any bookings yet.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="network" className="mt-0">
              <div className="py-8 text-center">
                <h3 className="text-lg font-medium mb-2">No Network Yet</h3>
                <p className="text-muted-foreground">
                  Build your network by connecting with other users.
                </p>
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
        </Tabs>
      </Card>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell others about yourself..."
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <div className="flex gap-2">
                <Input
                  id="skills"
                  placeholder="Add a skill..."
                  value={editForm.newSkill}
                  onChange={(e) => setEditForm({...editForm, newSkill: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button type="button" onClick={addSkill} size="sm">Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {userData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => removeSkill(skill)}
                      title={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
