import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Type definitions for better type checking
interface UserData {
  displayName?: string;
  email?: string;
  bio?: string;
  skills: string[];
  following: number;
  followers: number;
  reviews: number;
  coins: number;
  role: string;
  pricePerHour?: number;
  createdAt?: admin.firestore.Timestamp;
  rating?: number;
}

interface CourseData {
  title: string;
  description: string;
  teacherId: string;
  price: number;
  skillTags: string[];
  videoUrl?: string;
  videoPath?: string;
  createdAt: admin.firestore.Timestamp;
  rating?: number;
  reviews?: number;
}

interface CallableContext {
  auth?: {
    uid: string;
  };
}

// When a new user is created, initialize their profile with 1000 coins
exports.createUserProfile = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  try {
    const userClaims = await admin.auth().getUser(user.uid);
    const customClaims = userClaims.customClaims || {};
    
    // Default role if not specified
    const role = customClaims.role || 'student';
    
    const userData: UserData = {
      displayName: user.displayName || 'User',
      email: user.email || '',
      bio: "I'm new to SkillCoin Connect!",
      skills: [],
      following: 0,
      followers: 0,
      reviews: 0,
      coins: 1000,
      role: role,
      pricePerHour: role === 'teacher' ? 50 : undefined,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
    };
    
    await db.collection('users').doc(user.uid).set(userData);
    
    console.log(`Created profile for user ${user.uid} with role ${role}`);
    return null;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return null;
  }
});

// Add a function to update user profile
exports.updateUserProfile = functions.https.onCall(
  async (data: { 
    bio?: string;
    displayName?: string;
    pricePerHour?: number;
  }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to update your profile.'
      );
    }
    
    const userId = context.auth.uid;
    const { bio, displayName, pricePerHour } = data;
    
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found.');
      }
      
      const updateData: Partial<UserData> = {};
      
      if (bio !== undefined) {
        updateData.bio = bio;
      }
      if (displayName !== undefined) {
        updateData.displayName = displayName;
      }
      if (pricePerHour !== undefined) {
        updateData.pricePerHour = pricePerHour;
      }
      
      await userRef.update(updateData);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error updating profile.'
      );
    }
  }
);

// Handles the coin transaction when a student purchases a course
exports.buyCourse = functions.https.onCall(async (data: { courseId: string }, context: CallableContext) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to purchase a course.'
    );
  }
  
  const { courseId } = data;
  const studentId = context.auth.uid;
  
  try {
    // Execute as a transaction to ensure data consistency
    return await db.runTransaction(async (transaction) => {
      // Get the course data
      const courseRef = db.collection('courses').doc(courseId);
      const courseDoc = await transaction.get(courseRef);
      
      if (!courseDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Course not found.');
      }
      
      const courseData = courseDoc.data() as CourseData;
      const { teacherId, price } = courseData;
      
      // Get the student data
      const studentRef = db.collection('users').doc(studentId);
      const studentDoc = await transaction.get(studentRef);
      
      if (!studentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Student not found.');
      }
      
      const studentData = studentDoc.data() as UserData;
      if (studentData.coins < price) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Insufficient coins to purchase this course.'
        );
      }
      
      // Get the teacher data
      const teacherRef = db.collection('users').doc(teacherId);
      const teacherDoc = await transaction.get(teacherRef);
      
      if (!teacherDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Teacher not found.');
      }
      
      // Update student's coins (decrease)
      transaction.update(studentRef, {
        coins: admin.firestore.FieldValue.increment(-price)
      });
      
      // Update teacher's coins (increase)
      transaction.update(teacherRef, {
        coins: admin.firestore.FieldValue.increment(price)
      });
      
      // Create a purchase record
      const purchaseId = `${studentId}_${courseId}`;
      const purchaseRef = db.collection('purchases').doc(purchaseId);
      transaction.set(purchaseRef, {
        studentId,
        teacherId,
        courseId,
        price,
        purchaseDate: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        purchaseId,
        message: 'Course purchased successfully!'
      };
    });
  } catch (error) {
    console.error('Transaction error:', error);
    throw new functions.https.HttpsError(
      'aborted',
      error instanceof Error ? error.message : 'The transaction was aborted.'
    );
  }
});

// Function to generate a signed URL for course video access
exports.getVideoAccessUrl = functions.https.onCall(async (data: { courseId: string }, context: CallableContext) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to access videos.'
    );
  }
  
  const { courseId } = data;
  const userId = context.auth.uid;
  
  // Check if the user has purchased this course
  const purchaseId = `${userId}_${courseId}`;
  const purchaseDoc = await db.collection('purchases').doc(purchaseId).get();
  
  if (!purchaseDoc.exists) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You have not purchased this course.'
    );
  }
  
  // Get the course to find the video path
  const courseDoc = await db.collection('courses').doc(courseId).get();
  
  if (!courseDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Course not found.');
  }
  
  const courseData = courseDoc.data() as CourseData;
  const { videoPath } = courseData;
  
  // Generate a signed URL for the video that expires in 1 hour
  const bucket = admin.storage().bucket();
  if (!videoPath) {
    throw new functions.https.HttpsError('invalid-argument', 'Video path is required.');
  }
  const file = bucket.file(videoPath);
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000 // 1 hour
  });
  
  return { url };
});

