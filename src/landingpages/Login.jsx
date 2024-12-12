import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { notifySuccess, notifyError } from "../general/CustomToast.js"

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
        navigate('/owner/messages');
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
    <section className="login-content flex justify-center items-center min-h-screen pt-40 pb-8 px-[9%] bg-[#CACACA]" id="login">
      <div className="text-white bg-[#2F424B] p-8 w-[500px] h-[500px] rounded">
        <h2 className="text-[3.2rem] font-bold text-center text-[#EDF5FC]">Log In</h2>
        <form onSubmit={handleLogin} className="mt-8">
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-72 p-2 mt-2 mb-4 ml-20 text-black rounded"
          /><br />
          <div className="relative w-72 ml-20">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-2 mb-4 text-black rounded"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              <img
                src={showPassword ? "/assets/stash--eye-opened-solid.svg" : "/assets/stash--eye-closed-solid.svg"}
                alt={showPassword ? "Hide Password" : "Show Password"}
                className="w-5 h-5"
              />
            </button>
          </div>
          <button type="submit" className="px-4 py-2 mt-4 ml-44 mb-4 text-xl bg-[#37474F] rounded-full hover:bg-[#576c75]">
            Login
          </button>
        </form>
        <span className="ml-24 cursor-default">
          Forgot Password?
          <button
            onClick={handleForgotPassword}
            className="text-[#4FBDBA] hover:text-white pl-2 underline"
          >
            Reset here
          </button>
        </span>
        <br />
        <span className="ml-24 cursor-default">
          No account?
          <Link to="/register" className="text-[#4FBDBA] hover:text-white pl-2 underline">
            Register here
          </Link>
        </span>
      </div>
    </section>
  );
}

export default Login;