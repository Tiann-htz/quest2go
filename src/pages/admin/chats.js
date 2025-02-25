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
} from 'lucide-react';
import axios from 'axios';

export default function Chats() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [requestUsers, setRequestUsers] = useState([]);
  const [userStudies, setUserStudies] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch users with access requests
  useEffect(() => {
    const fetchRequestUsers = async () => {
      try {
        const response = await axios.get('/api/admin/chat/users');
        setRequestUsers(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setIsLoading(false);
      }
    };

    fetchRequestUsers();
  }, []);

  // Fetch studies for selected user
  useEffect(() => {
    const fetchUserStudies = async () => {
      if (selectedUser) {
        try {
          const response = await axios.get(`/api/admin/chat/user-studies/${selectedUser.user_id}`);
          setUserStudies(response.data);
          setSelectedStudy(null); // Reset selected study when user changes
        } catch (error) {
          console.error('Error fetching user studies:', error);
        }
      }
    };

    fetchUserStudies();
  }, [selectedUser]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUser && selectedStudy) {
        try {
          const response = await axios.get('/api/admin/chat/study-messages', {
            params: {
              userId: selectedUser.user_id,
              researchId: selectedStudy.research_id
            }
          });
          setChatMessages(response.data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    fetchMessages();
  }, [selectedUser, selectedStudy]);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await axios.get('/api/admin/user');
        setAdmin(response.data);
      } catch (error) {
        console.error('Error fetching admin info:', error);
      }
    };
  
    fetchAdminInfo();
  }, []);
 
  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !selectedStudy) return;
  
    try {
      const response = await axios.post('/api/admin/chat/reply', {
        userId: selectedUser.user_id,
        researchId: selectedStudy.research_id,
        reply: newMessage
      });
  
      if (response.data.success) {
        setChatMessages(response.data.messages);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
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

  // Filter users based on search term
  const filteredUsers = requestUsers.filter(user => 
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                        
                      </div>
                    </div>
                  </div>

                  {/* Right-aligned items */}
                  <div className="flex items-center space-x-6">
                    

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
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200">
                          <button className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full">
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

          {/* Three-tier Chat Layout */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex">
              {/* Users Column */}
              <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Users</h2>
                  {filteredUsers.map(user => (
                    <div
                      key={user.user_id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-3 rounded-lg cursor-pointer ${
                        selectedUser?.user_id === user.user_id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-full">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {`${user.first_name} ${user.last_name}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.user_type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

               {/* Studies Column */}
  <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Studies</h2>
      {selectedUser ? (
        userStudies.length > 0 ? (
          userStudies.map(study => (
            <div
              key={study.research_id}
              onClick={() => setSelectedStudy(study)}
              className={`p-3 rounded-lg cursor-pointer ${
                selectedStudy?.research_id === study.research_id ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">{study.title}</h3>
                <p className="text-sm text-gray-500">
                  Status: {study.status}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <p className="text-gray-500 mb-2">No study requests found</p>
            <p className="text-sm text-gray-400">This user hasn't requested access to any studies yet</p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <p className="text-gray-500 mb-2">Select a user</p>
          <p className="text-sm text-gray-400">Choose a user from the list to view their study requests</p>
        </div>
      )}
    </div>
  </div>

  {/* Chat Messages Column */}
  <div className="flex-1 bg-white overflow-hidden flex flex-col">
    <div className="p-4 flex-1 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
      {selectedStudy ? (
        <div className="space-y-4">
          {chatMessages.length > 0 ? (
            chatMessages.map(message => (
  <div
    key={message.chat_id}
    className={`flex flex-col space-y-1 ${
      message.adminsender_id ? 'items-end' : 'items-start'
    }`}
  >
    <div 
      className={`flex items-start space-x-2 max-w-3/4 ${
        message.adminsender_id 
          ? 'bg-indigo-100 ml-auto' 
          : 'bg-gray-100 mr-auto'
      } rounded-lg p-3`}
    >
      <div className="w-full">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {message.adminsender_id 
              ? `${message.admin_username} (Admin)`
              : `${message.first_name} ${message.last_name} (${message.user_type})`}
          </span>
        </div>
        <p className="text-sm text-gray-800">
          {message.adminsender_id ? message.replies : message.message}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(message.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  </div>
))
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No messages for this study
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <p className="text-gray-500 mb-2">Select a study</p>
          <p className="text-sm text-gray-400">Choose a study from the list to view the conversation</p>
        </div>
      )}
    </div>

    {/* Message Input Area */}
    {selectedStudy && (
  <div className="p-4 border-t border-gray-200">
    <div className="flex space-x-4">
      <div className="flex-1">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your reply..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          rows="3"
        />
      </div>
      <button
        onClick={handleSendMessage}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 self-end disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!newMessage.trim()}
      >
        Send Reply
      </button>
    </div>
  </div>
)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}