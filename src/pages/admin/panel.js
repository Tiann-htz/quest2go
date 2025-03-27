import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image'; 
import AdminSidebar from './AdminSidebar';
import { 
  User, 
  Bell, 
  ChevronDown,
  Settings,
  LogOut,
  Menu,
  Users,
  GraduationCap,
  BookOpen,
  Microscope,
  Building
} from 'lucide-react';

export default function AdminPanel() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalResearchers: 0
  });

  const closeSidebar = useCallback((e) => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    document.addEventListener('click', closeSidebar);
    return () => document.removeEventListener('click', closeSidebar);
  }, [closeSidebar]);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await axios.get('/api/admin/user');
        if (response.data.user && response.data.user.isAdmin) {
          setAdmin(response.data.user);
          fetchUsers();
          fetchStats();
          fetchInstitutions(); // New function to fetch institutions
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // New function to fetch institutions
  const fetchInstitutions = async () => {
    try {
      const response = await axios.get('/api/admin/institutions');
      setInstitutions(response.data.institutions);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/admin/logout');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
        <title>Admin Panel - Quest2Go</title>
      </Head>

      <div className="flex h-screen">
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-30
          transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 flex-shrink-0
        `}>
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <div className="bg-white shadow">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-16">
                {/* Burger Menu Button - Left Side Mobile Only */}
                <div className="flex items-center lg:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSidebarOpen(!isSidebarOpen);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                </div>

                {/* Right-aligned items - Always on right for both mobile and desktop */}
                <div className="flex items-center ml-auto space-x-6">
                  {/* Admin Profile Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-full">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="hidden sm:inline text-gray-700 font-medium">{admin?.username}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200"
                      >
                        
                        <button 
                          onClick={handleLogout}
                          className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-100 w-full"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            <main className="p-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Total Users Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-3 rounded-full mr-4">
                        <Users className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Total Users</h3>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white">
                    <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
                    <p className="text-xs text-indigo-500 mt-1 uppercase tracking-wider">Registered accounts</p>
                  </div>
                </div>
                
                {/* Students Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-full mr-4">
                        <GraduationCap className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Students</h3>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white">
                    <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
                    <p className="text-xs text-purple-500 mt-1 uppercase tracking-wider">Enrolled students</p>
                  </div>
                </div>
                
                {/* Teachers Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Teachers</h3>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white">
                    <p className="text-3xl font-bold text-blue-600">{stats.totalTeachers}</p>
                    <p className="text-xs text-blue-500 mt-1 uppercase tracking-wider">Teaching faculty</p>
                  </div>
                </div>
                
                {/* Researchers Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-3 rounded-full mr-4">
                        <Microscope className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Researchers</h3>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-white">
                    <p className="text-3xl font-bold text-green-600">{stats.totalResearchers}</p>
                    <p className="text-xs text-green-500 mt-1 uppercase tracking-wider">Active researchers</p>
                  </div>
                </div>
              </div>

              {/* New Institutions Section */}
              <div className="bg-white shadow-lg rounded-lg mb-8">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-amber-100 p-3 rounded-full mr-4">
                      <Building className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Partner Institutions</h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {institutions.map((institution, index) => (
                      <div 
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center text-center transform transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                      >
                        <div className="h-24 w-24 relative mb-3 flex items-center justify-center">
                          <Image
                            src={institution.logoPath}
                            alt={institution.name}
                            width={96}
                            height={96}
                            className="object-contain"
                            onError={(e) => {
                              e.target.src = "/Institution/default.png";
                            }}
                          />
                        </div>
                        <h3 className="font-medium text-gray-800 mb-1 text-sm">{institution.name}</h3>
                        <div className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {institution.researchCount} Studies
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}