/**
 * Cloud function to get personalized teacher recommendations for a user
 * Analyzes skills gap and finds teachers who can teach what the user might want to learn
 */
exports.getTeacherRecommendations = functions.https.onCall(
  async (data: { limit?: number }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to get recommendations.'
      );
    }

    const userId = context.auth.uid;
    const { limit = 4 } = data || {};
    
    try {
      // Get current user's skills
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found.');
      }
      
      const userData = userDoc.data() as UserData;
      const userSkills = userData.skills || [];
      
      // Get teachers with popularity data (by review count, followers)
      const teachersQuery = await db.collection('users')
        .where('role', '==', 'teacher')
        .limit(50)  // Get a reasonable pool of teachers to analyze
        .get();
      
      // Transform and score teachers
      let recommendations = teachersQuery.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as UserData),
          relevanceScore: 0  // Initial score
        }))
        .filter(teacher => teacher.id !== userId);  // Filter out the current user
        
      // Score teachers based on complementary skills (those the user doesn't have)
      recommendations = recommendations.map(teacher => {
        const teacherSkills = teacher.skills || [];
        let relevanceScore = 0;
        
        // Score based on skills the teacher has that user doesn't
        teacherSkills.forEach(skill => {
          if (!userSkills.includes(skill)) {
            relevanceScore += 2;  // Base score for new skill
            
            // Boost popular teachers with higher review counts
            if (teacher.reviews > 5) {
              relevanceScore += 1;
            }
            
            // Boost teachers with high follower counts
            if (teacher.followers > 10) {
              relevanceScore += 1;
            }
          }
        });
        
        // Slight score for users with same skills (peer learning)
        teacherSkills.forEach(skill => {
          if (userSkills.includes(skill)) {
            relevanceScore += 0.5;  // Smaller score for shared skills
          }
        });
        
        return {
          ...teacher,
          relevanceScore
        };
      });
      
      // Filter teachers with relevant skills and sort by score
      recommendations = recommendations
        .filter(t => t.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);  // Take only the requested number
        
      return { recommendations };
      
    } catch (error) {
      console.error('Error getting teacher recommendations:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error fetching recommendations.'
      );
    }
  }
);

interface SkillsQueryResult {
  wantsSkills: string[];
  hasSkills: string[];
  originalQuery: string;
}

/**
 * Processes a natural language search query for skills
 * Extracts what skills a user wants to learn vs. already knows
 */
exports.processSkillQuery = functions.https.onCall(
  async (data: { query: string }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to search.'
      );
    }
    
    const { query } = data;
    
    if (!query || typeof query !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Search query must be a valid string.'
      );
    }
    
    try {
      // Define patterns to match skills a user wants to learn
      const wantPatterns = [
        /I want to learn (.*?)(?:and|,|$|\.)/i,
        /looking for (.*?)(?:lessons|tutoring|teaching|skills|and|,|$|\.)/i,
        /need help with (.*?)(?:and|,|$|\.)/i,
        /interested in (.*?)(?:and|,|$|\.)/i,
        /how to (.*?)(?:and|,|$|\.)/i
      ];
      
      // Define patterns to match skills a user already has
      const hasPatterns = [
        /I have (.*?)(?:skills|knowledge|experience|and|,|$|\.)/i,
        /I know (.*?)(?:and|,|$|\.)/i,
        /I'm good at (.*?)(?:and|,|$|\.)/i,
        /skilled in (.*?)(?:and|,|$|\.)/i,
        /I can (.*?)(?:and|,|$|\.)/i
      ];
      
      const result: SkillsQueryResult = {
        wantsSkills: extractSkills(query, wantPatterns),
        hasSkills: extractSkills(query, hasPatterns),
        originalQuery: query
      };
      
      return result;
    } catch (error) {
      console.error('Error processing skill query:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error processing your search query.'
      );
    }
  }
);

interface SearchTeachersParams {
  query?: string;
  priceRange?: [number, number];
  skills?: string[];
  limit?: number;
}

interface TeacherSearchResult {
  id: string;
  displayName?: string;
  bio?: string;
  skills: string[];
  pricePerHour?: number;
  reviews: number;
  followers: number;
  avatar: string;
  matchScore: number;
}

/**
 * Search for teachers based on multiple criteria including skill matching
 */
