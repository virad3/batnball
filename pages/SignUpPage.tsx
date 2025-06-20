
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import Button from '../components/Button';
import { APP_NAME } from '../constants';
import { UserProfile } from '../types'; 
import { useAuth } from '../contexts/AuthContext';

const GoogleIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <path d="M17.6402 9.20455C17.6402 8.56818 17.5818 7.95455 17.4773 7.36364H9V10.8409H13.8409C13.6364 11.9091 13.0045 12.8182 12.0818 13.4545V15.6136H14.8091C16.5364 14.0455 17.6402 11.8636 17.6402 9.20455Z" fill="#4285F4"/>
    <path d="M9 18C11.4318 18 13.4864 17.1818 14.8091 15.6136L12.0818 13.4545C11.2364 14.0227 10.2182 14.3636 9 14.3636C6.81818 14.3636 4.96818 12.9545 4.30909 10.9773H1.47727V13.2273C2.78636 15.9318 5.65455 18 9 18Z" fill="#34A853"/>
    <path d="M4.30909 10.9773C4.12273 10.4545 4.00909 9.88636 4.00909 9.29545C4.00909 8.70455 4.12273 8.13636 4.30909 7.61364V5.36364H1.47727C0.522727 7.22727 0.522727 11.3636 1.47727 13.2273L4.30909 10.9773Z" fill="#FBBC05"/>
    <path d="M9 4.22727C10.3364 4.22727 11.3318 4.72727 11.9182 5.27273L14.8636 2.5C13.4727 1.25 11.4318 0.5 9 0.5C5.65455 0.5 2.78636 2.65909 1.47727 5.36364L4.30909 7.61364C4.96818 5.63636 6.81818 4.22727 9 4.22727Z" fill="#EA4335"/>
  </svg>
);

const SignUpPage: React.FC = () => {
  const navigate = useNavigate(); 
  const { signUpWithPassword, signInWithGoogle, loading: authLoading, error: authErrorHook, user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileType, setProfileType] = useState<UserProfile['profileType']>('Fan');
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (user && !authErrorHook) {
        setSignupSuccess(true); 
        const timer = setTimeout(() => {
            navigate('/home', { replace: true }); 
        }, 2000); 
        return () => clearTimeout(timer);
    }
  }, [user, authErrorHook, navigate]);
  
  useEffect(() => {
    if (authErrorHook) {
      setLocalError(authErrorHook.message || "Sign up failed. Please try again.");
      setSignupSuccess(false); 
    } else {
      setLocalError(null); 
    }
  }, [authErrorHook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSignupSuccess(false);

    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setLocalError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setLocalError("Please enter a valid email address.");
        return;
    }

    await signUpWithPassword({ 
      email, 
      password,
      options: {
        data: {
          username: username.trim(),
          profileType: profileType,
        }
      }
    });
  };

  const handleGoogleSignUp = async () => {
    setLocalError(null);
    setSignupSuccess(false);
    await signInWithGoogle();
  };
  
  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-teal-500 focus:border-teal-500"; // Changed focus color
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-200";

  return (
    <div className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <div>
          <img className="mx-auto h-16 w-auto" src="/logo.png" alt={`${APP_NAME} logo`} />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-50">
            Create your {APP_NAME} Account
          </h2>
        </div>
        {localError && (
          <div role="alert" className="bg-red-800 bg-opacity-40 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
            {localError}
          </div>
        )}
        {signupSuccess && !authErrorHook && ( 
            <div role="alert" className="bg-green-800 bg-opacity-50 border border-green-700 text-green-300 px-4 py-3 rounded-md text-sm">
                Sign up successful! Welcome to {APP_NAME}. Redirecting you...
            </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} aria-labelledby="signup-heading">
          <h3 id="signup-heading" className="sr-only">Sign Up Form</h3>
          <div>
            <label htmlFor="username" className={labelClass}>
              Username <span className="text-red-400">*</span>
            </label>
            <input id="username" name="username" type="text" required aria-required="true" value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputClass} mt-1`} placeholder="YourUsername" />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email address <span className="text-red-400">*</span>
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required aria-required="true" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1`} placeholder="you@example.com" />
          </div>
          
          <div>
            <label htmlFor="profileType" className={labelClass}>I am a... <span className="text-red-400">*</span></label>
            <select 
                id="profileType" 
                name="profileType" 
                value={profileType} 
                onChange={(e) => setProfileType(e.target.value as UserProfile['profileType'])} 
                required
                aria-required="true" 
                className={`${inputClass} mt-1 text-gray-100`}
            >
                <option value="Fan" className="bg-gray-700">Fan</option>
                <option value="Player" className="bg-gray-700">Player</option>
                <option value="Scorer" className="bg-gray-700">Scorer</option>
                <option value="Organizer" className="bg-gray-700">Tournament Organizer</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password <span className="text-red-400">*</span> (min. 6 characters)
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password" required aria-required="true" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} mt-1`} placeholder="••••••••" />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required aria-required="true" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} mt-1`} placeholder="••••••••" />
          </div>

          <div>
            <Button type="submit" isLoading={authLoading} disabled={authLoading || signupSuccess} className="w-full text-lg" variant="primary" size="lg">
              {authLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Or sign up with</span>
          </div>
        </div>

        <div>
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            isLoading={authLoading && !localError} 
            disabled={authLoading || signupSuccess}
            className="w-full bg-white text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 border border-gray-300" // Google button focus ring
            size="lg"
            aria-label="Sign up with Google"
          >
            <GoogleIcon />
            Sign up with Google
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-teal-400 hover:text-teal-300 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;