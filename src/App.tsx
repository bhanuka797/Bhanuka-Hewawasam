import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/src/components/Navbar';
import Home from '@/src/pages/Home';
import Dashboard from '@/src/pages/Dashboard';
import CourseDetails from '@/src/pages/CourseDetails';
import LessonView from '@/src/pages/LessonView';
import AdminPanel from '@/src/pages/AdminPanel';
import QuizView from '@/src/pages/QuizView';
import Registration from '@/src/pages/Registration';
import WhatsAppJoin from '@/src/pages/WhatsAppJoin';
import { useLocation } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;

  // Force registration if not completed (unless already on registration pages)
  if (user && !isAdmin && !profile?.registrationCompleted && location.pathname !== '/register' && location.pathname !== '/whatsapp-join') {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
};

import ErrorBoundary from './components/ErrorBoundary';
import GeminiTutor from './components/GeminiTutor';

const AppContent = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
          <Route path="/whatsapp-join" element={<ProtectedRoute><WhatsAppJoin /></ProtectedRoute>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId"
            element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/lesson/:lessonId"
            element={
              <ProtectedRoute>
                <LessonView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/quiz/:quizId"
            element={
              <ProtectedRoute>
                <QuizView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Toaster />
      {user && <GeminiTutor />}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
