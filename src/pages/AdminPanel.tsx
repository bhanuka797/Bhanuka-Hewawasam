import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, serverTimestamp, arrayUnion, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Check, X, Users, BookOpen, Clock, GraduationCap, HelpCircle, Upload, Image as ImageIcon, Trophy, MessageCircle, Download, Search, Filter, Send, School, Phone } from 'lucide-react';
import { toast } from 'sonner';
import QuizCreator from '../components/QuizCreator';

const AdminPanel: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [selectedCourseForQuiz, setSelectedCourseForQuiz] = useState('');
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [studentFilter, setStudentFilter] = useState({ grade: 'all', search: '' });

  // Form states
  const [newCourse, setNewCourse] = useState({ title: '', description: '', grade: '', language: 'Sinhala', price: '0', thumbnail: '' });
  const [newLesson, setNewLesson] = useState({ courseId: '', title: '', description: '', videoUrl: '', order: '1' });
  const [newGrade, setNewGrade] = useState({ name: '', level: '', whatsappLink: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const coursesSnap = await getDocs(query(collection(db, 'courses'), orderBy('grade', 'asc')));
    const requestsSnap = await getDocs(query(collection(db, 'accessRequests'), orderBy('createdAt', 'desc')));
    const gradesSnap = await getDocs(query(collection(db, 'grades'), orderBy('level', 'asc')));
    const submissionsSnap = await getDocs(query(collection(db, 'quizSubmissions'), orderBy('completedAt', 'desc')));
    const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
    
    const allQuizzes: any[] = [];
    for (const courseDoc of coursesSnap.docs) {
      const quizzesSnap = await getDocs(collection(db, 'courses', courseDoc.id, 'quizzes'));
      quizzesSnap.docs.forEach(q => allQuizzes.push({ id: q.id, courseId: courseDoc.id, courseTitle: courseDoc.data().title, ...q.data() }));
    }
    setQuizzes(allQuizzes);

    setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setRequests(requestsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setSubmissions(submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const fetchedGrades = gradesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    setGrades(fetchedGrades);
    
    if (fetchedGrades.length > 0 && !newCourse.grade) {
      setNewCourse(prev => ({ ...prev, grade: fetchedGrades[0].level.toString() }));
    }
    
    setLoading(false);
  };

  const handleAddCourse = async () => {
    if (!newCourse.grade) return toast.error('Please select a grade');
    try {
      await addDoc(collection(db, 'courses'), {
        ...newCourse,
        grade: parseInt(newCourse.grade),
        price: parseFloat(newCourse.price),
        createdAt: serverTimestamp(),
      });
      toast.success('Course added successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to add course');
    }
  };

  const handleAddGrade = async () => {
    if (!newGrade.name || !newGrade.level) return toast.error('Fill all fields');
    try {
      await addDoc(collection(db, 'grades'), {
        name: newGrade.name,
        level: parseInt(newGrade.level),
        whatsappLink: newGrade.whatsappLink || '',
        createdAt: serverTimestamp(),
      });
      toast.success('Grade added successfully!');
      setNewGrade({ name: '', level: '', whatsappLink: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add grade');
    }
  };

  const handleUpdateGrade = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'grades', id), data);
      toast.success('Grade updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update grade');
    }
  };

  const exportStudents = () => {
    const headers = ['Full Name', 'Email', 'Grade', 'School', 'Phone', 'WhatsApp'];
    const rows = students.map(s => [
      s.fullName || s.displayName,
      s.email,
      s.grade,
      s.schoolName,
      s.phoneNumber,
      s.whatsappNumber
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(r => r.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => {
    const matchesGrade = studentFilter.grade === 'all' || s.grade?.toString() === studentFilter.grade;
    const matchesSearch = !studentFilter.search || 
      s.fullName?.toLowerCase().includes(studentFilter.search.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentFilter.search.toLowerCase()) ||
      s.schoolName?.toLowerCase().includes(studentFilter.search.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const sendWhatsAppReminder = (student: any) => {
    const number = student.whatsappNumber || student.phoneNumber;
    if (!number) return toast.error('No contact number found');
    
    const message = `Hello ${student.fullName || student.displayName}, new ICT lessons have been added to your course! Log in now to continue learning.`;
    const url = `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDeleteGrade = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await deleteDoc(doc(db, 'grades', id));
    fetchData();
  };

  const handleAddLesson = async () => {
    if (!newLesson.courseId) return toast.error('Select a course');
    try {
      await addDoc(collection(db, 'courses', newLesson.courseId, 'lessons'), {
        ...newLesson,
        order: parseInt(newLesson.order),
        createdAt: serverTimestamp(),
      });
      toast.success('Lesson added successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to add lesson');
    }
  };

  const handleApproveRequest = async (request: any) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'accessRequests', request.id), { status: 'approved' });
      
      // 2. Add course to user's enrolledCourses
      await updateDoc(doc(db, 'users', request.userId), {
        enrolledCourses: arrayUnion(request.courseId)
      });
      
      toast.success('Request approved and user enrolled!');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      await updateDoc(doc(db, 'accessRequests', id), { status: 'rejected' });
      toast.success('Request rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure? This will not delete lessons automatically in this demo.')) return;
    await deleteDoc(doc(db, 'courses', id));
    fetchData();
  };

  const handleSaveQuiz = async (quizData: any) => {
    if (!selectedCourseForQuiz) return toast.error('Please select a course');
    try {
      await addDoc(collection(db, 'courses', selectedCourseForQuiz, 'quizzes'), {
        ...quizData,
        courseId: selectedCourseForQuiz,
        createdAt: serverTimestamp(),
      });
      toast.success('Quiz added successfully!');
      setIsQuizDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to add quiz');
    }
  };

  const handleDeleteQuiz = async (courseId: string, quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await deleteDoc(doc(db, 'courses', courseId, 'quizzes', quizId));
      toast.success('Quiz deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // ~800KB limit for Firestore
      return toast.error('Image is too large. Please select an image under 800KB.');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewCourse({ ...newCourse, thumbnail: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSubmission = async (submissionId: string, data: any) => {
    try {
      await updateDoc(doc(db, 'quizSubmissions', submissionId), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Submission updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update submission');
    }
  };

  if (loading) return <div className="py-20 text-center">Loading admin data...</div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger render={<Button className="gap-2"><Plus className="h-4 w-4" /> New Course</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Course</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Grade</Label>
                    <Select onValueChange={v => setNewCourse({...newCourse, grade: v})} value={newCourse.grade}>
                      <SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger>
                      <SelectContent>
                        {grades.map(g => <SelectItem key={g.id} value={g.level.toString()}>{g.name}</SelectItem>)}
                        {grades.length === 0 && <SelectItem value="none" disabled>No grades created</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Language</Label>
                    <Select onValueChange={v => setNewCourse({...newCourse, language: v})} defaultValue="Sinhala">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sinhala">Sinhala</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Price (Rs.)</Label>
                  <Input type="number" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Thumbnail</Label>
                  <div className="flex flex-col gap-4">
                    {newCourse.thumbnail && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border bg-slate-50">
                        <img src={newCourse.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={() => setNewCourse({ ...newCourse, thumbnail: '' })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <Input 
                          placeholder="Paste image URL here..." 
                          value={newCourse.thumbnail} 
                          onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})} 
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          id="thumbnail-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                        />
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Recommended: 1280x720px. Max size 800KB for uploads.
                    </p>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
                </div>
                <Button onClick={handleAddCourse}>Create Course</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> New Lesson</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Lesson</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Course</Label>
                  <Select onValueChange={v => setNewLesson({...newLesson, courseId: v})}>
                    <SelectTrigger><SelectValue placeholder="Choose course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title} (G{c.grade})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Lesson Title</Label>
                  <Input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Video URL (YouTube)</Label>
                  <Input value={newLesson.videoUrl} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Order Number</Label>
                  <Input type="number" value={newLesson.order} onChange={e => setNewLesson({...newLesson, order: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input value={newLesson.description} onChange={e => setNewLesson({...newLesson, description: e.target.value})} />
                </div>
                <Button onClick={handleAddLesson}>Add Lesson</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="requests">
        <TabsList className="grid w-full grid-cols-6 lg:w-[1100px]">
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            Access Requests
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 min-w-[1.2rem] h-5">
                {requests.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <Trophy className="h-4 w-4" />
            Quiz Results
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Grades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Enrollment Requests & Payments</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-2xl bg-white gap-6">
                      <div className="flex gap-6 items-start">
                        {req.receipt ? (
                          <Dialog>
                            <DialogTrigger render={
                              <div className="relative h-24 w-24 rounded-xl overflow-hidden border-2 border-blue-100 cursor-pointer group shrink-0">
                                <img src={req.receipt} alt="Receipt" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            } />
                            <DialogContent className="max-w-2xl rounded-[2rem]">
                              <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
                              <ScrollArea className="max-h-[80vh]">
                                <img src={req.receipt} alt="Full Receipt" className="w-full h-auto rounded-xl" />
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <div className="h-24 w-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border-2 border-dashed">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{req.userName}</span>
                            <Badge variant={req.status === 'approved' ? 'default' : 'secondary'}>{req.status}</Badge>
                          </div>
                          <p className="text-sm text-slate-500">{req.userEmail}</p>
                          <p className="text-sm font-bold text-blue-600">Course: {req.courseTitle}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            Requested: {req.createdAt?.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="lg" 
                            variant="outline" 
                            className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl px-6"
                            onClick={() => handleRejectRequest(req.id)}
                          >
                            Reject
                          </Button>
                          <Button size="lg" className="bg-green-600 hover:bg-green-700 rounded-xl px-8" onClick={() => handleApproveRequest(req)}>
                            <Check className="h-4 w-4 mr-2" />
                            Approve Access
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {requests.length === 0 && <div className="text-center py-20 text-slate-500">No requests found.</div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registered Students</CardTitle>
              <Button onClick={exportStudents} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search by name, email or school..." 
                    className="pl-10"
                    value={studentFilter.search}
                    onChange={e => setStudentFilter({...studentFilter, search: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <Select 
                    value={studentFilter.grade} 
                    onValueChange={v => setStudentFilter({...studentFilter, grade: v})}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {grades.map(g => (
                        <SelectItem key={g.id} value={g.level.toString()}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="p-6 border rounded-2xl bg-white hover:border-blue-200 transition-colors group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{student.fullName || student.displayName}</span>
                            <Badge variant="secondary">Grade {student.grade || 'N/A'}</Badge>
                            {student.registrationCompleted && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Registered</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{student.email}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <School className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">{student.schoolName || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">{student.phoneNumber || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MessageCircle className="h-4 w-4 text-green-500" />
                              <span className="text-slate-600">{student.whatsappNumber || 'Not provided'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="rounded-xl gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                            onClick={() => sendWhatsAppReminder(student)}
                          >
                            <Send className="h-4 w-4" />
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-20 text-slate-500">No students found matching your filters.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Quiz Submissions & Grading</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {submissions.map(sub => {
                    const quiz = quizzes.find(q => q.id === sub.quizId);
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-6 border rounded-2xl bg-white">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{sub.userName || 'Student'}</span>
                            <Badge variant="outline" className="text-blue-600 border-blue-100">{quiz?.title || 'Quiz'}</Badge>
                          </div>
                          <p className="text-sm text-slate-500">{sub.userEmail}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Score</span>
                              <span className="text-xl font-black text-blue-600">{sub.score} / {sub.totalQuestions}</span>
                            </div>
                            <div className="h-8 w-px bg-slate-100"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Percentage</span>
                              <span className="text-lg font-bold text-slate-700">{Math.round((sub.score / sub.totalQuestions) * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <Dialog onOpenChange={(open) => !open && setEditingSubmission(null)}>
                          <DialogTrigger render={<Button variant="outline" className="rounded-xl" onClick={() => setEditingSubmission({ ...sub, tempScore: sub.score, tempFeedback: sub.feedback || '' })}>Review & Feedback</Button>} />
                          <DialogContent className="max-w-md rounded-[2rem]">
                            <DialogHeader>
                              <DialogTitle>Review Submission</DialogTitle>
                            </DialogHeader>
                            {editingSubmission && (
                              <div className="space-y-6 py-4">
                                <div className="grid gap-2">
                                  <Label>Override Score</Label>
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      type="number" 
                                      value={editingSubmission.tempScore} 
                                      className="w-24"
                                      onChange={(e) => setEditingSubmission({ ...editingSubmission, tempScore: parseInt(e.target.value) })}
                                    />
                                    <span className="text-slate-400">/ {editingSubmission.totalQuestions}</span>
                                  </div>
                                </div>
                                <div className="grid gap-2">
                                  <Label>Teacher Feedback</Label>
                                  <Input 
                                    placeholder="Well done! Keep practicing..." 
                                    value={editingSubmission.tempFeedback}
                                    onChange={(e) => setEditingSubmission({ ...editingSubmission, tempFeedback: e.target.value })}
                                  />
                                </div>
                                <Button 
                                  className="w-full bg-blue-600"
                                  onClick={async () => {
                                    await handleUpdateSubmission(editingSubmission.id, { 
                                      score: editingSubmission.tempScore, 
                                      feedback: editingSubmission.tempFeedback 
                                    });
                                    setEditingSubmission(null);
                                  }}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    );
                  })}
                  {submissions.length === 0 && <div className="text-center py-20 text-slate-500">No quiz submissions yet.</div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <Card key={course.id} className="overflow-hidden">
                {course.thumbnail && (
                  <div className="aspect-video w-full overflow-hidden border-b">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge>Grade {course.grade}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDeleteCourse(course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description}</div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-600">Rs. {course.price}</span>
                    <span className="text-xs text-slate-400">{course.language}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Course Quizzes</h2>
              <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                <DialogTrigger render={<Button className="gap-2"><Plus className="h-4 w-4" /> Create New Quiz</Button>} />
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Create New Quiz</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Select Course</Label>
                      <Select onValueChange={setSelectedCourseForQuiz} value={selectedCourseForQuiz}>
                        <SelectTrigger><SelectValue placeholder="Choose course" /></SelectTrigger>
                        <SelectContent>
                          {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title} (G{c.grade})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <QuizCreator onSave={handleSaveQuiz} onCancel={() => setIsQuizDialogOpen(false)} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map(quiz => (
                <Card key={quiz.id} className="relative group">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-blue-600 border-blue-200">{quiz.courseTitle}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDeleteQuiz(quiz.courseId, quiz.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{quiz.description}</p>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        {quiz.questions?.length || 0} Questions
                      </div>
                      {quiz.timeLimit > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {quiz.timeLimit} Mins
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {quizzes.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl text-slate-400">
                  No quizzes created yet.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="grades" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Add New Grade</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Grade Name (e.g. Grade 6)</Label>
                  <Input value={newGrade.name} onChange={e => setNewGrade({...newGrade, name: e.target.value})} placeholder="Grade 6" />
                </div>
                <div className="grid gap-2">
                  <Label>Level (Number for sorting)</Label>
                  <Input type="number" value={newGrade.level} onChange={e => setNewGrade({...newGrade, level: e.target.value})} placeholder="6" />
                </div>
                <div className="grid gap-2">
                  <Label>WhatsApp Group Link</Label>
                  <Input value={newGrade.whatsappLink} onChange={e => setNewGrade({...newGrade, whatsappLink: e.target.value})} placeholder="https://chat.whatsapp.com/..." />
                </div>
                <Button className="w-full" onClick={handleAddGrade}>Add Grade</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Existing Grades</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grades.map(g => (
                    <div key={g.id} className="p-4 border rounded-2xl bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{g.name}</span>
                          <Badge variant="secondary">Level {g.level}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => handleDeleteGrade(g.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">WhatsApp Link</Label>
                        <div className="flex gap-2">
                          <Input 
                            defaultValue={g.whatsappLink} 
                            placeholder="No link set"
                            className="bg-slate-50 border-none"
                            onBlur={(e) => handleUpdateGrade(g.id, { whatsappLink: e.target.value })}
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="shrink-0"
                            onClick={() => g.whatsappLink && window.open(g.whatsappLink, '_blank')}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {grades.length === 0 && <div className="text-center py-10 text-slate-500">No grades created yet.</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
