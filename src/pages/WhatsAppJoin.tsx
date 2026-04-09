import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'motion/react';
import { MessageCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

const WhatsAppJoin: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.registrationCompleted) {
      navigate('/register');
      return;
    }

    const fetchLink = async () => {
      try {
        const gradesSnap = await getDocs(query(
          collection(db, 'grades'), 
          where('level', '==', profile.grade),
          limit(1)
        ));
        
        if (!gradesSnap.empty) {
          setWhatsappLink(gradesSnap.docs[0].data().whatsappLink || null);
        }
      } catch (error) {
        console.error('Error fetching WhatsApp link:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [profile, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white text-center">
          <CardHeader className="bg-green-500 text-white p-10 space-y-4">
            <div className="mx-auto bg-white/20 w-20 h-20 rounded-[2rem] flex items-center justify-center backdrop-blur-sm mb-2">
              <MessageCircle className="h-10 w-10 text-white fill-current" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tight">Join Your Class Group!</CardTitle>
              <CardDescription className="text-green-50 font-medium text-lg">
                Stay updated with new lessons and get support from teachers.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Your Grade: {profile?.grade}
              </div>
              
              {whatsappLink ? (
                <Button 
                  onClick={() => window.open(whatsappLink, '_blank')}
                  className="w-full h-16 rounded-2xl bg-green-500 hover:bg-green-600 text-xl font-bold shadow-xl shadow-green-100 transition-all active:scale-95 gap-3"
                >
                  <MessageCircle className="h-6 w-6 fill-current" />
                  Join WhatsApp Group
                </Button>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-medium">
                  WhatsApp group link for your grade will be available soon.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-slate-400 text-sm font-medium mb-6">
                Already joined or want to start learning now?
              </p>
              <Button 
                nativeButton={false}
                render={<Link to="/dashboard" />}
                variant="outline"
                className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 text-lg font-bold transition-all active:scale-95 gap-2"
              >
                Continue to Courses
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest">
              <CheckCircle2 className="h-4 w-4" />
              Registration Complete
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WhatsAppJoin;
