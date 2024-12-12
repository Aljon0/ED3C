import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '../firebase';

function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        surname: '',
        contact: '',
        address: ''
    });

    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    // Handle all input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return 'Email is required';
        if (!emailRegex.test(email)) return 'Invalid email format';
        return '';
    };

    const validatePassword = (password) => {
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const validateConfirmPassword = (confirmPassword, password) => {
        if (!confirmPassword) return 'Please confirm your password';
        if (confirmPassword !== password) return 'Passwords do not match';
        return '';
    };

    const validateName = (name, field) => {
        if (!name) return `${field} is required`;
        if (name.length < 2) return `${field} must be at least 2 characters`;
        return '';
    };

    const validateContact = (contact) => {
        const contactRegex = /^(09|\+639)\d{9}$/;
        if (!contact) return 'Contact number is required';
        if (!contactRegex.test(contact)) return 'Invalid contact number format (e.g., 09XXXXXXXXX or +639XXXXXXXXX)';
        return '';
    };

    const validateAddress = (address) => {
        if (!address) return 'Address is required';
        if (address.length < 10) return 'Please enter a complete address';
        return '';
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const newErrors = {
            email: validateEmail(formData.email),
            password: validatePassword(formData.password),
            confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password),
            firstName: validateName(formData.firstName, 'First name'),
            surname: validateName(formData.surname, 'Surname'),
            contact: validateContact(formData.contact),
            address: validateAddress(formData.address)
        };

        const actualErrors = Object.fromEntries(
            Object.entries(newErrors).filter(([_, value]) => value !== '')
        );

        setErrors(actualErrors);

        if (Object.keys(actualErrors).length > 0) {
            return;
        }

        try {
            const auth = getAuth();
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Store additional user information in Firestore
            await setDoc(doc(db, 'Users', user.uid), {
                email: formData.email,
                firstName: formData.firstName,
                surname: formData.surname,
                contact: formData.contact,
                address: formData.address,
                role: 'customer'
            });

            alert('Registration successful! Please log in.');
            navigate('/login');
        } catch (err) {
            console.error('Registration error: ', err);
            setErrors(prev => ({
                ...prev,
                submit: 'Registration failed. Please try again.'
            }));
        }
    };

    return (
        <section className="login-content flex justify-center items-center min-h-screen pt-24 pb-8 px-[9%] bg-[#CACACA]" id="register">
            <div className="text-white bg-[#2F424B] px-8 w-[1200px] h-auto py-8 rounded">
                <h2 className="text-[3.2rem] font-bold text-center text-[#EDF5FC]">Create Account</h2>
                <h6 className="text-center p-2">As</h6>
                <h4 className="text-center text-2xl">Customer</h4>

                {errors.submit && (
                    <p className="text-red-500 text-center mt-4">{errors.submit}</p>
                )}

                <form className="grid grid-cols-2 gap-6 mt-8" onSubmit={handleRegister}>
                    <div>
                        <label htmlFor="email" className="block text-xl">Email :</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`w-full p-2 mt-2 mb-1 text-black rounded ${errors.email ? 'border-2 border-red-500' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className="text-red-500 text-sm mb-2">{errors.email}</p>}

                        <label htmlFor="password" className="block text-xl">Password :</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className={`w-full p-2 mt-2 mb-1 text-black rounded ${errors.password ? 'border-2 border-red-500' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {errors.password && <p className="text-red-500 text-sm mb-2">{errors.password}</p>}

                        <label htmlFor="confirmPassword" className="block text-xl">Confirm Password :</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className={`w-full p-2 mt-2 mb-1 text-black rounded ${errors.confirmPassword ? 'border-2 border-red-500' : ''}`}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mb-2">{errors.confirmPassword}</p>}
                    </div>

                    <div>
                        <label htmlFor="firstName" className="block text-xl">First Name :</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            className={`w-full p-2 mt-2 mb-1 text-black rounded ${errors.firstName ? 'border-2 border-red-500' : ''}`}
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mb-2">{errors.firstName}</p>}

                        <label htmlFor="surname" className="block text-xl">Surname :</label>
                        <input
                            type="text"
                            id="surname"
                            name="surname"
                            className={`w-full p-2 mt-2 mb-1 text-black rounded ${errors.surname ? 'border-2 border-red-500' : ''}`}
                            value={formData.surname}
                            onChange={handleChange}
                        />
                        {errors.surname && <p className="text-red-500 text-sm mb-2">{errors.surname}</p>}

                        <label htmlFor="contact" className="block text-xl">Contact # :</label>
                        <input
                            type="text"
                            id="contact"
                            name="contact"
                            className={`w-full p-2 mt-2 mb-1 text-black rounded ${errors.contact ? 'border-2 border-red-500' : ''}`}
                            value={formData.contact}
                            onChange={handleChange}
                            placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                        />
                        {errors.contact && <p className="text-red-500 text-sm mb-2">{errors.contact}</p>}

                        <label htmlFor="address" className="block text-xl">Address :</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            className={`w-full p-2 mt-2 mb-1 text-black rounded ${errors.address ? 'border-2 border-red-500' : ''}`}
                            value={formData.address}
                            onChange={handleChange}
                        />
                        {errors.address && <p className="text-red-500 text-sm mb-2">{errors.address}</p>}
                    </div>

                    <div className="text-center col-span-2">
                        <button type="submit" className="px-8 py-3 text-xl bg-[#37474F] rounded-full hover:bg-[#2F424B]">Sign Up</button>
                    </div>

                    <p className="text-center col-span-2">Already have an account? <Link to="/login" className="text-[#4FBDBA] hover:underline">Login</Link></p>
                </form>
            </div>
        </section>
    );
}

export default Register;