exports.searchTeachers = functions.https.onCall(
  async (data: SearchTeachersParams, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to search.'
      );
    }
    
    const { 
      query = '', 
      priceRange = [0, 1000], 
      skills = [],
      limit = 20 
    } = data;
    
    try {
      // Process the natural language query if provided
      let parsedSkills = { wantsSkills: [] as string[], hasSkills: [] as string[] };
      if (query && query.trim()) {
        const wantPatterns = [
          /I want to learn (.*?)(?:and|,|$|\.)/i,
          /looking for (.*?)(?:lessons|tutoring|teaching|skills|and|,|$|\.)/i,
          /need help with (.*?)(?:and|,|$|\.)/i,
          /interested in (.*?)(?:and|,|$|\.)/i,
          /how to (.*?)(?:and|,|$|\.)/i
        ];
        
        const hasPatterns = [
          /I have (.*?)(?:skills|knowledge|experience|and|,|$|\.)/i,
          /I know (.*?)(?:and|,|$|\.)/i,
          /I'm good at (.*?)(?:and|,|$|\.)/i,
          /skilled in (.*?)(?:and|,|$|\.)/i,
          /I can (.*?)(?:and|,|$|\.)/i
        ];
        
        parsedSkills = {
          wantsSkills: extractSkills(query, wantPatterns),
          hasSkills: extractSkills(query, hasPatterns)
        };
      }
      
      // Get all teachers
      const teachersQuery = await db.collection('users')
        .where('role', '==', 'teacher')
        .limit(100)  // Get a reasonable initial pool
        .get();
      
      // Process and score search results
      let teachers = teachersQuery.docs.map(doc => {
        const data = doc.data() as UserData;
        return {
          id: doc.id,
          ...data,
          avatar: data.displayName?.split(' ').map((n: string) => n[0]).join('') || "U",
          matchScore: 0
        } as TeacherSearchResult;
      });
      
      // Score all teachers for skill match
      teachers = teachers.map(teacher => {
        let score = 0;
        const teacherSkills = teacher.skills || [];
        
        // High priority: Match what user wants to learn with teacher's skills
        parsedSkills.wantsSkills.forEach(wantSkill => {
          teacherSkills.forEach(teacherSkill => {
            // Direct match
            if (teacherSkill.toLowerCase().includes(wantSkill.toLowerCase())) {
              score += 5;  // High score for direct match
            }
          });
        });
        
        // Match regular query terms with teacher skills
        if (query) {
          const normalizedQuery = query.toLowerCase();
          teacherSkills.forEach(skill => {
            if (normalizedQuery.includes(skill.toLowerCase())) {
              score += 3;  // Good score for keyword match
            }
          });
          
          // Match also bio and name for general relevance
          if (teacher.bio && teacher.bio.toLowerCase().includes(normalizedQuery)) {
            score += 1;
          }
          if (teacher.displayName && teacher.displayName.toLowerCase().includes(normalizedQuery)) {
            score += 2;
          }
        }
        
        return {
          ...teacher,
          matchScore: score
        };
      });
      
      // Apply filters
      teachers = teachers.filter(teacher => {
        // Price filter
        const teacherPrice = teacher.pricePerHour || 0;
        if (teacherPrice < priceRange[0] || teacherPrice > priceRange[1]) {
          return false;
        }
        
        // Skill filter (if specific skills were requested)
        if (skills.length > 0) {
          const teacherSkills = teacher.skills || [];
          const hasRequestedSkill = skills.some(skill => 
            teacherSkills.some(teacherSkill => 
              teacherSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          if (!hasRequestedSkill) return false;
        }
        
        return true;
      });
      
      // Sort by match score and limit results
      if (query.trim() || parsedSkills.wantsSkills.length > 0) {
        teachers = teachers
          .filter(t => t.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore);
      }
      
      teachers = teachers.slice(0, limit);
      
      return { 
        teachers,
        parsedSkills,
        totalResults: teachers.length
      };
      
    } catch (error) {
      console.error('Error searching teachers:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error processing your search.'
      );
    }
  }
);

/**
 * Helper function to extract skills from text using an array of regex patterns
 */
function extractSkills(text: string, patterns: RegExp[]): string[] {
  const skills: string[] = [];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      const extracted = matches[1].split(/,|and/).map(s => s.trim().toLowerCase());
      skills.push(...extracted.filter(s => s));
    }
  });
  
  // Remove duplicates
  return [...new Set(skills)];
}

interface BookingParams {
  teacherId: string;
  dateTime: string;
  durationMinutes?: number;
  pricePerHour: number;
}

// Define the booking data interface
interface BookingData {
  studentId: string;
  teacherId: string;
  dateTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingLink: string;
  createdAt: admin.firestore.Timestamp;
}

/**
 * Create a booking between student and teacher
 * Handles scheduling logic and coin transaction
 */
