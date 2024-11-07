import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ensure firebase.js exports 'auth' and 'db' initialized Firebase services

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [contact, setContact] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        // Check if passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            // Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store additional user data in Firestore
            
            await setDoc(doc(db, 'Users', user.uid), {
                email: user.email,
                firstName: firstName,
                surname: surname,
                contact: contact,
                address: address,
                role: 'customer' 
            });


            // Alert for successful registration
            alert('Registration successful! Please log in.');
            
            // Navigate to login page after successful registration
            navigate('/login');
        } catch (err) {
            console.error('Registration error: ', err);  // Add this to log the exact error
            setError('Registration failed. Please try again.');
        }
        
    };
    
    return (
        <section className="login-content flex justify-center items-center min-h-screen pt-24 pb-8 px-[9%] bg-[#CACACA]" id="register">
            <div className="text-white bg-[#2F424B] px-8 w-[1200px] h-[700px] rounded">
                <h2 className="text-[3.2rem] font-bold text-center text-[#EDF5FC]">Create Account</h2>
                <h6 className="text-center p-2">As</h6>
                <h4 className="text-center text-2xl">Customer</h4>

                {/* Display Error Message */}
                {error && <p className="text-red-500 text-center">{error}</p>}

                {/* Form layout with grid system */}
                <form className="grid grid-cols-2 gap-6 mt-8" onSubmit={handleRegister}>
                    <div>

                        <label htmlFor="email" className="block text-xl">Email :</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="w-full p-2 mt-2 mb-4 text-black rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label htmlFor="password" className="block text-xl">Password :</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="w-full p-2 mt-2 mb-4 text-black rounded"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <label htmlFor="confirm-password" className="block text-xl">Confirm Password :</label>
                        <input
                            type="password"
                            id="confirm-password"
                            name="confirm-password"
                            className="w-full p-2 mt-2 mb-4 text-black rounded"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="firstName" className="block text-xl">First Name :</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            className="w-full p-2 mt-2 mb-4 text-black rounded"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />

                        <label htmlFor="surname" className="block text-xl">Surname :</label>
                        <input
                            type="text"
                            id="surname"
                            name="surname"
                            className="w-full p-2 mt-2 mb-4 text-black rounded"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                            required
                        />

                        <label htmlFor="contact" className="block text-xl">Contact # :</label>
                        <input
                            type="text"
                            id="contact"
                            name="contact"
                            className="w-full p-2 mt-2 mb-4 text-black rounded"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            required
                        />

                        <label htmlFor="address" className="block text-xl">Address :</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            className="w-full p-2 mt-2 mb-4 text-black rounded"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                        />
                    </div>

                    {/* Submit button must be inside the form to trigger form submission */}
                    <div className="text-center col-span-2">
                        <button type="submit" className="px-8 py-3 text-xl bg-[#37474F] rounded-full hover:bg-[#576c75]">
                            Register
                        </button>
                    </div>
                </form>

                {/* Use Link to navigate back to the login page */}
                <span className="block text-center mt-2 cursor-default">
                    Already Have An Account?
                    <Link to="/login" className="text-[#CAD2C5] hover:text-white"> Log In</Link>
                </span>

                <hr className="my-8" />
            </div>
        </section>
    );
}

export default Register;
