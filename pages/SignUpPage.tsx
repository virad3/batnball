import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { APP_NAME } from '../constants';
import { UserProfile } from '../types'; 
import { useAuth } from '../contexts/AuthContext';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUpWithPassword, loading: authLoading, error: authError, user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileType, setProfileType] = useState<UserProfile['profileType']>('Fan');
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (user && !authError) { // If user object exists after potential signup and no error
      // This might indicate auto-login or that the user was already logged in.
      // Or if email verification is off.
      // navigate('/home'); // Decided to let user manually login after sign up confirmation
    }
  }, [user, navigate, authError]);
  
  useEffect(() => {
    if (authError) {
      setLocalError(authError.message || "Sign up failed. Please try again.");
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSignupSuccess(false);

    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setLocalError("Please fill in all fields.");
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
          profile_type: profileType,
          // Supabase stores this in `raw_user_meta_data` on the auth.users table by default.
          // You might also want a trigger to copy this to a separate `profiles` table.
        }
      }
    });

    // Check if there was no authError after the attempt.
    // authError is updated asynchronously by the context.
    // A slight delay or checking a ref might be needed for instant feedback.
    // For now, if no immediate error is set by this component's logic, assume success message is safe.
    // The actual user object creation might depend on email verification.
    if (!authError && !localError) { // Check localError again because it might be set above
         // Check if authError in the context became non-null after a brief moment
        setTimeout(() => {
            if (!authError) { // Re-check authError from context
                 setSignupSuccess(true);
            }
        }, 200); // Small delay to allow context to update
    }
  };
  
  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-red-500 focus:border-red-500";
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
          <div className="bg-red-800 bg-opacity-40 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
            {localError}
          </div>
        )}
        {signupSuccess && !authError && (
            <div className="bg-green-800 bg-opacity-50 border border-green-700 text-green-300 px-4 py-3 rounded-md text-sm">
                Sign up successful! Please check your email to confirm your account.
            </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className={labelClass}>
              Username <span className="text-red-400">*</span>
            </label>
            <input id="username" name="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputClass} mt-1`} placeholder="YourUsername" />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email address <span className="text-red-400">*</span>
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1`} placeholder="you@example.com" />
          </div>
          
          <div>
            <label htmlFor="profileType" className={labelClass}>I am a... <span className="text-red-400">*</span></label>
            <select 
                id="profileType" 
                name="profileType" 
                value={profileType} 
                onChange={(e) => setProfileType(e.target.value as UserProfile['profileType'])} 
                required 
                className={`${inputClass} mt-1 text-gray-100`}
            >
                <option value="Fan" className="bg-gray-700">Fan</option>
                <option value="Scorer" className="bg-gray-700">Scorer</option>
                <option value="Organizer" className="bg-gray-700">Tournament Organizer</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password <span className="text-red-400">*</span> (min. 6 characters)
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} mt-1`} placeholder="••••••••" />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} mt-1`} placeholder="••••••••" />
          </div>

          <div>
            <Button type="submit" isLoading={authLoading} disabled={authLoading || signupSuccess} className="w-full text-lg" variant="primary" size="lg">
              {authLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-red-500 hover:text-red-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;