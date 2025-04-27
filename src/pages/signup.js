import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    institution: "",
    yearLevel: "",
    course: "",
    organization: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const router = useRouter();

  // Check password strength whenever password changes
  useEffect(() => {
    const password = formData.password;
    setPasswordValidation({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  }, [formData.password]);

  // Check if passwords match
  useEffect(() => {
    if (formData.confirmPassword === "" || formData.password === "") {
      setPasswordsMatch(true);
    } else {
      setPasswordsMatch(formData.password === formData.confirmPassword);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const isPasswordStrong = () => {
    return Object.values(passwordValidation).every(criteria => criteria === true);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!isPasswordStrong()) {
      setShowErrorAlert(true);
      setErrorMessage('Please create a stronger password');
      setTimeout(() => setShowErrorAlert(false), 3000);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setShowErrorAlert(true);
      setErrorMessage('Passwords do not match');
      setTimeout(() => setShowErrorAlert(false), 3000);
      return;
    }

    try {
      const response = await axios.post('/api/signup', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setShowErrorAlert(true);
      setErrorMessage(error.response?.data?.error || 'An error occurred during signup');
      setTimeout(() => setShowErrorAlert(false), 3000);
    }
  };

  const alertVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <Head>
        <title>Sign Up - Quest2Go</title>
        <meta name="description" content="Sign up for Quest2Go and access unpublished research in Davao City." />
      </Head>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-3xl mx-4 p-6">
        <div className="flex items-center justify-center mb-6 mr-4 space-x-3">
          <Link href="/" className="hidden sm:block">
            <Image
              src="/Logo/quest1.png"
              alt="Quest2Go Logo"
              width={200}
              height={200}
              className="w-12 h-14 sm:w-36 sm:h-22 object-fill"
            />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">You are a:</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="Student"
                  checked={formData.userType === 'Student'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Student</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="Teacher"
                  checked={formData.userType === 'Teacher'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Teacher</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="Researcher"
                  checked={formData.userType === 'Researcher'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Researcher</span>
              </label>
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.userType === 'Teacher' && (
            <div className="space-y-4">
              <div className="sm:col-span-2">
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                  Name of Institution
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  value={formData.institution}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
          {formData.userType && (
            <div className="space-y-4">
              {formData.userType === 'Student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                      Name of Institution
                    </label>
                    <input
                      type="text"
                      id="institution"
                      name="institution"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      value={formData.institution}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700">
                      Year Level
                    </label>
                    <input
                      type="text"
                      id="yearLevel"
                      name="yearLevel"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      value={formData.yearLevel}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                      Type of Degree
                    </label>
                    <input
                      type="text"
                      id="course"
                      name="course"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      value={formData.course}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {formData.userType === 'Researcher' && (
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                    Name of Organization
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Email Input */}
          <div className="pt-4 border-t border-gray-200">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`mt-1 block w-full px-3 py-2 border ${!isPasswordStrong() && formData.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10`}
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password strength indicators */}
              <div className="mt-2 text-xs">
                <p className="font-medium text-gray-700 mb-1">Password must contain:</p>
                <ul className="space-y-1">
                  <li className={passwordValidation.hasMinLength ? "text-green-600" : "text-red-600"}>
                    ✓ At least 8 characters
                  </li>
                  <li className={passwordValidation.hasUppercase ? "text-green-600" : "text-red-600"}>
                    ✓ At least 1 uppercase letter (A-Z)
                  </li>
                  <li className={passwordValidation.hasLowercase ? "text-green-600" : "text-red-600"}>
                    ✓ At least 1 lowercase letter (a-z)
                  </li>
                  <li className={passwordValidation.hasNumber ? "text-green-600" : "text-red-600"}>
                    ✓ At least 1 number (0-9)
                  </li>
                  <li className={passwordValidation.hasSpecialChar ? "text-green-600" : "text-red-600"}>
                    ✓ At least 1 special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`mt-1 block w-full px-3 py-2 border ${!passwordsMatch && formData.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10`}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password match indicator */}
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-2 text-xs text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>
          </div>

          {/* Sign Up Button and Login Link */}
          <div className="flex flex-col items-center space-y-4 pt-6">
            <button
              type="submit"
              className="w-full sm:w-96 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors text-lg font-semibold"
            >
              Sign Up
            </button>
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showSuccessAlert && (
          <motion.div
            className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-30"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={alertVariants}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">
                      Account successfully created!
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      You will be redirected to the login page shortly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showErrorAlert && (
          <motion.div
            className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-30"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={alertVariants}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-sm w-full bg-red-50 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}