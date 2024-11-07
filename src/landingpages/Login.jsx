import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      const userDocRef = doc(firestore, "Users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'owner') {
          navigate('/owner/messages');
        } else if (userData.role === 'customer') {
          navigate('/catalog');
        } else {
          setError('Unknown role. Please contact support.');
        }
      } else {
        setError('No user data found in Firestore.');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No user found with this email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    }
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset the password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent! Please check your inbox.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No user found with this email.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <section className="login-content flex justify-center items-center min-h-screen pt-40 pb-8 px-[9%] bg-[#CACACA]" id="login">
      <div className="text-white bg-[#2F424B] p-8 w-[500px] h-[600px] rounded">
        <h2 className="text-[3.2rem] font-bold text-center text-[#EDF5FC]">Log In</h2>
        <div className="mb-4">
          <label className="block text-lg text-center mb-2">Select Role:</label>
          <select
            value={role}
            onChange={handleRoleChange}
            className="block w-72 p-2 mb-4 ml-20 text-black rounded"
          >
            <option value="customer">Customer</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email/Username"
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
        {error && <p className="text-red-500 text-center">{error}</p>}
        <span className="ml-24 cursor-default">
          Forgot Password?
          <button
            onClick={handleForgotPassword}
            className="text-[#CAD2C5] hover:text-white pl-2 underline"
          >
            Reset here
          </button>
        </span>
        <br />
        <span className="ml-24 cursor-default">
          No account?
          <Link to="/register" className="text-[#CAD2C5] hover:text-white pl-2 underline">
            Register here
          </Link>
        </span>
      </div>
    </section>
  );
}

export default Login;
