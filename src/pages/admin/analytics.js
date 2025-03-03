import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import {
  Menu,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Analytics() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  // Analytics data states
  const [studyCategories, setStudyCategories] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [chatMetrics, setChatMetrics] = useState([]);
  const [requestStatus, setRequestStatus] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [studyInstitutions, setStudyInstitutions] = useState([]);

  // Dashboard summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalStudies: 0,
    totalMessages: 0,
    totalRequests: 0,
    averageResponseTime: '0:00'
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await axios.get('/api/admin/user');
        setAdmin(response.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    const fetchAnalyticsData = async () => {
      try {
        // Load all analytics data in parallel
        const [
          studyCategoriesRes,
          userActivityRes,
          chatMetricsRes,
          requestStatusRes,
          recentLogsRes,
          studyInstitutionsRes,
          summaryStatsRes
        ] = await Promise.all([
          axios.get('/api/admin/analytics/studies-by-category'),
          axios.get('/api/admin/analytics/user-activity'),
          axios.get('/api/admin/analytics/chat-metrics'),
          axios.get('/api/admin/analytics/request-status'),
          axios.get('/api/admin/analytics/recent-logs'),
          axios.get('/api/admin/analytics/study-institutions'),
          axios.get('/api/admin/analytics/summary-stats')
        ]);

        setStudyCategories(studyCategoriesRes.data);
        setUserActivity(userActivityRes.data);
        setChatMetrics(chatMetricsRes.data);
        setRequestStatus(requestStatusRes.data);
        setRecentLogs(recentLogsRes.data);
        setStudyInstitutions(studyInstitutionsRes.data);
        setSummaryStats(summaryStatsRes.data);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Fallback to sample data if API endpoints are not yet implemented
        loadSampleData();
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
    fetchAnalyticsData();
  }, []);

  // Fallback function to load sample data if API endpoints are not yet implemented
  const loadSampleData = () => {
    // Sample data based on your database structure
    setStudyCategories([
      { name: 'Education', value: 35 },
      { name: 'Technology', value: 25 },
      { name: 'Health', value: 18 },
      { name: 'Business', value: 15 },
      { name: 'Arts', value: 7 }
    ]);

    setUserActivity([
      { name: 'Jan', Students: 42, Researchers: 28, Teachers: 18 },
      { name: 'Feb', Students: 47, Researchers: 30, Teachers: 22 },
      { name: 'Mar', Students: 52, Researchers: 34, Teachers: 24 },
      { name: 'Apr', Students: 58, Researchers: 37, Teachers: 26 },
      { name: 'May', Students: 63, Researchers: 42, Teachers: 29 },
      { name: 'Jun', Students: 68, Researchers: 45, Teachers: 31 }
    ]);

    setChatMetrics([
      { name: 'Jan', messages: 120 },
      { name: 'Feb', messages: 145 },
      { name: 'Mar', messages: 138 },
      { name: 'Apr', messages: 167 },
      { name: 'May', messages: 189 },
      { name: 'Jun', messages: 201 }
    ]);

    setRequestStatus([
      { name: 'Approved', value: 65 },
      { name: 'Pending', value: 25 },
      { name: 'Denied', value: 10 }
    ]);

    setStudyInstitutions([
      { name: 'University A', value: 28 },
      { name: 'University B', value: 22 },
      { name: 'College C', value: 17 },
      { name: 'Institution D', value: 15 },
      { name: 'Other', value: 18 }
    ]);

    setRecentLogs([
      { timestamp: '2025-02-28 14:22:31', action: 'New study added: "Virtual Reality Applications in Education"', type: 'study' },
      { timestamp: '2025-02-28 13:15:07', action: 'User request approved: user123@example.com for Study #45', type: 'request', userName: 'John Smith', userType: 'Student' },
      { timestamp: '2025-02-28 10:38:52', action: 'New chat message from researcher45 for Study #32', type: 'chat', userName: 'Sarah Johnson', userType: 'Researcher' },
      { timestamp: '2025-02-27 16:54:19', action: 'Study status updated: "AI in Healthcare" is now Available', type: 'study' },
      { timestamp: '2025-02-27 11:30:05', action: 'New access request from student78 for Study #17', type: 'request', userName: 'Emma Davis', userType: 'Teacher' }
    ]);

    setSummaryStats({
      totalStudies: 182,
      totalMessages: 960,
      totalRequests: 347,
      averageResponseTime: '6:24'
    });
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/admin/logout');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'study': return 'border-blue-500';
      case 'request': return 'border-green-500';
      case 'chat': return 'border-purple-500';
      default: return 'border-gray-500';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'Student': return 'text-indigo-600 font-medium';
      case 'Researcher': return 'text-green-600 font-medium';
      case 'Teacher': return 'text-yellow-600 font-medium';
      default: return 'text-gray-700 font-medium';
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
        <title>Analytics Dashboard - Quest2Go Admin</title>
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
                  {/* Admin Profile Dropdown */}
                  <div className="relative">
                      <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-indigo-100 p-2 rounded-full">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="hidden sm:inline text-gray-700 font-medium">
                            {admin?.username || 'Admin'}
                          </span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Studies</p>
                      <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalStudies}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <MessageSquare className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Messages</p>
                      <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalMessages}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Access Requests</p>
                      <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalRequests}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
                      <p className="text-2xl font-semibold text-gray-900">{summaryStats.averageResponseTime}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts - First Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* User Activity Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">User Activity by Type</h2>
                    <div className="relative">
                      <button className="text-gray-500 hover:text-gray-700">
                        <Info className="h-5 w-5" />
                      </button>
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 px-3 z-10 text-sm text-gray-700 hidden">
                        This chart shows the number of active users by type (Students, Researchers, Teachers) for each month.
                      </div>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userActivity}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Students" fill="#8884d8" />
                        <Bar dataKey="Researchers" fill="#82ca9d" />
                        <Bar dataKey="Teachers" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chat Messages Over Time */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Chat Activity Over Time</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chatMetrics}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="messages" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Charts - Second Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Studies by Category */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Studies by Category</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studyCategories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {studyCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Request Status Distribution */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Access Request Status</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={requestStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {requestStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Studies by Institution */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Studies by Institution</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studyInstitutions}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {studyInstitutions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Activity Logs */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Recent Activity Logs</h2>
                  
                  {/* User Type Legend */}
                  <div className="flex space-x-4 text-sm">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 bg-indigo-600 rounded-full mr-1"></span>
                      <span>Students</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-1"></span>
                      <span>Researchers</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 bg-yellow-600 rounded-full mr-1"></span>
                      <span>Teachers</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {recentLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`border-l-4 ${getLogTypeColor(log.type)} pl-4`}
                    >
                      <p className="text-sm text-gray-600">{formatTimestamp(log.timestamp)}</p>
                      <p className="text-sm text-gray-900">
                        {log.userName ? (
                          <>
                            {log.action.split(log.userName)[0]}
                            <span className={getUserTypeColor(log.userType)}>
                              {log.userName}
                            </span>
                            {log.action.split(log.userName)[1]}
                          </>
                        ) : (
                          log.action
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}