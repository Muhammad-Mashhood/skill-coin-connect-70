import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Calendar, BookOpen, Activity, Search } from "lucide-react";

// Define RecommendedTeachers component before Dashboard
const RecommendedTeachers = () => {
  const { currentUser } = useAuth();
  const [recommendedTeachers, setRecommendedTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get current user data to see what skills they might want
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (!userDoc.exists()) {
          setIsLoading(false);
          return;
        }
        
        const userData = userDoc.data();
        const userSkills = userData.skills || [];
        
        // Get all teachers
        const teachersQuery = query(
          collection(db, "users"),
          where("role", "==", "teacher"),
          limit(20)
        );
        
        const teachersSnapshot = await getDocs(teachersQuery);
        let teachers = teachersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          skills: doc.data().skills || [], // Ensure skills property exists
          avatar: doc.data().displayName?.split(' ').map(n => n[0]).join('') || "U",
          relevanceScore: 0
        }));
        
        // Simple recommendation algorithm
        teachers = teachers.map(teacher => {
          const teacherSkills = teacher.skills || [];
          let score = 0;
          
          teacherSkills.forEach(skill => {
            if (!userSkills.includes(skill)) {
              score += 1;
            }
          });
          
          return {
            ...teacher,
            relevanceScore: score
          };
        });
        
        teachers = teachers
          .filter(t => t.relevanceScore > 0 && t.id !== currentUser.uid)
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 4);
        
        setRecommendedTeachers(teachers);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [currentUser]);
  
  if (recommendedTeachers.length === 0 && !isLoading) {
    return null;
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Recommended for You</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-[200px] animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-muted"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-[100px] bg-muted rounded"></div>
                    <div className="h-3 w-[80px] bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedTeachers.map(teacher => (
            <Card key={teacher.id}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarFallback>{teacher.avatar}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{teacher.displayName}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {teacher.bio?.substring(0, 50)}...
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    {(teacher.skills || []).slice(0, 3).map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" asChild>
                    <Link to={`/profile/${teacher.id}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState({
    displayName: "Guest User",
    coins: 1000,
    bookings: [],
    courses: []
  });

  useEffect(() => {
    console.log("Dashboard component mounted");
    
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            displayName: currentUser.displayName || "User",
            coins: data.coins || 1000,
            bookings: data.bookings || [],
            courses: data.courses || []
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {userData.displayName}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coin Balance</CardTitle>
            <Coins className="h-4 w-4 text-skill-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.coins}</div>
            <p className="text-xs text-muted-foreground">
              {userData.coins === 1000 ? "Welcome bonus" : "Current balance"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Booking</CardTitle>
            <Calendar className="h-4 w-4 text-skill-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">No Bookings</div>
            <p className="text-xs text-muted-foreground">Find a course to book</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-skill-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 / 0</div>
            <p className="text-xs text-muted-foreground">Taught / Purchased</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-muted p-2 rounded-full">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Account created</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-muted p-2 rounded-full">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Received 1,000 coins</p>
                <p className="text-xs text-muted-foreground">Welcome bonus</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <RecommendedTeachers />
    </div>
  );
};

export default Dashboard;
