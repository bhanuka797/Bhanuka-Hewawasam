import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, ArrowRight, RefreshCcw, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const QuizView: React.FC = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [previousSubmissions, setPreviousSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!courseId || !quizId) return;
      try {
        const quizSnap = await getDoc(doc(db, 'courses', courseId, 'quizzes', quizId));
        if (quizSnap.exists()) {
          const quizData = { id: quizSnap.id, ...quizSnap.data() } as any;
          setQuiz(quizData);
          if (quizData.timeLimit > 0) {
            setTimeLeft(quizData.timeLimit * 60);
          }
        } else {
          toast.error('Quiz not found');
          navigate(`/course/${courseId}`);
        }

        // Fetch previous submissions
        if (profile?.uid) {
          const q = query(
            collection(db, 'quizSubmissions'),
            where('userId', '==', profile.uid),
            where('quizId', '==', quizId),
            orderBy('completedAt', 'desc')
          );
          const subSnap = await getDocs(q);
          setPreviousSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, quizId, navigate, profile]);

  useEffect(() => {
    if (timeLeft === null || isFinished || submitting) return;

    if (timeLeft === 0) {
      setIsTimeUp(true);
      finishQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setSubmitting(true);
    let calculatedScore = 0;
    quiz.questions.forEach((q: any, index: number) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        calculatedScore++;
      }
    });
    
    setScore(calculatedScore);
    setIsFinished(true);

    if (profile?.uid && courseId && quizId) {
      try {
        await addDoc(collection(db, 'quizSubmissions'), {
          userId: profile.uid,
          userName: profile.displayName,
          userEmail: profile.email,
          quizId: quizId,
          courseId: courseId,
          score: calculatedScore,
          totalQuestions: quiz.questions.length,
          answers: selectedAnswers,
          completedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error saving submission:', error);
      }
    }
    setSubmitting(false);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setIsFinished(false);
    setScore(0);
    setIsTimeUp(false);
    if (quiz?.timeLimit > 0) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Preparing your quiz...</p>
    </div>
  );

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (isFinished) {
    const percentScore = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          {isTimeUp && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold animate-pulse">
              <AlertCircle className="h-5 w-5" />
              Time's up! Your quiz was automatically submitted.
            </div>
          )}
          <div className="relative inline-block">
            <div className="h-40 w-40 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
              <Trophy className={`h-20 w-20 ${percentScore >= 50 ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
            {percentScore >= 80 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg"
              >
                <CheckCircle2 className="h-6 w-6" />
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900">Quiz Completed!</h1>
            <p className="text-xl text-slate-500">You scored {score} out of {quiz.questions.length}</p>
          </div>

          <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-xl">
            <div className="text-6xl font-black text-blue-600 mb-2">{percentScore}%</div>
            <p className="text-slate-500 font-medium mb-8">
              {percentScore >= 80 ? 'Excellent work! You have a great understanding.' : 
               percentScore >= 50 ? 'Good job! Keep practicing to improve further.' : 
               'Don\'t give up! Review the lessons and try again.'}
            </p>
            
            {previousSubmissions.length > 0 && previousSubmissions[0].feedback && (
              <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-left">
                <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
                  <MessageSquare className="h-4 w-4" />
                  Teacher Feedback
                </div>
                <p className="text-blue-800 italic">"{previousSubmissions[0].feedback}"</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={restartQuiz} className="h-14 rounded-2xl font-bold gap-2">
                <RefreshCcw className="h-5 w-5" /> Retake Quiz
              </Button>
              <Button onClick={() => navigate(`/course/${courseId}`)} className="h-14 rounded-2xl font-bold gap-2 bg-slate-900">
                Back to Course <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/course/${courseId}`)} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Exit Quiz
        </Button>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg border-2 transition-colors ${
              timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-700'
            }`}>
              <Clock className={`h-5 w-5 ${timeLeft < 60 ? 'text-red-600' : 'text-slate-400'}`} />
              {formatTime(timeLeft)}
            </div>
          )}
          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none h-10 px-4 flex items-center">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
          <span>Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </Progress>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 md:p-12 bg-slate-50 border-b">
              <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 md:p-12 space-y-4">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full flex items-center gap-4 p-6 rounded-2xl border-2 text-left transition-all duration-200 group ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-lg font-medium">{option}</span>
                  {selectedAnswers[currentQuestionIndex] === index && (
                    <div className="ml-auto">
                      <CheckCircle2 className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
          className="h-14 px-8 rounded-2xl font-bold"
        >
          Previous
        </Button>
        <Button
          disabled={selectedAnswers[currentQuestionIndex] === undefined || submitting}
          onClick={handleNext}
          className="h-14 px-10 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
        >
          {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default QuizView;
