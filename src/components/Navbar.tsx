import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { BookOpen, User, LogOut, LayoutDashboard, ShieldCheck, Home, GraduationCap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'motion/react';

const Navbar: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-18 items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-200">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">
            ICT<span className="text-blue-600">HUB</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border">
          <Link to="/">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`rounded-xl px-4 h-10 gap-2 font-bold transition-all ${isActive('/') ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          {user && (
            <Link to="/dashboard">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`rounded-xl px-4 h-10 gap-2 font-bold transition-all ${isActive('/dashboard') ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`rounded-xl px-4 h-10 gap-2 font-bold transition-all ${isActive('/admin') ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-amber-600'}`}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l ml-1">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-xs font-black text-slate-900 leading-none">{profile?.displayName?.split(' ')[0]}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile?.role}</span>
              </div>
              <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-1 ring-slate-100">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                  {user.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
