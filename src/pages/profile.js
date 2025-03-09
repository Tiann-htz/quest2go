import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  User, Mail, Lock, Book, School, Building2, 
  ArrowLeft, Save, LogOut, CheckCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';

export default function Profile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('personal');
const [isLoading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize with empty data
  const [user, setUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    user_type: '',
    organization_name: '',
    institution_name: ''
  });
    
  // Form state for updated fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  
  // Password state
  const [passwordChanged, setPasswordChanged] = useState(false);
const [passwordCooldown, setPasswordCooldown] = useState(false);
const [cooldownTimer, setCooldownTimer] = useState(0);
const [showAccountTooltip, setShowAccountTooltip] = useState(false);
  
  // Initialize with empty array
  const [recentRequests, setRecentRequests] = useState([]);
  
  // Fetch user data when component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/profile/user', {
          withCredentials: true
        });
        
        if (response.data && response.data.user) {
          setUser(response.data.user);
          
          // Initialize form data with current values
          setFormData({
            firstName: response.data.user.first_name || '',
            lastName: response.data.user.last_name || '',
            email: response.data.user.email || '',
            password: ''
          });
          
          if (response.data.user.recentRequests) {
            setRecentRequests(response.data.user.recentRequests);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        setError('Failed to load profile data. Please try again later.');
        
        // Redirect to login if unauthorized
        if (error.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [router]);
  
  // Handle cooldown timer
  useEffect(() => {
    let interval;
    
    if (cooldownTimer > 0) {
      interval = setInterval(() => {
        setCooldownTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setPasswordCooldown(false); // Enable password field when timer ends
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownTimer]);

  useEffect(() => {
    if (
      formData.firstName !== user.first_name ||
      formData.lastName !== user.last_name ||
      formData.email !== user.email ||
      (passwordChanged && formData.password.trim() !== '')
    ) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [formData, user, passwordChanged]);
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'text-green-600 bg-green-50';
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      case 'Denied': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const handleLogout = async () => {
    try {
      await axios.post('/api/logout', { logoutType: 'all' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'password' && value !== '') {
      setPasswordChanged(true);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFocusPassword = () => {
    // Clear the password field when focused
    setFormData(prev => ({
      ...prev,
      password: ''
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
        // Only send fields that have changed
        const updateData = {};
        if (formData.firstName !== user.first_name) updateData.firstName = formData.firstName;
        if (formData.lastName !== user.last_name) updateData.lastName = formData.lastName;
        if (formData.email !== user.email) updateData.email = formData.email;
        if (passwordChanged && formData.password.trim() !== '') updateData.password = formData.password;
        
        // Check if there are changes to submit
        if (Object.keys(updateData).length === 0) {
          setError('No changes detected.');
          setIsSubmitting(false);
          return;
        }
      
        const response = await axios.put('/api/profile/update', updateData, {
            withCredentials: true
          });
          
          // Update the user state with new data
          if (response.data && response.data.user) {
            setUser(prev => ({
              ...prev,
              first_name: response.data.user.first_name,
              last_name: response.data.user.last_name,
              email: response.data.user.email
            }));
            
            // Reset form data
            setFormData({
              firstName: response.data.user.first_name,
              lastName: response.data.user.last_name,
              email: response.data.user.email,
              password: ''
            });
            
            setPasswordChanged(false);
            setSuccess('Profile updated successfully.');
            
            // Set password cooldown if password was changed
            if (updateData.password) {
              setPasswordCooldown(true);
              setCooldownTimer(300); // 5 minutes (300 seconds)
            }
            
            // Scroll to top to show the success message
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (error) {
          console.error('Failed to update profile:', error);
          
          if (error.response?.data?.error) {
            setError(error.response.data.error);
          } else {
            setError('An error occurred while updating your profile. Please try again.');
          }
          
          // Scroll to top to show the error message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
          setIsSubmitting(false);
        }
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
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>My Profile - Quest2Go</title>
        <meta name="description" content="Manage your Quest2Go profile and settings" />
      </Head>
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/home" className="flex items-center text-gray-700 hover:text-indigo-600">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            
          </div>
          
          
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 sm:p-8 bg-indigo-50 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {user.first_name ? user.first_name[0] : ''}{user.last_name ? user.last_name[0] : ''}
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{user.first_name} {user.last_name}</h1>
                <p className="text-gray-600">{user.user_type}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-4 py-4 text-sm font-medium flex items-center ${
                  activeTab === 'personal'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="h-4 w-4 mr-2" />
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-4 text-sm font-medium flex items-center ${
                  activeTab === 'activity'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Book className="h-4 w-4 mr-2" />
                Recent Activity
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === 'personal' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                 {/* Password */}
<div>
  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
    Password
  </label>
  <div className="mt-1 relative rounded-md shadow-sm">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Lock className="h-4 w-4 text-gray-400" />
    </div>
    <input
      type="password"
      name="password"
      id="password"
      className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md
        ${passwordCooldown ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      placeholder={passwordChanged ? "New password" : "••••••••"}
      value={formData.password}
      onChange={handleChange}
      onFocus={handleFocusPassword}
      disabled={passwordCooldown}
    />
  </div>
  {passwordCooldown && cooldownTimer > 0 && (
    <p className="mt-1 text-xs text-red-500">
      Password cooldown: {Math.floor(cooldownTimer / 60)}:{(cooldownTimer % 60).toString().padStart(2, '0')}
    </p>
  )}
  <p className="mt-1 text-xs text-gray-500">
    Leave blank to keep current password. Password changes have a 5-minute cooldown.
  </p>
</div>
                </div>
                
                <div className="pt-6 flex justify-end">
  <button
    type="submit"
    disabled={isSubmitting || !hasChanges}
    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
      ${(isSubmitting || !hasChanges) 
        ? 'bg-indigo-400 cursor-not-allowed' 
        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
      }`}
  >
    {isSubmitting ? (
      <>
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Updating...
      </>
    ) : (
      <>
        <Save className="h-4 w-4 mr-2" />
        Update Profile
      </>
    )}
  </button>
</div>
                
                <div className="flex items-center space-x-2 pt-4 relative">
  <div className="flex items-center">
    <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
    <button
      type="button"
      onClick={() => setShowAccountTooltip(!showAccountTooltip)}
      className="text-gray-500 hover:text-gray-700 ml-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
    
    {showAccountTooltip && (
      <div className="absolute left-40 top-10 z-10 mt-2 w-72 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 p-4">
        <p className="text-sm text-white">
          This information cannot be changed. Please contact support if you need to update your account type or institution.
        </p>
      </div>
    )}
  </div>
</div>

                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Type */}
                  <div>
                    <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                      User Type
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <School className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="userType"
                        id="userType"
                        className="bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md cursor-not-allowed"
                        placeholder="User Type"
                        value={user.user_type}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  
                  {/* Institution/Organization */}
                  <div>
                    <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                      Institution/Organization
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="organization"
                        id="organization"
                        className="bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md cursor-not-allowed"
                        placeholder="Institution/Organization"
                        value={user.organization_name || user.institution_name || ''}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
            
            {activeTab === 'activity' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Research Requests</h2>
                
                {recentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {recentRequests.map((request) => (
                      <div key={request.request_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-md font-medium text-gray-900">{request.title}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Requested on: {new Date(request.request_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Book className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">You haven't requested any research studies yet.</p>
                    <Link 
                      href="/home"
                      className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
                    >
                      Explore Research Studies
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}