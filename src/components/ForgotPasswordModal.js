import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Copy, Check, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [stage, setStage] = useState(1);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const passwordRef = useRef(null);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
const cooldownDuration = 5 * 60; // 5 minutes in seconds

useEffect(() => {
    if (isOpen) {
      const hasCooldown = checkCooldown();
      if (!hasCooldown) {
        resetForm();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (stage === 4 && timeLeft === 0) {
      setStage(5);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, stage]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    let timer;
    if (isCooldownActive && cooldownTimeLeft > 0) {
      timer = setTimeout(() => setCooldownTimeLeft(cooldownTimeLeft - 1), 1000);
    } else if (isCooldownActive && cooldownTimeLeft <= 0) {
      setIsCooldownActive(false);
    }
    return () => clearTimeout(timer);
  }, [isCooldownActive, cooldownTimeLeft]);

  const resetForm = () => {
    setStage(1);
    setEmail('');
    setFirstName('');
    setLastName('');
    setUserType('');
    setAdditionalInfo('');
    setPassword('');
    setErrors({});
    setTimeLeft(0);
    setShowPassword(false);
    setCopied(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const copyToClipboard = () => {
    if (passwordRef.current) {
      navigator.clipboard.writeText(password)
        .then(() => {
          setCopied(true);
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    if (!email) {
      setErrors({ email: 'Email is required' });
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/forgot-password/verify-email', { email });
      if (response.data.exists) {
        setStage(2);
      } else {
        setErrors({ email: 'Email not found. Please check and try again.' });
      }
    } catch (error) {
      setErrors({ email: error.response?.data?.error || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNames = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    const newErrors = {};
    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/forgot-password/verify-names', { 
        email, 
        firstName, 
        lastName 
      });
      
      if (response.data.verified) {
        setUserType(response.data.userType);
        setStage(3);
      } else {
        setErrors({ form: 'Name verification failed. Please check and try again.' });
      }
    } catch (error) {
      setErrors({ form: error.response?.data?.error || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAdditionalInfo = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    if (!additionalInfo) {
      setErrors({ additionalInfo: 'This information is required' });
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/forgot-password/retrieve-password', { 
        email, 
        firstName, 
        lastName,
        userType,
        additionalInfo 
      });
      
      if (response.data.success) {
        setPassword(response.data.password);
        setTimeLeft(60);
        setStage(4);
        localStorage.setItem('lastPasswordResetTime', Date.now().toString());
      } else {
        setErrors({ additionalInfo: 'Verification failed. Please check your information and try again.' });
      }
    } catch (error) {
      setErrors({ additionalInfo: error.response?.data?.error || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalConfirmation = async (e) => {
    e.preventDefault();
    setStage(4);
  };

  const getAdditionalInfoLabel = () => {
    switch (userType) {
      case 'Student':
        return 'Enter your institution name:';
      case 'Researcher':
        return 'Enter your organization name:';
      case 'Teacher':
        return 'Enter your institution name:';
      default:
        return 'Additional verification:';
    }
  };

  const checkCooldown = () => {
    const lastResetTime = localStorage.getItem('lastPasswordResetTime');
    if (lastResetTime) {
      const elapsedTime = Math.floor((Date.now() - parseInt(lastResetTime)) / 1000);
      if (elapsedTime < cooldownDuration) {
        setIsCooldownActive(true);
        setCooldownTimeLeft(cooldownDuration - elapsedTime);
        return true;
      }
    }
    return false;
  };

  if (!isOpen) return null;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const formVariants = {
    hidden: { x: 20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: {
      x: -20,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.03 },
    tap: { scale: 0.97 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
        >
          <motion.div 
            className="bg-white rounded-lg w-full max-w-md relative overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isCooldownActive ? (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Cooldown</h2>
                <motion.div 
                  className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-6"
                >
                  <p className="text-amber-700">
                    You've recently reset your password. For security reasons, you need to wait before requesting another reset.
                  </p>
                  <div className="mt-4 flex items-center">
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-amber-500 h-2"
                        initial={{ width: `${(cooldownTimeLeft / cooldownDuration) * 100}%` }}
                        animate={{ width: "0%" }}
                        transition={{ duration: cooldownTimeLeft, ease: "linear" }}
                      />
                    </div>
                    <p className="text-amber-600 ml-3 text-sm whitespace-nowrap">
                      {Math.floor(cooldownTimeLeft / 60)}:{(cooldownTimeLeft % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </motion.div>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Close
                </motion.button>
              </div>
            ) : (
              <>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
                >
                  <X className="h-5 w-5" />
                </motion.button>
            
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`progress-${stage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">Reset Your Password</h2>
                    <span className="text-sm text-gray-500">Step {stage} of {stage >= 4 ? 4 : 5}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-indigo-600 h-2 rounded-full"
                      initial={{ width: `${(stage - 1) * 25}%` }}
                      animate={{ width: `${stage * 25}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {stage === 1 && (
                  <motion.div
                    key="email-stage"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <p className="text-gray-600 mb-6">
                      Please enter the email address associated with your account. We'll verify this email before proceeding.
                    </p>
                    <form onSubmit={handleSubmitEmail}>
                      <div className="mb-6">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            id="email"
                            placeholder="e.g. johndoe@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                            required
                          />
                          {errors.email && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center mt-2 text-red-500 text-sm"
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span>{errors.email}</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex items-center justify-center"
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {stage === 2 && (
                  <motion.div
                    key="names-stage"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <p className="text-gray-600 mb-6">
                      Please provide your first and last name as registered in our system.
                    </p>
                    <form onSubmit={handleSubmitNames}>
                      <div className="mb-4">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={`w-full px-4 py-3 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                          required
                        />
                        {errors.firstName && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center mt-2 text-red-500 text-sm"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span>{errors.firstName}</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="mb-6">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={`w-full px-4 py-3 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                          required
                        />
                        {errors.lastName && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center mt-2 text-red-500 text-sm"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span>{errors.lastName}</span>
                          </motion.div>
                        )}
                      </div>
                      {errors.form && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 flex items-center"
                        >
                          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>{errors.form}</span>
                        </motion.div>
                      )}
                      <div className="flex space-x-3">
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="button"
                          onClick={() => setStage(1)}
                          className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                          <ArrowLeft className="mr-2 h-5 w-5" />
                          Back
                        </motion.button>
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex items-center justify-center"
                        >
                          {isLoading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            <>
                              Continue
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {stage === 3 && (
                  <motion.div
                    key="additional-info-stage"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <form onSubmit={handleSubmitAdditionalInfo}>
                      <div className="mb-6">
                        <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                          {getAdditionalInfoLabel()}
                        </label>
                        <input
                          type="text"
                          id="additionalInfo"
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          className={`w-full px-4 py-3 border ${errors.additionalInfo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                          required
                        />
                        {errors.additionalInfo && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center mt-2 text-red-500 text-sm"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span>{errors.additionalInfo}</span>
                          </motion.div>
                        )}
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-indigo-50 border border-indigo-100 p-4 rounded-md mb-6"
                      >
                        <h3 className="font-medium text-indigo-800 mb-2">Confirm Your Information</h3>
                        <p className="text-sm text-indigo-700 mb-1">
                          <span className="font-medium">Name:</span> {firstName} {lastName}
                        </p>
                        <p className="text-sm text-indigo-700 mb-1">
                          <span className="font-medium">Email:</span> {email}
                        </p>
                        <p className="text-sm text-indigo-700">
                          <span className="font-medium">User Type:</span> {userType}
                        </p>
                      </motion.div>

                      <motion.div 
                        className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <p className="text-sm">
                          <strong>Please Note:</strong> This process will reset your current password. After confirmation, you'll receive a new temporary password that you'll need to use for your next login.
                        </p>
                      </motion.div>

                      <div className="flex space-x-3">
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="button"
                          onClick={() => setStage(2)}
                          className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                          <ArrowLeft className="mr-2 h-5 w-5" />
                          Back
                        </motion.button>
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex items-center justify-center"
                        >
                          {isLoading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            "Reset Password"
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {stage === 4 && (
                  <motion.div
                    key="password-stage"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.div 
                      className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md mb-6"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <p className="font-medium">Password Reset Successful!</p>
                      <p className="text-sm mt-1">Your new password has been generated.</p>
                    </motion.div>
                    
                    <div className="mb-6">
                      <p className="text-gray-700 mb-3 font-medium">Your new password is:</p>
                      <motion.div 
                        className="bg-gray-100 p-4 rounded-md font-mono text-center border border-gray-300 relative"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span ref={passwordRef} className="text-xl">
                          {showPassword ? password : '•'.repeat(password.length)}
                        </span>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="text-gray-500 hover:text-gray-700 mr-2"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={copyToClipboard}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="Copy password to clipboard"
                          >
                            {copied ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <Copy className="h-5 w-5" />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                      <motion.div 
                        className="mt-3 flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <motion.div
                            className="bg-red-500 h-2"
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: timeLeft, ease: "linear" }}
                          />
                        </div>
                        <p className="text-red-600 ml-3 text-sm whitespace-nowrap">
                          {timeLeft}s
                        </p>
                      </motion.div>
                      <motion.p 
                        className="text-gray-600 mt-3 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        Please save this password somewhere safe. You will need it to log in. 
                        For security reasons, this password will only be visible for a limited time.
                      </motion.p>
                    </div>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={onClose}
                      className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Close
                    </motion.button>
                  </motion.div>
                )}

                {stage === 5 && (
                  <motion.div
                    key="expired-stage"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.div 
                      className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-6 flex items-center"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <AlertCircle className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
                      <p className="text-amber-700">
                        For security reasons, the password is no longer visible. If you didn't save your new password, please restart the process.
                      </p>
                    </motion.div>
                    <div className="flex space-x-3">
                      
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={onClose}
                        className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Close
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
}