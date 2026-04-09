import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronLeft, ChevronRight, PlayCircle, List, ArrowLeft, Play, Info, Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const LessonView: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { profile } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !lessonId || !profile?.uid) return;

      const courseSnap = await getDoc(doc(db, 'courses', courseId));
      const lessonSnap = await getDoc(doc(db, 'courses', courseId, 'lessons', lessonId));
      
      if (courseSnap.exists() && lessonSnap.exists()) {
        setCourse({ id: courseSnap.id, ...courseSnap.data() });
        setLesson({ id: lessonSnap.id, ...lessonSnap.data() });

        // Fetch all lessons for navigation
        const lessonsQuery = query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc'));
        const lessonsSnap = await getDocs(lessonsQuery);
        setLessons(lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch and update progress
        const progressId = `${profile.uid}_${courseId}`;
        const progressSnap = await getDoc(doc(db, 'progress', progressId));
        
        const progressUpdate = {
          lastAccessedAt: serverTimestamp(),
          lastLessonId: lessonId
        };

        if (progressSnap.exists()) {
          setProgress(progressSnap.data());
          await updateDoc(doc(db, 'progress', progressId), progressUpdate);
        } else {
          const initialProgress = { 
            userId: profile.uid, 
            courseId, 
            completedLessons: [],
            ...progressUpdate
          };
          await setDoc(doc(db, 'progress', progressId), initialProgress);
          setProgress(initialProgress);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [courseId, lessonId, profile]);

  const toggleComplete = async () => {
    if (!profile || !courseId || !lessonId) return;
    const progressId = `${profile.uid}_${courseId}`;
    const isCompleted = progress?.completedLessons?.includes(lessonId);

    try {
      await updateDoc(doc(db, 'progress', progressId), {
        completedLessons: isCompleted ? arrayRemove(lessonId) : arrayUnion(lessonId)
      });
      setProgress((prev: any) => ({
        ...prev,
        completedLessons: isCompleted 
          ? prev.completedLessons.filter((id: string) => id !== lessonId)
          : [...prev.completedLessons, lessonId]
      }));
      toast.success(isCompleted ? 'Marked as incomplete' : 'Lesson completed! Great job! 🎉');
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Preparing your lesson...</p>
    </div>
  );
  
  if (!lesson) return <div className="py-20 text-center">Lesson not found.</div>;

  const currentIndex = lessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const isCompleted = progress?.completedLessons?.includes(lessonId);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-0 overflow-hidden -m-4 md:-m-8">
      {/* Main Content: Video & Info */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
        {/* Video Player Section */}
        <div className="w-full aspect-video lg:aspect-auto lg:flex-grow relative bg-black">
          {getYouTubeId(lesson.videoUrl) ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${getYouTubeId(lesson.videoUrl)}?rel=0&modestbranding=1`}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white bg-slate-900 p-8 text-center">
              <div className="space-y-4">
                <Info className="h-12 w-12 mx-auto text-slate-500" />
                <p className="text-lg font-medium">This video lesson is currently unavailable.</p>
                <Button variant="outline" className="text-white border-white/20" onClick={() => navigate(-1)}>Go Back</Button>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Info Section */}
        <div className="bg-white p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest">
                <Star className="h-4 w-4 fill-current" />
                <span>Lesson {currentIndex + 1} of {lessons.length}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">{lesson.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2 px-6 h-14 rounded-2xl bg-green-50 text-green-600 font-bold border border-green-100">
                    <CheckCircle2 className="h-6 w-6" />
                    <span>Completed</span>
                  </div>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={toggleComplete}
                    className="h-14 px-8 rounded-2xl font-bold border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                  >
                    Mark as Incomplete
                  </Button>
                </div>
              ) : (
                <Button 
                  size="lg"
                  onClick={toggleComplete}
                  className="h-14 px-8 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all duration-300"
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 text-lg leading-relaxed">{lesson.description}</p>
          </div>

          <Separator className="bg-slate-100" />

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              size="lg"
              disabled={!prevLesson}
              onClick={() => navigate(`/course/${courseId}/lesson/${prevLesson.id}`)}
              className="rounded-2xl h-14 px-6 font-bold text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Previous Lesson</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            
            <div className="hidden md:flex items-center gap-2">
              <Button nativeButton={false} variant="outline" size="icon" render={<Link to={`/course/${courseId}`} />} className="rounded-xl h-12 w-12">
                <List className="h-5 w-5" />
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="lg"
              disabled={!nextLesson}
              onClick={() => navigate(`/course/${courseId}/lesson/${nextLesson.id}`)}
              className="rounded-2xl h-14 px-6 font-bold text-blue-600 hover:bg-blue-50"
            >
              <span className="hidden sm:inline">Next Lesson</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar: Lessons List */}
      <div className="hidden lg:flex w-96 flex-col border-l bg-slate-50 overflow-hidden">
        <div className="p-6 bg-white border-b space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <List className="h-5 w-5 text-blue-600" />
              Course Content
            </h3>
            <Badge className="bg-blue-100 text-blue-700 border-none font-bold">
              {progress?.completedLessons?.length || 0}/{lessons.length}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>Overall Progress</span>
              <span>{Math.round(((progress?.completedLessons?.length || 0) / lessons.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500" 
                style={{ width: `${Math.round(((progress?.completedLessons?.length || 0) / lessons.length) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {lessons.map((l, idx) => {
              const active = l.id === lessonId;
              const completed = progress?.completedLessons?.includes(l.id);
              
              return (
                <Link 
                  key={l.id} 
                  to={`/course/${courseId}/lesson/${l.id}`}
                  className={`group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 ${
                    active 
                      ? 'bg-white shadow-md ring-1 ring-blue-100' 
                      : 'hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition-colors ${
                    completed 
                      ? 'bg-green-100 text-green-600' 
                      : active 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                  }`}>
                    {completed ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  <div className="flex-grow min-w-0 space-y-1">
                    <span className={`text-sm font-bold block leading-tight ${active ? 'text-blue-600' : 'text-slate-700'}`}>
                      {l.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                        <PlayCircle className="h-3 w-3" />
                        <span>Video</span>
                      </div>
                      {completed && (
                        <span className="text-[10px] font-bold uppercase text-green-600">Done</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default LessonView;
