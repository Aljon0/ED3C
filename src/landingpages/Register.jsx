import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { notifyError, notifySuccess } from '../general/CustomToast';
import { Eye, EyeOff } from 'lucide-react';

function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [emailExists, setEmailExists] = useState(false);
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    const checkEmailExists = async (email) => {
        const auth = getAuth();
        try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            return signInMethods.length > 0;
        } catch (error) {
            console.error("Error checking email:", error);
            return false;
        }
    };

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


    const handleChange = (e) => {
        const { name, value } = e.target;

        // Special handling for contact number
        if (name === 'contact') {
            // Remove any non-digit characters
            const cleanedValue = value.replace(/\D/g, '');

            // Handle +63 prefix
            if (value.startsWith('+63')) {
                if (cleanedValue.length <= 12) { // +63 + 9 digits
                    setFormData(prev => ({
                        ...prev,
                        [name]: value
                    }));
                }
            } else {
                if (cleanedValue.length <= 11) { // 09 + 9 digits
                    setFormData(prev => ({
                        ...prev,
                        [name]: cleanedValue
                    }));
                }
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

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

        // Additional length validation
        const cleanedNumber = contact.replace(/\D/g, '');
        if (contact.startsWith('+63')) {
            if (cleanedNumber.length !== 12) return 'Contact number must be 12 digits when using +63 prefix';
        } else {
            if (cleanedNumber.length !== 11) return 'Contact number must be 11 digits when using 09 prefix';
        }

        return '';
    };


    const validateAddress = (address) => {
        if (!address) return 'Address is required';
        if (address.length < 10) return 'Please enter a complete address';
        return '';
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setEmailExists(false);

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
            const emailTaken = await checkEmailExists(formData.email);
            if (emailTaken) {
                setEmailExists(true);
                return;
            }

            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await setDoc(doc(db, 'Users', user.uid), {
                email: formData.email,
                firstName: formData.firstName,
                surname: formData.surname,
                contact: formData.contact,
                address: formData.address,
                role: 'customer'
            });

            notifySuccess('Registration successful! Please log in.');
            navigate('/login');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setEmailExists(true);
            } else {
                notifyError('Registration error: ' + err.message);
                setErrors(prev => ({
                    ...prev,
                    submit: 'Registration failed. Please try again.'
                }));
            }
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-b from-[#CACACA] to-[#A8A8A8] py-8 px-4">
            <div className="max-w-xs sm:max-w-sm md:max-w-md mx-auto bg-[#2F424B] rounded-lg shadow-2xl mt-24 sm:mt-16 md:mt-24">
                <div className="p-4 sm:p-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-center text-[#EDF5FC] mb-1">Create Account</h2>
                    <div className="text-center text-[#EDF5FC]/80 space-y-0.5 mb-4">
                        <p className="text-xs sm:text-sm">As</p>
                        <p className="text-base sm:text-lg font-semibold">Customer</p>
                    </div>

                    {emailExists && (
                        notifyError('This email is already registered. Please use a different email or login to your existing account.')
                    )}

                    {errors.submit && (
                        notifyError('errors.submit')
                    )}

                    <form className="space-y-3" onSubmit={handleRegister}>
                        <div>
                            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={`w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all text-xs sm:text-sm ${errors.email ? 'border-red-500' : ''}`}
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    className={`w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all pr-10 text-xs sm:text-sm ${errors.password ? 'border-red-500' : ''}`}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#EDF5FC]/60 hover:text-[#EDF5FC]/80 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className={`w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all pr-10 text-xs sm:text-sm ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={toggleConfirmPasswordVisibility}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#EDF5FC]/60 hover:text-[#EDF5FC]/80 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="firstName" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                className={`w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all text-xs sm:text-sm ${errors.firstName ? 'border-red-500' : ''}`}
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                            {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                        </div>

                        <div>
                            <label htmlFor="surname" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">Surname</label>
                            <input
                                type="text"
                                id="surname"
                                name="surname"
                                className={`w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all text-xs sm:text-sm ${errors.surname ? 'border-red-500' : ''}`}
                                value={formData.surname}
                                onChange={handleChange}
                            />
                            {errors.surname && <p className="text-red-400 text-xs mt-1">{errors.surname}</p>}
                        </div>

                        <div>
                            <label htmlFor="contact" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">Contact #</label>
                            <input
                                type="tel"
                                id="contact"
                                name="contact"
                                className={`w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all text-xs sm:text-sm ${errors.contact ? 'border-red-500' : ''}`}
                                value={formData.contact}
                                onChange={handleChange}
                                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                                maxLength={13} // Allow for +63 format
                            />
                            {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact}</p>}
                            <p className="text-[#EDF5FC]/60 text-xs mt-1">
                                Format: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (13 digits)
                            </p>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-xs sm:text-sm font-medium text-[#EDF5FC]/90 mb-1">Address</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                className={`w-full px-3 py-1.5 bg-[#EDF5FC]/10 border border-[#EDF5FC]/20 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#4FBDBA] transition-all text-xs sm:text-sm ${errors.address ? 'border-red-500' : ''}`}
                                value={formData.address}
                                onChange={handleChange}
                            />
                            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                        </div>

                        <div className="pt-2 pb-1 space-y-3">
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-[#4FBDBA] text-white rounded-md hover:bg-[#4FBDBA]/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4FBDBA] focus:ring-offset-1 focus:ring-offset-[#2F424B] text-sm sm:text-base"
                            >
                                Sign Up
                            </button>
                            <p className="text-[#EDF5FC]/80 text-xs sm:text-sm text-center">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#4FBDBA] hover:text-[#4FBDBA]/80 transition-colors">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default Register;
