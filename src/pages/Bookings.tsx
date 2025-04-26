
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Clock, Calendar, CheckCircle, User } from "lucide-react";

// This is a placeholder component that would be replaced with a real calendar picker
const CalendarPlaceholder = () => (
  <div className="border rounded-md p-4">
    <div className="grid grid-cols-7 gap-2 mb-4">
      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
        <div key={day} className="text-center font-medium text-sm">
          {day}
        </div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => {
        const day = i - 2; // Offset to start with previous month days
        return (
          <div
            key={i}
            className={`h-10 flex items-center justify-center rounded-md cursor-pointer text-sm
              ${day <= 0 || day > 30 ? "text-gray-300" : ""}
              ${day === 15 ? "bg-skill-purple text-white" : "hover:bg-accent"}`}
          >
            {day <= 0 ? 30 + day : day > 30 ? day - 30 : day}
          </div>
        );
      })}
    </div>
  </div>
);

const Bookings = () => {
  // In a real app, these would come from Firebase
  const upcomingBookings = [];
  const pastBookings = [{
    id: "sample",
    title: "Sample Past Session",
    teacher: "System Demo",
    date: "2023-04-20",
    time: "14:00",
    status: "completed",
    duration: 60
  }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your scheduled learning sessions
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="schedule">Schedule a Session</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-1">No Upcoming Bookings</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  You don't have any upcoming sessions scheduled. Find a teacher and book a session to get started.
                </p>
                <Button>Find Teachers</Button>
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map(booking => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  {/* Booking card content would go here */}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-4 space-y-4">
          {pastBookings.map(booking => (
            <Card key={booking.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-muted p-2 rounded-full">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{booking.title}</h4>
                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{booking.teacher}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{booking.time} ({booking.duration}m)</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-sm text-green-500 gap-1">
                    <CheckCircle size={14} />
                    <span>Completed</span>
                  </div>
                  <Button variant="outline" size="sm">View Recording</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {pastBookings.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No Past Bookings</h3>
                <p className="text-muted-foreground text-center">
                  You haven't attended any sessions yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Book a New Session</CardTitle>
              <CardDescription>
                Select a date and time to schedule a learning session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CalendarPlaceholder />
              
              <div className="bg-skill-purple/10 rounded-md p-4">
                <h4 className="font-medium text-skill-purple mb-2">How booking works:</h4>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Select a teacher from the search page</li>
                  <li>Choose an available time slot from their calendar</li>
                  <li>Confirm your booking using your coin balance</li>
                  <li>Join the session when it's time via the link provided</li>
                </ul>
              </div>
              
              <div className="flex justify-center mt-4">
                <Button>Find a Teacher</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Bookings;
