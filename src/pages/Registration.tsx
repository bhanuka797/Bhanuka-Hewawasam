import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'motion/react';
import { User, School, Phone, MessageSquare, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Registration: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    grade: '',
    schoolName: '',
    phoneNumber: '',
    whatsappNumber: ''
  });

  useEffect(() => {
    const fetchGrades = async () => {
      const gradesSnap = await getDocs(query(collection(db, 'grades'), orderBy('level', 'asc')));
      setGrades(gradesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchGrades();
  }, []);

  useEffect(() => {
    if (profile?.registrationCompleted) {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.fullName || !formData.grade || !formData.schoolName || !formData.phoneNumber || !formData.whatsappNumber) {
      return toast.error('Please fill in all details');
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        grade: parseInt(formData.grade),
        registrationCompleted: true,
        updatedAt: new Date()
      });
      await refreshProfile();
      toast.success('Registration successful!');
      navigate('/whatsapp-join');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-blue-600 text-white p-8 text-center space-y-2">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-2">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">Student Registration</CardTitle>
            <CardDescription className="text-blue-100 text-lg font-medium">
              Join our ICT learning community today!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-slate-600 font-bold uppercase tracking-widest text-[10px] ml-1">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="Enter your full name" 
                      className="pl-12 h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600 font-medium"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-slate-600 font-bold uppercase tracking-widest text-[10px] ml-1">Grade</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 z-10" />
                    <Select onValueChange={v => setFormData({...formData, grade: v})} value={formData.grade}>
                      <SelectTrigger className="pl-12 h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600 font-medium">
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {grades.map(g => (
                          <SelectItem key={g.id} value={g.level.toString()} className="rounded-lg">
                            {g.name}
                          </SelectItem>
                        ))}
                        {grades.length === 0 && <SelectItem value="none" disabled>No grades available</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-slate-600 font-bold uppercase tracking-widest text-[10px] ml-1">School Name</Label>
                  <div className="relative">
                    <School className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="Enter your school name" 
                      className="pl-12 h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600 font-medium"
                      value={formData.schoolName}
                      onChange={e => setFormData({...formData, schoolName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-slate-600 font-bold uppercase tracking-widest text-[10px] ml-1">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                      <Input 
                        placeholder="07X XXXXXXX" 
                        className="pl-12 h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600 font-medium"
                        value={formData.phoneNumber}
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-slate-600 font-bold uppercase tracking-widest text-[10px] ml-1">WhatsApp Number</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                      <Input 
                        placeholder="07X XXXXXXX" 
                        className="pl-12 h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600 font-medium"
                        value={formData.whatsappNumber}
                        onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-xl shadow-blue-100 transition-all active:scale-95 gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle className="h-5 w-5" /> Complete Registration</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Registration;
