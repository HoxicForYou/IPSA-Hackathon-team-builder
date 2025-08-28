
import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { Spinner } from '../components/ui/Core';
import { IPS_ACADEMY_LOGO } from '../constants';

interface AuthActionPageProps {
  mode: string;
  actionCode: string;
}

const AuthActionPage: React.FC<AuthActionPageProps> = ({ mode, actionCode }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAction = async () => {
      switch (mode) {
        case 'verifyEmail':
          try {
            await auth.applyActionCode(actionCode);
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now log in.');
          } catch (error: any) {
            setStatus('error');
            setMessage('Invalid or expired verification link. Please sign up again to get a new one.');
            console.error(error);
          }
          break;
        // Other actions like 'resetPassword' could be handled here in the future
        default:
          setStatus('error');
          setMessage('Invalid action. Please check the link and try again.');
          break;
      }
    };

    handleAction();
  }, [mode, actionCode]);

  const handleContinue = () => {
    // Redirect to the main page, removing query parameters
    window.location.href = '/';
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Spinner size="lg" />
            <p className="mt-4 text-neutral-600">Verifying your email...</p>
          </>
        );
      case 'success':
        return (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h1 className="text-2xl font-bold text-neutral-800 mt-4">Verification Successful!</h1>
            <p className="text-neutral-600 mt-2">{message}</p>
            <button
              onClick={handleContinue}
              className="mt-6 w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Continue to Login
            </button>
          </>
        );
      case 'error':
        return (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-accent mx-auto" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h1 className="text-2xl font-bold text-neutral-800 mt-4">Verification Failed</h1>
            <p className="text-neutral-600 mt-2">{message}</p>
             <button
              onClick={handleContinue}
              className="mt-6 w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Back to Sign Up
            </button>
          </>
        );
    }
  };

  return (
     <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-indigo-800 to-secondary p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl text-center p-8">
        <img src={IPS_ACADEMY_LOGO} alt="IPS Academy Logo" className="mx-auto h-20 w-20 mb-4" />
        {renderContent()}
      </div>
    </div>
  );
};

export default AuthActionPage;
