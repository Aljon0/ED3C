import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { notifySuccess, notifyError } from "../general/CustomToast.js"
import { Eye, EyeOff } from 'lucide-react';
import TermsAndPolicyModal from '../components/TermsAndPolicy';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleAcceptTerms = async () => {
    try {
      if (userData) {
        const userRef = doc(firestore, "Users", userData.id);
        await setDoc(userRef, { hasAcceptedTerms: true }, { merge: true });
        setShowTerms(false);
        notifySuccess('Terms accepted successfully!');
        navigate('/catalog');
      }
    } catch (error) {
      console.error('Error updating terms acceptance:', error);
      notifyError('Failed to update terms acceptance. Please try again.');
    }
  };

  const handleDeclineTerms = async () => {
    await auth.signOut();
    localStorage.removeItem('userRole');
    setShowTerms(false);
    navigate('/login');
    notifyError('You must accept the terms to continue.');
  };

  useEffect(() => {
    // Check if there's an existing session
    const checkSession = async () => {
      if (auth.currentUser) {
        const userRole = localStorage.getItem('userRole');
        // Add check for banned status
        const usersRef = collection(firestore, "Users");
        const q = query(usersRef, where("email", "==", auth.currentUser.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.isBanned) {
            await auth.signOut();
            localStorage.removeItem('userRole');
            notifyError('Your account has been banned. Please contact support for assistance.');
            return;
          }
        }

        if (userRole === 'owner') {
          navigate('/owner/dashboard');
        } else if (userRole === 'customer') {
          navigate('/catalog');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, [auth, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user is banned before attempting to log in
      const usersRef = collection(firestore, "Users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        notifyError('Incorrect email/password.');
        setIsLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.isBanned) {
        notifyError('Your account has been banned. Please contact support for assistance.');
        setIsLoading(false);
        return;
      }

      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Store user role in localStorage for persistence
      localStorage.setItem('userRole', userData.role);

      // Check if user has accepted terms
      const userRef = doc(firestore, "Users", userDoc.id);
      const userSnapshot = await getDoc(userRef);
      const hasAcceptedTerms = userSnapshot.data()?.hasAcceptedTerms || false;

      setUserData({ ...userData, id: userDoc.id });

      if (!hasAcceptedTerms && userData.role === 'customer') {
        setShowTerms(true);
      } else {
        // Route based on user role
        if (userData.role === 'owner') {
          notifySuccess('Login Successfully!');
          navigate('/owner/dashboard');
        } else if (userData.role === 'customer') {
          notifySuccess('Login Successfully!');
          navigate('/catalog');
        }
      }

    } catch (error) {
      console.error('Login error:', error);

      if (error.code === 'auth/invalid-credential') {
        notifyError('Incorrect email/password.');
      } else if (error.code === 'auth/too-many-requests') {
        notifyError('Your account has been temporarily disabled due to too many failed login attempts.');
      } else {
        notifyError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      notifyError('Please enter your email address first.');
      return;
    }

    setIsLoading(true);
    try {
      const usersRef = collection(firestore, "Users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        notifyError('No user found with this email.');
        return;
      }

      // Check if user is banned before sending reset email
      const userData = querySnapshot.docs[0].data();
      if (userData.isBanned) {
        notifyError('This account has been banned. Please contact support for assistance.');
        return;
      }

      await sendPasswordResetEmail(auth, email);
      notifySuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      notifyError('Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-[#CACACA] to-[#A8A8A8] py-8 px-4 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </section>
    );
  }

  return (
    <>
      <TermsAndPolicyModal
        isOpen={showTerms}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
      <section className="min-h-screen bg-gradient-to-b from-[#CACACA] to-[#A8A8A8] py-8 px-4">
        <div className="max-w-xs sm:max-w-sm md:max-w-md mx-auto bg-[#2F424B] rounded-lg shadow-2xl mt-24 sm:mt-16 md:mt-24">
          <div className="p-4 sm:p-5">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-[#EDF5FC] mb-4 sm:mb-6">Log In</h2>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all text-sm sm:text-base"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all pr-10 text-sm sm:text-base"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#EDF5FC]/60 hover:text-[#EDF5FC]/80 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="pt-2 pb-1 space-y-3">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-[#4FBDBA] text-white rounded-md hover:bg-[#4FBDBA]/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4FBDBA] focus:ring-offset-1 focus:ring-offset-[#2F424B] text-sm sm:text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Log In'}
                </button>
              </div>
            </form>

            <div className="mt-4 space-y-2 text-center">
              <p className="text-[#EDF5FC]/80 text-xs sm:text-sm">
                Forgot Password?{' '}
                <button
                  onClick={handleForgotPassword}
                  className="text-[#4FBDBA] hover:text-[#4FBDBA]/80 transition-colors"
                >
                  Reset here
                </button>
              </p>
              <p className="text-[#EDF5FC]/80 text-xs sm:text-sm">
                No account?{' '}
                <Link
                  to="/register"
                  className="text-[#4FBDBA] hover:text-[#4FBDBA]/80 transition-colors"
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Login;