
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import HomePage from './pages/HomePage';
import { Spinner } from './components/ui/Core';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AuthActionPage from './pages/AuthActionPage';

const App: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const actionCode = urlParams.get('oobCode');

  // If a Firebase auth action is detected in the URL, render the handler page.
  if (mode && actionCode) {
    return <AuthActionPage mode={mode} actionCode={actionCode} />;
  }

  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen bg-neutral-100 font-sans">
          <AppContent />
        </div>
      </DataProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, loading, profileExists } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (!currentUser.emailVerified) {
    return <VerifyEmailPage />;
  }

  if (!profileExists) {
    return <ProfileSetupPage />;
  }

  return <HomePage />;
};


export default App;