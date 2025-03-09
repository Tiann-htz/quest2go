import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useRouter } from 'next/router';
import axios from 'axios';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [adminFormData, setAdminFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  
  const router = useRouter();

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

  const handleChange = (e, isAdmin = false) => {
    const { name, value } = e.target;
    if (isAdmin) {
      setAdminFormData({ ...adminFormData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLogin = async (e, isAdmin = false) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = isAdmin ? adminFormData : formData;
      const endpoint = isAdmin ? '/api/admin/login' : '/api/login';
      
      const response = await axios.post(endpoint, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        router.push(isAdmin ? '/admin/panel' : '/home');
      }, 2000);
    } catch (error) {
      console.error('Login error:', error);
      setShowErrorAlert(true);
      setErrorMessage(error.response?.data?.error || 'An error occurred during login');
      setTimeout(() => setShowErrorAlert(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const lastResetTime = localStorage.getItem('lastPasswordResetTime');
    if (lastResetTime) {
      const elapsedTime = Math.floor((Date.now() - parseInt(lastResetTime)) / 1000);
      const cooldownDuration = 5 * 60; // 5 minutes in seconds
      
      if (elapsedTime < cooldownDuration) {
        // Show cooldown alert
        setErrorMessage(`Please wait ${Math.ceil((cooldownDuration - elapsedTime) / 60)} minutes before requesting another password reset.`);
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
        return;
      }
    }
    
    setShowForgotPasswordModal(true);
  };
  
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex space-x-2">
          <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce delay-0"></div>
          <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
          <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Head>
        <title>Login - Quest2Go</title>
        <meta name="description" content="Login to Quest2Go" />
      </Head>

      <div className="relative mb-80 w-full max-w-4xl mx-4">
        <AnimatePresence initial={false} custom={showAdminLogin ? 1 : -1}>
          {!showAdminLogin ? (
            <motion.div
              key="user"
              custom={-1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0"
            >
              <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
                <div className="p-8 md:w-1/2">
                  <div className="flex items-center space-x-3 mb-6">
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
                  <form onSubmit={(e) => handleLogin(e, false)} className="space-y-6">
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
                        onChange={(e) => handleChange(e, false)}
                      />
                    </div>
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
                          onChange={(e) => handleChange(e, false)}
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
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Login
                    </button>
                  </form>
                  <div className="mt-2 text-center">
                  <button
    type="button"
    onClick={handleForgotPassword}
    className="text-sm text-indigo-600 hover:text-indigo-500"
  >
    Forgot Password?
  </button>
</div>
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
                        Sign up
                      </Link>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAdminLogin(true)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-white"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                    <span className="sr-only">Admin Login</span>
                  </button>
                </div>
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
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0"
            >
              <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
                <div className="p-8 md:w-1/2">
                  <div className="flex items-center space-x-3 mb-6">
                    <button
                      onClick={() => setShowAdminLogin(false)}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
                  </div>
                  
                  <form onSubmit={(e) => handleLogin(e, true)} className="space-y-6">
                    <div>
                      <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="admin-email"
                        name="email"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={adminFormData.email}
                        onChange={(e) => handleChange(e, true)}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          id="admin-password"
                          name="password"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                          value={adminFormData.password}
                          onChange={(e) => handleChange(e, true)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showAdminPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Login as Admin'}
                    </button>
                  </form>
                </div>

                <div className="hidden md:flex bg-gray-800 p-8 items-center justify-center md:w-1/2">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Admin Portal</h1>
                    <p className="text-gray-300">Manage Quest2Go platform and users</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts */}
        <AnimatePresence>
          {showSuccessAlert && (
            <motion.div
              className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-30"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium text-gray-900">Login successful!</p>
                      <p className="mt-1 text-sm text-gray-500">Redirecting...</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {showErrorAlert && (
            <motion.div
              className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-30"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50}}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-sm w-full bg-red-50 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <ForgotPasswordModal 
  isOpen={showForgotPasswordModal} 
  onClose={() => setShowForgotPasswordModal(false)} 
/>
    </div>
  );
}