exports.createBooking = functions.https.onCall(
  async (data: BookingParams, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to create a booking.'
      );
    }
    
    const studentId = context.auth.uid;
    const { 
      teacherId, 
      dateTime, // ISO string
      durationMinutes = 60,
      pricePerHour 
    } = data;
    
    if (!teacherId || !dateTime || !pricePerHour) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required booking information.'
      );
    }
    
    try {
      return await db.runTransaction(async (transaction) => {
        // Calculate total price based on duration
        const totalPrice = Math.ceil(pricePerHour * (durationMinutes / 60));
        
        // Get student data
        const studentRef = db.collection('users').doc(studentId);
        const studentDoc = await transaction.get(studentRef);
        
        if (!studentDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Student not found.');
        }
        
        const studentData = studentDoc.data() as UserData;
        if (studentData.coins < totalPrice) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Insufficient coins for this booking.'
          );
        }
        
        // Get teacher data and check availability
        const teacherRef = db.collection('users').doc(teacherId);
        const teacherDoc = await transaction.get(teacherRef);
        
        if (!teacherDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Teacher not found.');
        }
        
        // Check if the slot is available
        const bookingsQuery = await db.collection('bookings')
          .where('teacherId', '==', teacherId)
          .where('dateTime', '==', dateTime)
          .get();
          
        if (!bookingsQuery.empty) {
          throw new functions.https.HttpsError(
            'already-exists',
            'This time slot is already booked.'
          );
        }
        
        // Create the booking
        const bookingId = `${studentId}_${teacherId}_${new Date(dateTime).getTime()}`;
        const bookingRef = db.collection('bookings').doc(bookingId);
        
        // Transfer coins from student to teacher
        transaction.update(studentRef, {
          coins: admin.firestore.FieldValue.increment(-totalPrice)
        });
        
        transaction.update(teacherRef, {
          coins: admin.firestore.FieldValue.increment(totalPrice)
        });
        
        // Save booking details
        transaction.set(bookingRef, {
          studentId,
          teacherId,
          dateTime,
          endTime: new Date(new Date(dateTime).getTime() + durationMinutes * 60000).toISOString(),
          durationMinutes,
          totalPrice,
          status: 'scheduled',
          meetingLink: `https://meet.skillcoin.app/${bookingId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return {
          success: true,
          bookingId,
          totalPrice,
          message: 'Session booked successfully!'
        };
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new functions.https.HttpsError(
        'aborted',
        error instanceof Error ? error.message : 'Failed to create booking.'
      );
    }
  }
);

/**
 * Adds skills to a user profile
 */
exports.addUserSkill = functions.https.onCall(
  async (data: { skill: string }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in.'
      );
    }
    
    const userId = context.auth.uid;
    const { skill } = data;
    
    if (!skill || typeof skill !== 'string' || skill.trim() === '') {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'A valid skill name is required.'
      );
    }
    
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found.');
      }
      
      await userRef.update({
        skills: admin.firestore.FieldValue.arrayUnion(skill.trim())
      });
      
      return {
        success: true,
        message: 'Skill added successfully.'
      };
    } catch (error) {
      console.error('Error adding skill:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to add skill.'
      );
    }
  }
);

/**
 * Removes skills from a user profile
 */
exports.removeUserSkill = functions.https.onCall(
  async (data: { skill: string }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in.'
      );
    }
    
    const userId = context.auth.uid;
    const { skill } = data;
    
    if (!skill || typeof skill !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'A valid skill name is required.'
      );
    }
    
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found.');
      }
      
      await userRef.update({
        skills: admin.firestore.FieldValue.arrayRemove(skill)
      });
      
      return {
        success: true,
        message: 'Skill removed successfully.'
      };
    } catch (error) {
      console.error('Error removing skill:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to remove skill.'
      );
    }
  }
);

// Function to create a new course
exports.createCourse = functions.https.onCall(
  async (data: {
    title: string;
    description: string;
    price: number;
    skillTags: string[];
    videoUrl?: string | null;
  }, context: functions.https.CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to create a course.'
      );
    }
    
    const teacherId = context.auth.uid;
    const { title, description, price, skillTags, videoUrl } = data;
    
    try {
      // Check if user exists and is a teacher
      const userRef = db.collection('users').doc(teacherId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }
      
      // Create the course
      const courseData = {
        title,
        description,
        teacherId,
        price: Number(price),
        skillTags,
        videoUrl: videoUrl || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        rating: 0,
        reviews: 0
      };
      
      const courseRef = await db.collection('courses').add(courseData);
      
      // Update the user's courses array
      await userRef.update({
        courses: admin.firestore.FieldValue.arrayUnion(courseRef.id)
      });
      
      return {
        success: true,
        courseId: courseRef.id
      };
    } catch (error) {
      console.error('Error creating course:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error creating course.'
      );
    }
  }
);

// Function to upload a video file (this sets the videoPath after upload)
exports.updateCourseVideo = functions.https.onCall(
  async (data: {
    courseId: string;
    videoPath: string;
  }, context: functions.https.CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to update a course.'
      );
    }
    
    const userId = context.auth.uid;
    const { courseId, videoPath } = data;
    
    try {
      const courseRef = db.collection('courses').doc(courseId);
      const courseDoc = await courseRef.get();
      
      if (!courseDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Course not found.');
      }
      
      const courseData = courseDoc.data();
      if (courseData.teacherId !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You can only update your own courses.'
        );
      }
      
      await courseRef.update({ videoPath });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating course video:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error updating course video.'
      );
    }
  }
);

// Function to get courses for the current user (as student or teacher)
exports.getUserCourses = functions.https.onCall(
  async (data: { role?: 'student' | 'teacher' }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to view courses.'
      );
    }
    
    const userId = context.auth.uid;
    const { role = 'student' } = data;
    
    try {
      let courses: Array<{ id: string; [key: string]: any }> = [];
      
      if (role === 'teacher') {
        // Get courses taught by this user
        const coursesQuery = await db.collection('courses')
          .where('teacherId', '==', userId)
          .get();
          
        courses = coursesQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Get courses purchased by this user
        const purchasesQuery = await db.collection('purchases')
          .where('studentId', '==', userId)
          .get();
          
        const courseIds = purchasesQuery.docs.map(doc => doc.data().courseId as string);
        
        // Get the actual course data
        if (courseIds.length > 0) {
          // Firestore doesn't support array contains with more than 10 items
          // so we need to chunk the query
          const chunkedIds: string[][] = [];
          for (let i = 0; i < courseIds.length; i += 10) {
            chunkedIds.push(courseIds.slice(i, i + 10));
          }
          
          for (const chunk of chunkedIds) {
            const coursesQuery = await db.collection('courses')
              .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
              .get();
              
            courses.push(...coursesQuery.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              purchased: true
            })));
          }
        }
      }
      
      return { courses };
    } catch (error) {
      console.error('Error getting user courses:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error getting user courses.'
      );
    }
  }
);

// Function to get user bookings
exports.getUserBookings = functions.https.onCall(
  async (data: { role?: 'student' | 'teacher' }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to view bookings.'
      );
    }
    
    const userId = context.auth.uid;
    const { role = 'student' } = data;
    
    try {
      // Query based on role
      const fieldToQuery = role === 'student' ? 'studentId' : 'teacherId';
      const bookingsQuery = await db.collection('bookings')
        .where(fieldToQuery, '==', userId)
        .get();
        
      // Get bookings
      const bookings = bookingsQuery.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as BookingData)
      }));
      
      // Get user data for participants
      const userIds = new Set<string>();
      bookings.forEach(booking => {
        userIds.add(booking.studentId);
        userIds.add(booking.teacherId);
      });
      
      const userDataMap: Record<string, { displayName: string; avatar: string }> = {};
      for (const id of userIds) {
        const userDoc = await db.collection('users').doc(id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userDataMap[id] = {
            displayName: userData?.displayName || 'User',
            avatar: userData?.displayName?.split(' ').map((n: string) => n[0]).join('') || "U"
          };
        }
      }
      
      // Add user data to bookings
      const bookingsWithUserData = bookings.map(booking => ({
        ...booking,
        studentName: userDataMap[booking.studentId]?.displayName || 'User',
        studentAvatar: userDataMap[booking.studentId]?.avatar || 'U',
        teacherName: userDataMap[booking.teacherId]?.displayName || 'Teacher',
        teacherAvatar: userDataMap[booking.teacherId]?.avatar || 'T'
      }));
      
      return { bookings: bookingsWithUserData };
    } catch (error) {
      console.error('Error getting bookings:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error getting bookings.'
      );
    }
  }
);

// Function to update booking status
exports.updateBookingStatus = functions.https.onCall(
  async (data: { bookingId: string; status: 'completed' | 'cancelled' }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to update a booking.'
      );
    }
    
    const userId = context.auth.uid;
    const { bookingId, status } = data;
    
    try {
      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (!bookingDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Booking not found.');
      }
      
      const bookingData = bookingDoc.data() as BookingData;
      
      // Only the student or teacher can update the booking
      if (bookingData.studentId !== userId && bookingData.teacherId !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You can only update your own bookings.'
        );
      }
      
      // If cancelling, handle refund (only if not completed and cancelled by student)
      if (status === 'cancelled' && 
          bookingData.status !== 'completed' && 
          userId === bookingData.studentId) {
        
        // Use a transaction to ensure data consistency
        await db.runTransaction(async (transaction) => {
          // Refund coins to student
          const studentRef = db.collection('users').doc(bookingData.studentId);
          transaction.update(studentRef, {
            coins: admin.firestore.FieldValue.increment(bookingData.totalPrice)
          });
          
          // Deduct coins from teacher
          const teacherRef = db.collection('users').doc(bookingData.teacherId);
          transaction.update(teacherRef, {
            coins: admin.firestore.FieldValue.increment(-bookingData.totalPrice)
          });
          
          // Update booking status
          transaction.update(bookingRef, { status });
        });
        
        return { success: true, refunded: true };
      } else {
        // Just update the status
        await bookingRef.update({ status });
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error updating booking status.'
      );
    }
  }
);

// Define the review data interface
interface ReviewData {
  courseId?: string;
  teacherId: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: admin.firestore.Timestamp;
}

// Function to create a review
exports.createReview = functions.https.onCall(
  async (data: {
    teacherId: string;
    courseId?: string;
    rating: number;
    comment: string;
  }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to leave a review.'
      );
    }
    
    const studentId = context.auth.uid;
    const { teacherId, courseId, rating, comment } = data;
    
    try {
      // Verify the user has purchased the course or had a session with the teacher
      let hasInteraction = false;
      
      if (courseId) {
        const purchaseId = `${studentId}_${courseId}`;
        const purchaseDoc = await db.collection('purchases').doc(purchaseId).get();
        hasInteraction = purchaseDoc.exists;
      } else {
        // Check for completed bookings with this teacher
        const bookingsQuery = await db.collection('bookings')
          .where('studentId', '==', studentId)
          .where('teacherId', '==', teacherId)
          .where('status', '==', 'completed')
          .limit(1)
          .get();
          
        hasInteraction = !bookingsQuery.empty;
      }
      
      if (!hasInteraction) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'You can only review teachers you have interacted with.'
        );
      }
      
      // Create the review
      const reviewData: ReviewData = {
        teacherId,
        studentId,
        courseId,
        rating: Math.min(5, Math.max(1, rating)), // Ensure rating is between 1-5
        comment,
        createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
      };
      
      const reviewRef = await db.collection('reviews').add(reviewData);
      
      // Update the teacher's average rating
      const teacherRef = db.collection('users').doc(teacherId);
      await db.runTransaction(async (transaction) => {
        const teacherDoc = await transaction.get(teacherRef);
        
        if (!teacherDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Teacher not found.');
        }
        
        const teacherData = teacherDoc.data() as UserData;
        const currentReviews = teacherData.reviews || 0;
        const currentRating = teacherData.rating || 0;
        
        // Calculate new average
        const newReviews = currentReviews + 1;
        const newRating = ((currentRating * currentReviews) + rating) / newReviews;
        
        transaction.update(teacherRef, {
          reviews: newReviews,
          rating: newRating
        });
        
        // If this is a course review, update the course rating too
        if (courseId) {
          const courseRef = db.collection('courses').doc(courseId);
          const courseDoc = await transaction.get(courseRef);
          
          if (courseDoc.exists) {
            const courseData = courseDoc.data() as CourseData;
            const currentCourseReviews = courseData.reviews || 0;
            const currentCourseRating = courseData.rating || 0;
            
            const newCourseReviews = currentCourseReviews + 1;
            const newCourseRating = ((currentCourseRating * currentCourseReviews) + rating) / newCourseReviews;
            
            transaction.update(courseRef, {
              reviews: newCourseReviews,
              rating: newCourseRating
            });
          }
        }
      });
      
      return {
        success: true,
        reviewId: reviewRef.id
      };
    } catch (error) {
      console.error('Error creating review:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error creating review.'
      );
    }
  }
);

interface ReviewWithStudent extends ReviewData {
  id: string;
  studentName: string;
  studentAvatar: string;
}

// Function to get reviews for a teacher
exports.getTeacherReviews = functions.https.onCall(
  async (data: { teacherId: string }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to view reviews.'
      );
    }
    
    const { teacherId } = data;
    
    try {
      const reviewsQuery = await db.collection('reviews')
        .where('teacherId', '==', teacherId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
        
      const reviews = reviewsQuery.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as ReviewData)
      }));
      
      // Get student names for the reviews
      const studentIds = reviews.map(review => review.studentId);
      const uniqueStudentIds = [...new Set(studentIds)];
      
      const studentDataMap: Record<string, { displayName: string; avatar: string }> = {};
      for (const id of uniqueStudentIds) {
        const userDoc = await db.collection('users').doc(id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          studentDataMap[id] = {
            displayName: userData?.displayName || 'Student',
            avatar: userData?.displayName?.split(' ').map((n: string) => n[0]).join('') || "U"
          };
        }
      }
      
      // Add student data to reviews
      const reviewsWithStudentData = reviews.map(review => ({
        ...review,
        studentName: studentDataMap[review.studentId]?.displayName || 'Student',
        studentAvatar: studentDataMap[review.studentId]?.avatar || 'S'
      })) as ReviewWithStudent[];
      
      return { reviews: reviewsWithStudentData };
    } catch (error) {
      console.error('Error getting teacher reviews:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error getting teacher reviews.'
      );
    }
  }
);

// Function to follow/unfollow a teacher
exports.toggleFollowTeacher = functions.https.onCall(
  async (data: { teacherId: string; follow: boolean }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to follow teachers.'
      );
    }
    
    const studentId = context.auth.uid;
    const { teacherId, follow } = data;
    
    // Can't follow yourself
    if (studentId === teacherId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'You cannot follow yourself.'
      );
    }
    
    try {
      // Run a transaction to ensure data consistency
      await db.runTransaction(async (transaction) => {
        // Check if teacher exists
        const teacherRef = db.collection('users').doc(teacherId);
        const teacherDoc = await transaction.get(teacherRef);
        
        if (!teacherDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Teacher not found.');
        }
        
        // Check if student exists
        const studentRef = db.collection('users').doc(studentId);
        const studentDoc = await transaction.get(studentRef);
        
        if (!studentDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Student not found.');
        }
        
        // Get the follow document
        const followId = `${studentId}_${teacherId}`;
        const followRef = db.collection('follows').doc(followId);
        const followDoc = await transaction.get(followRef);
        
        if (follow && !followDoc.exists) {
          // Create follow relationship
          transaction.set(followRef, {
            studentId,
            teacherId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Increment counters
          transaction.update(teacherRef, {
            followers: admin.firestore.FieldValue.increment(1)
          });
          
          transaction.update(studentRef, {
            following: admin.firestore.FieldValue.increment(1)
          });
        } else if (!follow && followDoc.exists) {
          // Remove follow relationship
          transaction.delete(followRef);
          
          // Decrement counters
          transaction.update(teacherRef, {
            followers: admin.firestore.FieldValue.increment(-1)
          });
          
          transaction.update(studentRef, {
            following: admin.firestore.FieldValue.increment(-1)
          });
        }
      });
      
      return {
        success: true,
        isFollowing: follow
      };
    } catch (error) {
      console.error('Error toggling follow status:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error updating follow status.'
      );
    }
  }
);

// Function to check if user is following a teacher
exports.getFollowStatus = functions.https.onCall(
  async (data: { teacherId: string }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to check follow status.'
      );
    }
    
    const studentId = context.auth.uid;
    const { teacherId } = data;
    
    try {
      const followId = `${studentId}_${teacherId}`;
      const followDoc = await db.collection('follows').doc(followId).get();
      
      return {
        isFollowing: followDoc.exists
      };
    } catch (error) {
      console.error('Error checking follow status:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error checking follow status.'
      );
    }
  }
);

interface FollowData {
  studentId: string;
  teacherId: string;
  createdAt: admin.firestore.Timestamp;
}

// Function to get followers or following
exports.getFollowList = functions.https.onCall(
  async (data: { userId: string; type: 'followers' | 'following' }, context: CallableContext) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to view followers/following.'
      );
    }
    
    const { userId, type } = data;
    
    try {
      // Query based on type
      const queryField = type === 'followers' ? 'teacherId' : 'studentId';
      const resultField = type === 'followers' ? 'studentId' : 'teacherId';
      
      const followsQuery = await db.collection('follows')
        .where(queryField, '==', userId)
        .limit(50)
        .get();
        
      const userIds = followsQuery.docs.map(doc => (doc.data() as FollowData)[resultField as keyof FollowData] as string);
      
      // Get user data for each ID
      const users: Array<{
        id: string;
        displayName?: string;
        bio?: string;
        role: string;
        avatar: string;
      }> = [];
      for (const id of userIds) {
        const userDoc = await db.collection('users').doc(id).get();
        if (userDoc.exists) {
          const userData = userDoc.data() as UserData;
          users.push({
            id,
            displayName: userData.displayName,
            bio: userData.bio,
            role: userData.role,
            avatar: userData.displayName?.split(' ').map((n: string) => n[0]).join('') || "U"
          });
        }
      }
      
      return { users };
    } catch (error) {
      console.error(`Error getting ${data.type}:`, error);
      throw new functions.https.HttpsError(
        'internal',
        `Error getting ${data.type}.`
      );
    }
  }
);

// 1. listMyCourses function - simple version of getUserCourses
exports.listMyCourses = functions.https.onCall(async (data, context: CallableContext) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to view your courses.'
    );
  }
  
  const teacherId = context.auth.uid;
  
  try {
    const coursesQuery = await db.collection('courses')
      .where('teacherId', '==', teacherId)
      .get();
      
    const courses = coursesQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { courses };
  } catch (error) {
    console.error('Error listing courses:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error listing courses.'
    );
  }
});

// 2. searchCourses function - simple search by skill tags or title
exports.searchCourses = functions.https.onCall(async (data: { query: string }, context: CallableContext) => {
  const { query } = data;
  
  try {
    // First search by skill tags (array-contains)
    const skillQuery = await db.collection('courses')
      .where('skillTags', 'array-contains', query.toLowerCase())
      .limit(20)
      .get();
      
    let results = skillQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      matchType: 'skill'
    }));
    
    // If we have fewer than 20 results, also search by title
    if (results.length < 20) {
      // Note: This is a simple implementation. Ideally, you'd use Algolia or 
      // a similar service for proper text search
      const titleQuery = await db.collection('courses')
        .orderBy('title')
        .startAt(query)
        .endAt(query + '\uf8ff')
        .limit(20 - results.length)
        .get();
        
      const titleResults = titleQuery.docs
        .filter(doc => !results.some(r => r.id === doc.id)) // Remove duplicates
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          matchType: 'title'
        }));
        
      results = [...results, ...titleResults];
    }
    
    return { courses: results };
  } catch (error) {
    console.error('Error searching courses:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error searching courses.'
    );
  }
});

// 3. getAllCourses function - list all available courses with pagination
exports.getAllCourses = functions.https.onCall(async (data: { 
  limit?: number; 
  lastVisible?: string; 
}, context: CallableContext) => {
  const { limit = 20, lastVisible } = data;
  
  try {
    let query = db.collection('courses')
      .orderBy('createdAt', 'desc')
      .limit(limit);
      
    // Apply pagination if lastVisible is provided
    if (lastVisible) {
      const lastDoc = await db.collection('courses').doc(lastVisible).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }
    
    const snapshot = await query.get();
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get the last visible document for pagination
    const lastVisibleId = snapshot.docs.length > 0 
      ? snapshot.docs[snapshot.docs.length - 1].id 
      : null;
    
    return { 
      courses, 
      lastVisible: lastVisibleId,
      hasMore: courses.length === limit
    };
  } catch (error) {
    console.error('Error getting all courses:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error getting courses.'
    );
  }
});

// 4. Function to get video access URL with signed tokens
exports.getVideoAccessUrl = functions.https.onCall(async (data: { courseId: string }, context: CallableContext) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to access videos.'
    );
  }
  
  const { courseId } = data;
  const userId = context.auth.uid;
  
  // Check if the user has purchased this course
  const purchaseId = `${userId}_${courseId}`;
  const purchaseDoc = await db.collection('purchases').doc(purchaseId).get();
  
  if (!purchaseDoc.exists) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You have not purchased this course.'
    );
  }
  
  // Get the course to find the video path
  const courseDoc = await db.collection('courses').doc(courseId).get();
  
  if (!courseDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Course not found.');
  }
  
  const courseData = courseDoc.data() as CourseData;
  const { videoPath } = courseData;
  
  // Generate a signed URL for the video that expires in 1 hour
  const bucket = admin.storage().bucket();
  if (!videoPath) {
    throw new functions.https.HttpsError('invalid-argument', 'Video path is required.');
  }
  const file = bucket.file(videoPath);
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000 // 1 hour
  });
  
  return { url };
});

// 5. Function to handle logout (typically handled client-side, but useful for cleanup)
exports.logoutUser = functions.https.onCall(async (data, context: CallableContext) => {
  if (!context?.auth) {
    // Already logged out
    return { success: true };
  }
  
  const userId = context.auth.uid;
  
  try {
    // Update user's last seen
    await db.collection('users').doc(userId).update({
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error during logout:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error processing logout.'
    );
  }
});

// 6. Schedule function to send booking reminders using Pub/Sub
exports.scheduleBookingReminders = functions.pubsub.schedule('every 15 minutes').onRun(async (context) => {
  const now = new Date();
  const in15Minutes = new Date(now.getTime() + 15 * 60000);
  const in15MinutesISO = in15Minutes.toISOString();
  
  try {
    // Find bookings that start in the next 15 minutes
    const bookingsQuery = await db.collection('bookings')
      .where('status', '==', 'scheduled')
      .where('dateTime', '>=', now.toISOString())
      .where('dateTime', '<=', in15MinutesISO)
      .get();
      
    const batch = db.batch();
    let count = 0;
    
    bookingsQuery.docs.forEach(doc => {
      const booking = doc.data() as BookingData;
      
      // In a real app, you would send an email or push notification here
      // For this example, we'll just mark the booking as reminded
      batch.update(doc.ref, { 
        reminderSent: true, 
        reminderTime: admin.firestore.FieldValue.serverTimestamp() 
      });
      count++;
    });
    
    if (count > 0) {
      await batch.commit();
      console.log(`Sent ${count} booking reminders`);
    }
    
    return null;
  } catch (error) {
    console.error('Error sending booking reminders:', error);
    return null;
  }
});