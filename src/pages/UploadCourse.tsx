
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload as UploadIcon } from "lucide-react";

const UploadCourse = () => {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerHour, setPricePerHour] = useState("50");
  const [skillTag, setSkillTag] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState(1);

  // Add a skill tag
  const addSkillTag = () => {
    if (skillTag.trim() && !skillTags.includes(skillTag.trim())) {
      setSkillTags([...skillTags, skillTag.trim()]);
      setSkillTag("");
    }
  };

  // Remove a skill tag
  const removeSkillTag = (tagToRemove: string) => {
    setSkillTags(skillTags.filter(tag => tag !== tagToRemove));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      // Validate first step
      if (!title || !description || skillTags.length === 0 || !pricePerHour) {
        alert("Please fill all required fields");
        return;
      }
      setStep(2);
      return;
    }
    
    // Validate second step
    if (!videoUrl && !file) {
      alert("Please provide a video URL or upload a file");
      return;
    }

    // Simulate upload progress for demo purposes
    if (file) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          alert("Course uploaded successfully!");
          // Reset form
          setTitle("");
          setDescription("");
          setPricePerHour("50");
          setSkillTags([]);
          setVideoUrl("");
          setFile(null);
          setUploadProgress(0);
          setStep(1);
        }
      }, 200);
    } else {
      // Just using YouTube URL
      alert("Course with YouTube URL added successfully!");
      // Reset form
      setTitle("");
      setDescription("");
      setPricePerHour("50");
      setSkillTags([]);
      setVideoUrl("");
      setFile(null);
      setUploadProgress(0);
      setStep(1);
    }
    
    // In a real app, this would upload to Firebase Storage and save metadata to Firestore
    // const courseData = { title, description, skillTags, pricePerHour };
    // const courseRef = await addDoc(collection(db, "courses"), courseData);
    // if (file) {
    //   const storageRef = ref(storage, `courses/${courseRef.id}`);
    //   const uploadTask = uploadBytesResumable(storageRef, file);
    //   uploadTask.on('state_changed', 
    //     (snapshot) => {
    //       const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    //       setUploadProgress(progress);
    //     },
    //     (error) => {
    //       console.error("Upload failed", error);
    //     },
    //     async () => {
    //       const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    //       await updateDoc(doc(db, "courses", courseRef.id), {
    //         videoUrl: downloadURL
    //       });
    //       // Reset form...
    //     }
    //   );
    // } else if (videoUrl) {
    //   await updateDoc(doc(db, "courses", courseRef.id), { videoUrl });
    //   // Reset form...
    // }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Upload Course</h1>
        <p className="text-muted-foreground mt-1">
          Share your knowledge and earn coins by teaching others
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>
                  Provide information about the course you want to teach
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Web Development"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what students will learn in your course..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pricePerHour">Price per Hour (coins)</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    min="1"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skillTags">Skill Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="skillTags"
                      placeholder="e.g., JavaScript"
                      value={skillTag}
                      onChange={(e) => setSkillTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillTag())}
                    />
                    <Button type="button" onClick={addSkillTag} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
                          className="ml-1 hover:text-destructive"
                          onClick={() => removeSkillTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {skillTags.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        Add at least one skill tag
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="ml-auto">
                  Next
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Upload Content</CardTitle>
                <CardDescription>
                  Upload your course video or provide a YouTube URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="youtube">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
                    <TabsTrigger value="upload">Upload Video</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="youtube" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">YouTube Video URL</Label>
                      <Input
                        id="videoUrl"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Use an unlisted YouTube video URL for best performance
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="video">Upload Video</Label>
                      <div className="border-2 border-dashed rounded-md border-muted p-8 text-center">
                        <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Drag and drop your video file here, or click to browse
                        </p>
                        <Input
                          id="video"
                          type="file"
                          accept="video/mp4,video/webm"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("video")?.click()}
                          className="mt-4"
                        >
                          Select File
                        </Button>
                        {file && (
                          <p className="mt-2 text-sm">Selected: {file.name}</p>
                        )}
                      </div>
                      
                      {uploadProgress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-skill-purple h-2 rounded-full" 
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit">
                  Upload Course
                </Button>
              </CardFooter>
            </>
          )}
        </form>
      </Card>
    </div>
  );
};

export default UploadCourse;
