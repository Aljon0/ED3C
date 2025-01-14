import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword, getAuth, sendPasswordResetEmail } from "firebase/auth";
import { notifySuccess, notifyError } from "../general/CustomToast.js"
import { Eye, EyeOff } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Query Firestore to get user data by email
      const usersRef = collection(firestore, "Users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        notifyError('Incorrect email/password.');
        return;
      }
  
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
  
      // Route based on user role
      if (userData.role === 'owner') {
        notifySuccess('Login Successfully!');
        navigate('/owner/dashboard');
      } else if (userData.role === 'customer') {
        notifySuccess('Login Successfully!');
        navigate('/catalog');
      } else {
        notifyError('Invalid account type. Please contact support.');
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
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      notifyError('Please enter your email address first.');
      return;
    }

    try {
      const usersRef = collection(firestore, "Users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        notifyError('No user found with this email.');
        return;
      }

      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      notifySuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      notifyError('Failed to send password reset email. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#CACACA] to-[#A8A8A8] py-8 px-4">
        <div className="max-w-md mx-auto bg-[#2F424B] rounded-lg shadow-2xl mt-24">
            <div className="p-5">
                <h2 className="text-2xl font-bold text-center text-[#EDF5FC] mb-6">Log In</h2>
                <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#EDF5FC]/90 mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#EDF5FC]/90 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all pr-10"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#EDF5FC]/60 hover:text-[#EDF5FC]/80 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className="pt-2 pb-1 space-y-3">
                        <button 
                            type="submit" 
                            className="w-full px-4 py-2 bg-[#4FBDBA] text-white rounded-md hover:bg-[#4FBDBA]/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4FBDBA] focus:ring-offset-1 focus:ring-offset-[#2F424B]"
                        >
                            Log In
                        </button>
                    </div>
                </form>

                <div className="mt-4 space-y-2 text-center">
                    <p className="text-[#EDF5FC]/80 text-sm">
                        Forgot Password?{' '}
                        <button
                            onClick={handleForgotPassword}
                            className="text-[#4FBDBA] hover:text-[#4FBDBA]/80 transition-colors"
                        >
                            Reset here
                        </button>
                    </p>
                    <p className="text-[#EDF5FC]/80 text-sm">
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
);
}

export default Login;