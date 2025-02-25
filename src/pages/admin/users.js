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
  Search,
  UserPlus,
  Mail,
  Phone
} from 'lucide-react';
import axios from 'axios';

export default function Users() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([
      // Sample user data
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Educator',
        status: 'Active',
        joinDate: '2024-01-15'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Researcher',
        status: 'Active',
        joinDate: '2024-02-01'
      }
    ]);
  
    useEffect(() => {
      // Simulate loading user data
      setTimeout(() => {
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
          <title>User Management - Quest2Go Admin</title>
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
  
                  <div className="flex-1 px-4 flex justify-between">
                    <div className="flex-1 flex">
                      <div className="w-full flex md:ml-0">
                        <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                          
                        </div>
                      </div>
                    </div>
  
                    {/* Right-aligned items */}
                    <div className="flex items-center space-x-6">
                     
  
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
            </div>
  
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
              <main className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add New User
                  </button>
                </div>
  
                {/* Users Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-400" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.joinDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              <Mail className="w-5 h-5" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Phone className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }