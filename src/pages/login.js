import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();

  // Check if the user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/user');
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/login', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        router.push('/home');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setShowErrorAlert(true);
      setErrorMessage(error.response?.data?.error || 'An error occurred during login');
      setTimeout(() => setShowErrorAlert(false), 3000);
    }
  };

  const alertVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Head>
        <title>Login - Quest2Go</title>
        <meta name="description" content="Login to Quest2Go and access unpublished research in Davao City." />
      </Head>

      {/* Login Container */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl w-full mx-4 md:mx-0 flex flex-col md:flex-row">
        {/* Left Side: Login Form */}
        <div className="p-8 md:w-1/2">
          <div className="flex items-center space-x-3 mb-6">
            {/* Mobile Logo - Only shows on mobile */}
            <Link href="/" className="md:hidden">
              <Image
                src="/Logo/q2glogo.png"
                alt="Quest2Go Logo"
                width={40}
                height={40}
                className="w-8 h-8 cursor-pointer"
              />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Login
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: Logo Section */}
        <div className="hidden md:flex bg-indigo-600 p-8 items-center justify-center md:w-1/2">
          <Link href="/" className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <h1 className="text-4xl font-bold">
                  <span className="text-white">Quest</span>
                  <span className="text-gray-200">2Go</span>
                </h1>
                <p className="mt-4 text-gray-200 text-lg" style={{ fontFamily: 'Quicksand' }}>
                  Connect • Discover • Share
                </p>
                <p className="mt-2 text-gray-300 text-sm">
                  Your Gateway to Discovering Valuable Unpublished Research
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Alerts */}
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
                      Login successful!
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Redirecting to the home page...
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
