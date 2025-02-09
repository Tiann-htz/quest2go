import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import AdminSidebar from './AdminSidebar';
import { 
  User, 
  Bell, 
  ChevronDown,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';

export default function AdminPanel() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEducators: 0,
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

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
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

                  <button className="text-gray-500 hover:text-gray-700 relative">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                  </button>

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
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
                  <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900">Educators</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.totalEducators}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900">Researchers</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalResearchers}</p>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium text-gray-900">Registered Users</h2>
                </div>
                <div className="border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.account_id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.user_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                                Edit
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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