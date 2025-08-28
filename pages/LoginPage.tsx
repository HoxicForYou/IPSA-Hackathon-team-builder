import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui/Core';
import { IPS_ACADEMY_LOGO } from '../constants';
import { auth } from '../services/firebase';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<'options' | 'signIn' | 'signUp'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  
  const resetForm = () => {
      setEmail('');
      setPassword('');
      setFullName('');
      setError('');
      setInfo('');
  };

  const handleSetView = (newView: 'options' | 'signIn' | 'signUp') => {
      resetForm();
      setView(newView);
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
        setError('Please enter a valid email address.');
        return;
    }
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
    }
    if (!validateEmail(email)) {
        setError('Please enter a valid email address.');
        return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await signUpWithEmail(fullName, email, password);
      // User will be automatically signed in and redirected by App.tsx
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use. Please sign in or use a different email.');
      } else {
        setError('Failed to create account. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const renderContent = () => {
      switch(view) {
          case 'signIn':
              return (
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                      <h3 className="font-bold text-xl text-center text-neutral-800">Sign In</h3>
                      <div>
                          <label htmlFor="email-signin" className="block text-sm font-medium text-neutral-700">Email</label>
                          <input type="email" id="email-signin" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                      </div>
                      <div>
                          <label htmlFor="password-signin" className="block text-sm font-medium text-neutral-700">Password</label>
                          <input type="password" id="password-signin" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300 shadow-lg shadow-primary/40">
                          {loading ? <Spinner size="sm" /> : 'Sign In'}
                      </button>
                      <p className="text-center text-sm">
                          Don't have an account?{' '}
                          <button type="button" onClick={() => handleSetView('signUp')} className="font-semibold text-primary hover:underline">Sign up</button>
                      </p>
                  </form>
              );
          case 'signUp':
              return (
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                      <h3 className="font-bold text-xl text-center text-neutral-800">Create Account</h3>
                       <div>
                          <label htmlFor="name-signup" className="block text-sm font-medium text-neutral-700">Full Name</label>
                          <input type="text" id="name-signup" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                      </div>
                      <div>
                          <label htmlFor="email-signup" className="block text-sm font-medium text-neutral-700">Email</label>
                          <input type="email" id="email-signup" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                      </div>
                      <div>
                          <label htmlFor="password-signup" className="block text-sm font-medium text-neutral-700">Password</label>
                          <input type="password" id="password-signup" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                          <p className="text-xs text-neutral-500 mt-1">Must be at least 6 characters long.</p>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300 shadow-lg shadow-primary/40">
                          {loading ? <Spinner size="sm" /> : 'Sign Up'}
                      </button>
                      <p className="text-center text-sm">
                          Already have an account?{' '}
                          <button type="button" onClick={() => handleSetView('signIn')} className="font-semibold text-primary hover:underline">Sign in</button>
                      </p>
                  </form>
              );
          case 'options':
          default:
              return (
                  <>
                      <p className="mb-6 text-neutral-700">
                          Find your perfect team for the Smart India Hackathon 2025.
                      </p>
                      <button onClick={signInWithGoogle} className="w-full bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300 mb-4">
                          <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
                              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.657-3.657-11.303-8.591l-6.571 4.819C9.656 39.663 16.318 44 24 44z" />
                              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.687 44 24c0-1.341-.138-2.65-.389-3.917z" />
                          </svg>
                          Sign in with Google
                      </button>
                      <button onClick={() => handleSetView('signIn')} className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300 shadow-lg shadow-primary/40">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          Continue with Email
                      </button>
                  </>
              );
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-indigo-800 to-secondary text-white p-4">
      <div className="text-center mb-8">
        <img src={IPS_ACADEMY_LOGO} alt="IPS Academy Logo" className="mx-auto h-24 w-24 mb-4 rounded-full shadow-lg" />
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">IPS Academy</h1>
        <h2 className="text-2xl md:text-3xl font-light text-neutral-200">IES SIH Internal Hackathon Team Formation</h2>
      </div>
      <div className="bg-white text-neutral-900 p-8 rounded-lg shadow-2xl max-w-sm w-full text-center relative">
        {view !== 'options' && (
            <button onClick={() => handleSetView('options')} className="absolute top-4 left-4 text-neutral-500 hover:text-primary" aria-label="Go back">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
        )}
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        {info && <p className="mb-4 text-sm text-green-700 bg-green-100 p-3 rounded-md">{info}</p>}
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginPage;
