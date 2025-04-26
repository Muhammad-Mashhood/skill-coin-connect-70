
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Calendar, BookOpen, Activity } from "lucide-react";

const Dashboard = () => {
  // This would be replaced with actual Firebase Auth/Firestore hooks
  const mockUserName = "Guest User";
  
  useEffect(() => {
    console.log("Dashboard component mounted");
    // Here you would typically set up Firebase listeners
    // e.g., onSnapshot for user data, recent activity, etc.
    
    // Example:
    // const unsubscribe = onSnapshot(doc(db, "users", userId), (doc) => {
    //   setUserData(doc.data());
    // });
    // return () => unsubscribe();
    
    // This is a placeholder for Firebase integration
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {mockUserName}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coin Balance</CardTitle>
            <Coins className="h-4 w-4 text-skill-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,000</div>
            <p className="text-xs text-muted-foreground">Welcome bonus</p>
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
            {/* More activity items would be added here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
