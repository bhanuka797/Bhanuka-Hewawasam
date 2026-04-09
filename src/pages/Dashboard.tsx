import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, PlayCircle, CheckCircle2, Clock, Trophy, Star, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<Record<string, any>>({});
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [lastLesson, setLastLesson] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.enrolledCourses || profile.enrolledCourses.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch grades
      const gradesSnap = await getDocs(collection(db, 'grades'));
      const gradeMap: Record<number, string> = {};
      gradesSnap.docs.forEach(doc => {
        const data = doc.data();
        gradeMap[data.level] = data.name;
      });
      setGrades(gradeMap);

      // Fetch enrolled courses
      const coursesData = [];
      const progressMap: Record<string, any> = {};
      let mostRecentProgress: any = null;
      let mostRecentCourseId: string = '';

      for (const courseId of profile.enrolledCourses) {
        const courseSnap = await getDoc(doc(db, 'courses', courseId));
        if (courseSnap.exists()) {
          const course = { id: courseSnap.id, ...courseSnap.data() };
          coursesData.push(course);

          // Fetch progress for this course
          const progressId = `${profile.uid}_${courseId}`;
          const progressSnap = await getDoc(doc(db, 'progress', progressId));
          if (progressSnap.exists()) {
            const pData = progressSnap.data();
            progressMap[courseId] = pData;
            
            // Track most recent lesson
            if (!mostRecentProgress || (pData.lastAccessedAt?.toMillis() > mostRecentProgress.lastAccessedAt?.toMillis())) {
              mostRecentProgress = pData;
              mostRecentCourseId = courseId;
            }
          } else {
            progressMap[courseId] = { completedLessons: [] };
          }

          // Fetch total lessons count
          const lessonsSnap = await getDocs(collection(db, 'courses', courseId, 'lessons'));
          progressMap[courseId].totalLessons = lessonsSnap.size;
        }
      }

      // Set last lesson info if available
      if (mostRecentProgress?.lastLessonId) {
        const lessonSnap = await getDoc(doc(db, 'courses', mostRecentCourseId, 'lessons', mostRecentProgress.lastLessonId));
        if (lessonSnap.exists()) {
          setLastLesson({
            ...lessonSnap.data(),
            id: lessonSnap.id,
            courseId: mostRecentCourseId,
            courseTitle: coursesData.find(c => c.id === mostRecentCourseId)?.title
          });
        }
      }

      setEnrolledCourses(coursesData);
      setProgressData(progressMap);
      setLoading(false);
    };

    fetchData();
  }, [profile]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading your learning journey...</p>
    </div>
  );

  const totalCompleted = Object.values(progressData).reduce((acc: number, curr: any) => acc + (curr.completedLessons?.length || 0), 0) as number;
  const totalLessons = Object.values(progressData).reduce((acc: number, curr: any) => acc + (curr.totalLessons || 0), 0) as number;
  const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const pieData = [
    { name: 'Completed', value: totalCompleted, color: '#2563eb' },
    { name: 'Remaining', value: Math.max(0, totalLessons - totalCompleted), color: '#f1f5f9' }
  ];

  const barData = enrolledCourses.map(course => {
    const progress = progressData[course.id];
    return {
      name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
      completed: progress?.completedLessons?.length || 0,
      total: progress?.totalLessons || 0,
      percentage: progress?.totalLessons > 0 ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100) : 0
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Welcome Hero */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white shadow-xl"
      >
        <div className="relative z-10 space-y-6 max-w-2xl">
          <div className="space-y-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-3 py-1">
              Student Dashboard
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome back, {profile?.displayName?.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-lg md:text-xl">
              You've completed {totalCompleted} lessons so far. Keep up the great work!
            </p>
          </div>

          {lastLesson ? (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button nativeButton={false} render={<Link to={`/course/${lastLesson.courseId}/lesson/${lastLesson.id}`} />} size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 h-14 rounded-2xl shadow-lg">
                <Play className="mr-2 h-5 w-5 fill-current" />
                Continue: {lastLesson.title}
              </Button>
              <div className="flex items-center gap-2 text-blue-100 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Last seen in {lastLesson.courseTitle}</span>
              </div>
            </div>
          ) : (
            <Button nativeButton={false} render={<Link to="/" />} size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 h-14 rounded-2xl shadow-lg">
              Explore New Courses
            </Button>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl"></div>
        <Trophy className="absolute right-12 bottom-12 h-32 w-32 text-white/10 rotate-12 hidden lg:block" />
      </motion.section>

      <Tabs defaultValue="my-courses" className="w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <TabsList className="bg-slate-100 p-1 rounded-2xl">
            <TabsTrigger value="my-courses" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              My Courses
            </TabsTrigger>
            <TabsTrigger value="progress" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Overall Progress
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-full border">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>{enrolledCourses.length} Enrolled Courses</span>
          </div>
        </div>

        <TabsContent value="my-courses" className="mt-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.length > 0 ? (
              enrolledCourses.map((course, index) => {
                const progress = progressData[course.id];
                const percent = progress?.totalLessons > 0 
                  ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100) 
                  : 0;

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white flex flex-col h-full">
                      <div className="relative aspect-video overflow-hidden">
                        {course.thumbnail ? (
                          <img 
                            src={course.thumbnail} 
                            alt={course.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <BookOpen className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <Badge className="bg-white text-blue-600 border-none">Continue Learning</Badge>
                        </div>
                        <Badge className="absolute top-3 left-3 bg-blue-600/90 text-white border-none backdrop-blur-md">
                          {grades[course.grade] || `Grade ${course.grade}`}
                        </Badge>
                      </div>
                      
                      <CardHeader className="p-5 pb-2">
                        <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold h-5">
                            {course.language}
                          </Badge>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{progress?.totalLessons || 0} Lessons</span>
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-5 pt-4 space-y-4 flex-grow">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                            <span>Course Progress</span>
                            <span className="text-blue-600">{percent}%</span>
                          </div>
                          <Progress value={percent} className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${percent}%` }} />
                          </Progress>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                {i}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {progress?.completedLessons?.length || 0} of {progress?.totalLessons || 0} completed
                          </span>
                        </div>
                      </CardContent>

                      <div className="p-5 pt-0">
                        <Button nativeButton={false} render={<Link to={`/course/${course.id}`} />} className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold h-12 rounded-2xl transition-all duration-300 group-hover:shadow-lg">
                          Continue Learning
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <Card className="col-span-full border-2 border-dashed border-slate-200 p-16 text-center rounded-3xl bg-slate-50/50">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-6">
                  <BookOpen className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl mb-2">Start Your Journey!</CardTitle>
                <CardDescription className="text-lg mb-8 max-w-md mx-auto">
                  You haven't enrolled in any courses yet. Our ICT lessons are waiting for you!
                </CardDescription>
                <Button nativeButton={false} render={<Link to="/" />} size="lg" className="bg-blue-600 hover:bg-blue-700 font-bold px-10 h-14 rounded-2xl shadow-lg">
                  Browse All Courses
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Overall Stats Card */}
            <Card className="lg:col-span-1 rounded-3xl border-none shadow-md overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Overall Progress</CardTitle>
                <CardDescription>Your total learning journey</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-blue-600">{overallProgress}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Complete</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                    <div className="text-xl font-bold text-blue-600">{totalCompleted}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Lessons Done</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                    <div className="text-xl font-bold text-indigo-600">{totalLessons}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Lessons</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Comparison Card */}
            <Card className="lg:col-span-2 rounded-3xl border-none shadow-md overflow-hidden bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Course-wise Progress</CardTitle>
                <CardDescription>Compare your progress across all enrolled courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120} 
                        tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar 
                        dataKey="percentage" 
                        name="Progress %" 
                        fill="#2563eb" 
                        radius={[0, 10, 10, 0]} 
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 space-y-4">
                  <h4 className="font-bold text-sm text-slate-900">Detailed Breakdown</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {enrolledCourses.map(course => {
                      const progress = progressData[course.id];
                      const percent = progress?.totalLessons > 0 
                        ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100) 
                        : 0;
                      
                      return (
                        <div key={course.id} className="p-4 rounded-2xl border bg-slate-50/50 flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div className="flex-grow space-y-1 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-bold text-xs truncate">{course.title}</span>
                              <span className="text-[10px] font-bold text-blue-600 whitespace-nowrap">{percent}%</span>
                            </div>
                            <Progress value={percent} className="h-1.5 bg-white rounded-full" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
