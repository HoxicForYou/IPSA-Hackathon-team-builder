
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { Spinner } from '../components/ui/Core';
import { Button } from '../components/common/Core';
import { IPS_ACADEMY_LOGO } from '../constants';

const VerifyEmailPage: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for resending email
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !auth.currentUser) return;
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await auth.currentUser.sendEmailVerification();
      setInfo('A new verification link has been sent to your email.');
      setResendCooldown(60); // 60-second cooldown
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to resend verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-indigo-800 to-secondary p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl text-center p-8">
        <img src={IPS_ACADEMY_LOGO} alt="IPS Academy Logo" className="mx-auto h-20 w-20 mb-4" />
        <h1 className="text-2xl font-bold text-neutral-800">Verify Your Email Address</h1>
        <p className="text-neutral-600 mt-4">
          A verification link has been sent to{' '}
          <strong className="text-primary">{currentUser?.email}</strong>.
        </p>
        <p className="text-neutral-600 mt-2">
          Please check your inbox (and spam folder) and click the link to complete your registration. Once verified, you can sign in.
        </p>

        {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        {info && <p className="mt-4 text-sm text-green-700 bg-green-100 p-3 rounded-md">{info}</p>}

        <div className="mt-8">
            <Button
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="w-full"
              size="lg"
            >
              {loading ? <Spinner /> : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </Button>
        </div>
        
        <div className="mt-8 border-t pt-4">
            <button onClick={signOut} className="text-sm text-neutral-500 hover:text-primary">
                Sign out and return to login
            </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
