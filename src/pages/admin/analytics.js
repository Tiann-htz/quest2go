import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminSidebar from './AdminSidebar';
import { 
  Menu, 
  Bell, 
  User, 
  ChevronDown, 
  Settings,
  LogOut,
  LineChart,
  BarChart,
  PieChart
} from 'lucide-react';
import axios from 'axios';

export default function Analytics() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalVisits: 0,
    uniqueUsers: 0,
    averageTime: '0:00'
  });

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData({
        totalVisits: 15234,
        uniqueUsers: 5678,
        averageTime: '12:30'
      });
      setIsLoading(false);
    }, 1000);
  }, []);

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
        <title>Analytics - Quest2Go Admin</title>
      </Head>

      <div className="flex h-screen">
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
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
              <div className="flex h-16 items-center justify-between">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <Menu className="w-6 h-6" />
                </button>

                {/* Right-aligned items */}
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
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics & Logs</h1>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <LineChart className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Visits</p>
                      <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalVisits}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <BarChart className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Unique Users</p>
                      <p className="text-2xl font-semibold text-gray-900">{analyticsData.uniqueUsers}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <PieChart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg. Time on Site</p>
                      <p className="text-2xl font-semibold text-gray-900">{analyticsData.averageTime}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Analytics Content */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">System Logs</h2>
                <div className="space-y-4">
                  {/* Sample log entries */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-600">Today 10:30 AM</p>
                    <p className="text-sm text-gray-900">User login successful: admin@quest2go.com</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <p className="text-sm text-gray-600">Today 09:15 AM</p>
                    <p className="text-sm text-gray-900">New study uploaded: "Analysis of Virtual Reality in Education"</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <p className="text-sm text-gray-600">Yesterday 11:45 PM</p>
                    <p className="text-sm text-gray-900">Failed login attempt: unknown@email.com</p>
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