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
  MessageSquare,
  MoreVertical,
  Trash2
} from 'lucide-react';
import axios from 'axios';

export default function Chats() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState([
    {
      id: 1,
      user: 'John Doe',
      lastMessage: 'How do I access the research papers?',
      timestamp: '5 mins ago',
      unread: true
    },
    {
      id: 2,
      user: 'Jane Smith',
      lastMessage: 'Thank you for your help!',
      timestamp: '1 hour ago',
      unread: false
    }
  ]);

  useEffect(() => {
    // Simulate loading chat data
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
        <title>Chat Management - Quest2Go Admin</title>
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
                      <div className="relative w-full text-gray-400 focus-within:text-gray-600"><div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                          <Search className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm"
                          placeholder="Search chats..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right-aligned items */}
                  <div className="flex items-center space-x-6">
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
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            <main className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Chat Management</h1>
              </div>

              {/* Chats List */}
              <div className="bg-white shadow rounded-lg">
                <div className="divide-y divide-gray-200">
                  {chats.map((chat) => (
                    <div key={chat.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <MessageSquare className="h-6 w-6 text-indigo-600" />
                            </div>
                          </div>
                          <div>
                            <h2 className="text-lg font-medium text-gray-900">{chat.user}</h2>
                            <div className="flex items-center">
                              <p className="text-sm text-gray-500 truncate max-w-md">{chat.lastMessage}</p>
                              {chat.unread && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{chat.timestamp}</span>
                          <div className="relative">
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                          <button className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
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