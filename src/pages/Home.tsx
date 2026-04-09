import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, Languages, ArrowRight, Play, Star, Users, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';

const Home: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<number, string>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const q = query(collection(db, 'courses'), orderBy('grade', 'asc'));
      const querySnapshot = await getDocs(q);
      setCourses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchGrades = async () => {
      const querySnapshot = await getDocs(collection(db, 'grades'));
      const gradeMap: Record<number, string> = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        gradeMap[data.level] = data.name;
      });
      setGrades(gradeMap);
    };

    fetchCourses();
    fetchGrades();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider).then(() => navigate('/dashboard'));
    }
  };

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-24 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 space-y-8 text-center lg:text-left relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-sm">
              <Sparkles className="h-4 w-4 fill-current" />
              <span>The #1 ICT Learning Platform for Sri Lankan Students</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1]">
              Master ICT with <br />
              <span className="text-blue-600">Fun & Ease!</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              ICT lessons in Sinhala & English. Learn with high-quality videos, track your progress, and become a tech pro!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button onClick={handleGetStarted} size="lg" className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xl font-bold shadow-xl shadow-blue-200 transition-all active:scale-95">
                Start Learning Now
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-xl font-bold border-slate-200 hover:bg-slate-50" onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}>
                View Courses
              </Button>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900">500+</span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Students</span>
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900">50+</span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lessons</span>
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900">4.9/5</span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Rating</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-100">
              <img 
                src="https://picsum.photos/seed/ict/800/600" 
                alt="ICT Learning" 
                className="w-full aspect-[4/3] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/40 to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-white/90 flex items-center justify-center text-blue-600 shadow-2xl animate-pulse">
                  <Play className="h-10 w-10 fill-current ml-1" />
                </div>
              </div>
            </div>
            {/* Floating cards */}
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl z-20 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</div>
                  <div className="text-sm font-black text-slate-900">Lesson Completed!</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl z-20 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Star className="h-6 w-6 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Achievement</div>
                  <div className="text-sm font-black text-slate-900">New Badge Earned</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Background blobs */}
        <div className="absolute top-0 right-0 -mt-24 -mr-24 h-96 w-96 rounded-full bg-blue-50 blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 h-96 w-96 rounded-full bg-indigo-50 blur-3xl -z-10"></div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Play className="h-8 w-8" />, title: "Video Lessons", desc: "Easy to understand video lessons in Sinhala and English.", color: "bg-blue-100 text-blue-600" },
            { icon: <Award className="h-8 w-8" />, title: "Track Progress", desc: "See your progress and stay motivated as you learn.", color: "bg-green-100 text-green-600" },
            { icon: <Users className="h-8 w-8" />, title: "Teacher Support", desc: "Get help from expert teachers whenever you need it.", color: "bg-purple-100 text-purple-600" }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className={`h-16 w-16 rounded-2xl ${feat.color} flex items-center justify-center mb-6`}>
                {feat.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">{feat.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Course List */}
      <section id="courses" className="container mx-auto px-4 md:px-8 space-y-12">
        <div className="text-center space-y-4">
          <Badge className="bg-blue-600 text-white border-none px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">Course Catalog</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900">Pick Your Grade & Start</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Choose the course that matches your school grade. Each course is designed to cover the full syllabus.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {courses.length > 0 ? (
            courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white flex flex-col h-full">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <BookOpen className="h-16 w-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <Button nativeButton={false} className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl" render={<Link to={`/course/${course.id}`} />}>
                        View Details
                      </Button>
                    </div>
                    <Badge className="absolute top-4 left-4 bg-blue-600 text-white border-none px-3 py-1 rounded-full font-bold shadow-lg">
                      {grades[course.grade] || `Grade ${course.grade}`}
                    </Badge>
                  </div>
                  
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-black border-slate-200 text-slate-400">
                        {course.language}
                      </Badge>
                      <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Syllabus</span>
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {course.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-8 pt-0 flex-grow flex flex-col justify-between">
                    <p className="text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Price</span>
                        <span className="text-2xl font-black text-blue-600">
                          {course.price > 0 ? `Rs. ${course.price}` : 'FREE'}
                        </span>
                      </div>
                      <Button nativeButton={false} render={<Link to={`/course/${course.id}`} />} className="rounded-2xl h-12 px-6 bg-slate-900 hover:bg-blue-600 text-white font-bold transition-all group-hover:shadow-lg">
                        Enroll Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-500">
              No courses available yet. Check back soon!
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 md:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden"
        >
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Ready to start your <br /> ICT adventure?</h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium">
              Join thousands of students who are already learning ICT the fun way. Sign up today and get your first lesson for free!
            </p>
            <Button onClick={handleGetStarted} size="lg" className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xl font-bold shadow-2xl shadow-blue-500/20 transition-all active:scale-95">
              Get Started for Free
            </Button>
          </div>
          {/* Decorative */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 h-32 w-32 border-4 border-white rounded-full"></div>
            <div className="absolute bottom-10 right-10 h-48 w-48 border-4 border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 border border-white/20 rounded-full"></div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
