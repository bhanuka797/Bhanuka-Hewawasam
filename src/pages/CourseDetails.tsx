import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, orderBy, query, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PlayCircle, Lock, CheckCircle2, Info, MessageCircle, ArrowLeft, Play, BookOpen, Clock, Star, HelpCircle, ArrowRight, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const CourseDetails: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { profile, isAdmin } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [gradeName, setGradeName] = useState<string>('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [receipt, setReceipt] = useState<string>('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const navigate = useNavigate();

  const isEnrolled = profile?.enrolledCourses?.includes(courseId) || isAdmin;

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      
      const courseSnap = await getDoc(doc(db, 'courses', courseId));
      if (courseSnap.exists()) {
        const courseData = { id: courseSnap.id, ...courseSnap.data() } as any;
        setCourse(courseData);
        
        // Fetch grade name
        const gradesSnap = await getDocs(query(collection(db, 'grades'), where('level', '==', courseData.grade)));
        if (!gradesSnap.empty) {
          setGradeName(gradesSnap.docs[0].data().name);
        } else {
          setGradeName(`Grade ${courseData.grade}`);
        }

        // Fetch lessons
        const lessonsQuery = query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc'));
        const lessonsSnap = await getDocs(lessonsQuery);
        setLessons(lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch quizzes
        const quizzesSnap = await getDocs(collection(db, 'courses', courseId, 'quizzes'));
        setQuizzes(quizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch progress if enrolled
        if (profile?.uid) {
          const progressId = `${profile.uid}_${courseId}`;
          const progressSnap = await getDoc(doc(db, 'progress', progressId));
          if (progressSnap.exists()) {
            setProgress(progressSnap.data());
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [courseId, profile]);

  const handleEnrollRequest = async () => {
    if (!profile || !courseId) return;
    if (course.price > 0 && !receipt) {
      return toast.error('Please upload your payment receipt');
    }
    setRequesting(true);
    try {
      await addDoc(collection(db, 'accessRequests'), {
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        courseId: courseId,
        courseTitle: course.title,
        status: 'pending',
        receipt: receipt || null,
        createdAt: serverTimestamp(),
      });
      toast.success('Access request sent! Please contact the teacher for payment confirmation.');
      setIsRequestDialogOpen(false);
    } catch (error) {
      console.error('Request failed', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800000) {
      return toast.error('Receipt image is too large (max 800KB)');
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceipt(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading course content...</p>
    </div>
  );
  
  if (!course) return <div className="py-20 text-center">Course not found.</div>;

  const completedCount = progress?.completedLessons?.length || 0;
  const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 hover:bg-slate-100 rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Course Info & Lessons */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {gradeName}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-slate-200">
                  {course.language}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {course.title}
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                {course.description}
              </p>
            </div>

            {isEnrolled && (
              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h3 className="font-bold text-blue-900">Your Progress</h3>
                    <p className="text-sm text-blue-700">{completedCount} of {lessons.length} lessons completed</p>
                  </div>
                  <span className="text-2xl font-black text-blue-600">{percent}%</span>
                </div>
                <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>
            )}
          </motion.div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Course Lessons
              </h2>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                {lessons.length} Total Lessons
              </Badge>
            </div>

            <div className="grid gap-3">
              {lessons.map((lesson, index) => {
                const isCompleted = progress?.completedLessons?.includes(lesson.id);
                return (
                  <motion.div 
                    key={lesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
                      isEnrolled 
                        ? 'bg-white hover:border-blue-400 hover:shadow-md cursor-pointer' 
                        : 'bg-slate-50 border-slate-100 opacity-80'
                    } ${isCompleted ? 'border-green-100' : 'border-slate-100'}`}
                    onClick={() => isEnrolled && navigate(`/course/${courseId}/lesson/${lesson.id}`)}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-lg transition-colors ${
                      isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h3 className={`font-bold text-lg truncate ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>Video Lesson</span>
                        </div>
                        {isCompleted && (
                          <Badge className="bg-green-50 text-green-600 border-none text-[10px] h-4 px-1.5 font-bold uppercase">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isEnrolled ? (
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                          <Play className="h-5 w-5 fill-current" />
                        </div>
                      ) : (
                        <Lock className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {lessons.length === 0 && (
                <div className="py-16 text-center space-y-4 border-2 border-dashed rounded-3xl bg-slate-50/50">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <p className="text-slate-500 font-medium">No lessons have been added to this course yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quizzes Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-blue-600" />
                Course Quizzes
              </h2>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                {quizzes.length} Available Quizzes
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-3xl border-2 transition-all duration-300 ${
                    isEnrolled 
                      ? 'bg-white border-slate-100 hover:border-blue-400 hover:shadow-lg cursor-pointer' 
                      : 'bg-slate-50 border-slate-100 opacity-80'
                  }`}
                  onClick={() => isEnrolled && navigate(`/course/${courseId}/quiz/${quiz.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    {isEnrolled ? (
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    ) : (
                      <Lock className="h-4 w-4 text-slate-300" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{quiz.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{quiz.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                      {quiz.questions?.length || 0} Questions
                    </Badge>
                  </div>
                </motion.div>
              ))}

              {quizzes.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
                  <p className="text-slate-500 font-medium">No quizzes available for this course yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Enrollment Card */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-24"
          >
            <Card className="overflow-hidden shadow-2xl border-none rounded-[2rem] bg-white">
              <div className="relative aspect-video bg-slate-100">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <PlayCircle className="h-16 w-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center text-blue-600 shadow-xl">
                    <Play className="h-8 w-8 fill-current ml-1" />
                  </div>
                </div>
              </div>

              <CardHeader className="p-8 pb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {course.price > 0 ? `Rs. ${course.price}` : 'Free'}
                  </span>
                  {course.price > 0 && <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">One-time</span>}
                </div>
                <CardDescription className="text-slate-500 font-medium pt-2">
                  Get full lifetime access to this course and all future updates.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8 pt-0 space-y-6">
                {isEnrolled ? (
                  <Button nativeButton={false} render={<Link to={`/course/${courseId}/lesson/${lessons[0]?.id}`} />} className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-xl font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                    <Play className="mr-2 h-6 w-6 fill-current" />
                    Start Learning
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                      <DialogTrigger render={
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-xl font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                          Enroll in Course
                        </Button>
                      } />
                      <DialogContent className="sm:max-w-md rounded-[2rem]">
                        <DialogHeader>
                          <DialogTitle>Enrollment Request</DialogTitle>
                          <DialogDescription>
                            {course.price > 0 
                              ? `This course costs Rs. ${course.price}. Please upload your payment receipt to request access.`
                              : "This course is free. Click the button below to request access."}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {course.price > 0 && (
                          <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="receipt">Payment Receipt</Label>
                              {receipt ? (
                                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-blue-100 bg-blue-50">
                                  <img src={receipt} alt="Receipt" className="w-full h-full object-contain" />
                                  <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                    onClick={() => setReceipt('')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => document.getElementById('receipt-upload')?.click()}>
                                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                  <span className="text-sm font-medium text-slate-500">Click to upload receipt</span>
                                  <input 
                                    type="file" 
                                    id="receipt-upload" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleReceiptUpload} 
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <DialogFooter>
                          <Button 
                            onClick={handleEnrollRequest} 
                            disabled={requesting || (course.price > 0 && !receipt)}
                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold rounded-xl"
                          >
                            {requesting ? 'Sending Request...' : 'Confirm Enrollment Request'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        Clicking Enroll will send an access request to the teacher. You'll be notified once approved.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 pt-2">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest">What's included:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <span>Full lifetime access</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <span>{lessons.length} HD Video Lessons</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <span>Access on mobile and desktop</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <span>Teacher support via WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <Separator className="bg-slate-100" />

                <Button variant="outline" className="w-full h-14 rounded-2xl gap-2 text-green-600 border-green-200 hover:bg-green-50 font-bold transition-all">
                  <MessageCircle className="h-5 w-5 fill-current" />
                  Chat with Teacher
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
