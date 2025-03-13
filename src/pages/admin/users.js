import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminSidebar from './AdminSidebar';
import { 
  Menu, 
  User, 
  ChevronDown, 
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

export default function Users() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [users, setUsers] = useState([]);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
  
    useEffect(() => {
      const fetchUsers = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get('/api/admin/users-with-requests');
          setUsers(response.data.users);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching users:', error);
          setIsLoading(false);
        }
      };
    
      const fetchAdminData = async () => {
        try {
          const response = await axios.get('/api/admin/user');
          setAdmin(response.data);
        } catch (error) {
          console.error('Error fetching admin data:', error);
        }
      };
    
      fetchUsers();
      fetchAdminData();
    }, []);
  
    const handleLogout = async () => {
      try {
        await axios.post('/api/admin/logout');
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'Approved':
          return <CheckCircle className="w-5 h-5 text-green-600" />;
        case 'Denied':
          return <XCircle className="w-5 h-5 text-red-600" />;
        case 'Pending':
        default:
          return <Clock className="w-5 h-5 text-amber-500" />;
      }
    };

    const getStatusColorClass = (status) => {
      switch (status) {
        case 'Approved':
          return 'bg-green-100 text-green-800 hover:bg-green-200';
        case 'Denied':
          return 'bg-red-100 text-red-800 hover:bg-red-200';
        case 'Pending':
        default:
          return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      }
    };
  
    const UserInitials = ({ firstName, lastName }) => {
      const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
      return (
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white font-medium">
          {initials}
        </div>
      );
    };

    const toggleStatusDropdown = (userId, requestId) => {
      if (statusDropdownOpen === `${userId}-${requestId}`) {
        setStatusDropdownOpen(null);
      } else {
        setStatusDropdownOpen(`${userId}-${requestId}`);
      }
    };

    const updateRequestStatus = async (userId, requestId, researchId, newStatus) => {
      if (updatingStatus) return;
      
      try {
        setUpdatingStatus(true);
        
        // Call API to update status
        await axios.post('/api/admin/update-request-status', {
          userId: userId,
          researchId: researchId,
          status: newStatus
        });
        
        // Update local state
        setUsers(users.map(user => {
          if (user.user_id === userId) {
            return {
              ...user,
              requests: user.requests.map(request => {
                if (request.research_id === researchId) {
                  return {
                    ...request,
                    request_status: newStatus
                  };
                }
                return request;
              })
            };
          }
          return user;
        }));
        
        // Close dropdown
        setStatusDropdownOpen(null);
      } catch (error) {
        console.error('Error updating request status:', error);
        alert('Failed to update request status. Please try again.');
      } finally {
        setUpdatingStatus(false);
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
                            <span className="hidden sm:inline text-gray-700 font-medium">
  {admin?.user?.username || admin?.username || 'Admin'}
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
  <main className="p-4 sm:p-6"> {/* Reduce padding on small screens */}
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
  <div>
    <h1 className="text-2xl font-semibold text-gray-900">User Request Management</h1>
    
  </div>
  <div className="flex flex-wrap items-center gap-2">
    <div className="flex items-center">
      <Clock className="w-4 h-4 text-amber-500 mr-1" />
      <span className="text-sm text-gray-600">Pending</span>
    </div>
    <div className="flex items-center">
      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
      <span className="text-sm text-gray-600">Approved</span>
    </div>
    <div className="flex items-center">
      <XCircle className="w-4 h-4 text-red-600 mr-1" />
      <span className="text-sm text-gray-600">Denied</span>
    </div>
  </div>
</div>
  
                {/* Status update notification (could be shown when status is updated) */}
                {false && (
                  <div className="mb-4 flex items-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-indigo-600 mr-2" />
                    <span className="text-indigo-800">Status updated successfully</span>
                  </div>
                )}
  
                {/* Users Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
  <div className="overflow-x-auto"> {/* Add this wrapper for horizontal scrolling */}
    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active On</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Studies</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={`user-${user.user_id}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <UserInitials firstName={user.first_name} lastName={user.last_name} />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{`${user.first_name} ${user.last_name}`}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              {user.user_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(user.last_activity)}
                          </td>
                          <td className="px-6 py-4">
                            {user.requests && user.requests.length > 0 ? (
                              <div className="space-y-2">
                                {user.requests.map((request, index) => (
                                  <div 
                                    key={`request-${user.user_id}-${request.research_id}-${index}`}
                                    className="text-sm text-gray-900 break-words max-w-xs flex"
                                  >
                                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5 mr-1" />
                                    <span>{request.study_title}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No studies requested</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {user.requests && user.requests.length > 0 ? (
                              <div className="space-y-2">
                                {user.requests.map((request, index) => (
                                  <div 
                                    key={`status-${user.user_id}-${request.research_id}-${index}`}
                                    className="relative"
                                  >
                                    <button
  onClick={() => toggleStatusDropdown(user.user_id, request.research_id)}
  className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColorClass(request.request_status)}`}
  disabled={updatingStatus}
  data-dropdown-id={`${user.user_id}-${request.research_id}`}
>
  {getStatusIcon(request.request_status)}
  <span className="ml-2">{request.request_status}</span>
  <ChevronDown className="w-3 h-3 ml-1" />
</button>
                                    
                                    {/* Status Dropdown */}
{statusDropdownOpen === `${user.user_id}-${request.research_id}` && (
  <div 
    className="fixed bg-white rounded-md shadow-lg z-50 border border-gray-200"
    style={{
      width: '144px', // w-36 equivalent
      // Calculate position based on button's position in the viewport
      top: (() => {
        // Get the button element
        const buttonElement = document.querySelector(`button[data-dropdown-id="${user.user_id}-${request.research_id}"]`);
        if (!buttonElement) return 'auto';
        
        const rect = buttonElement.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // If space below is limited, position above the button
        if (spaceBelow < 150) {
          return `${rect.top - 120}px`; // Position above with enough space for dropdown
        }
        // Otherwise position below
        return `${rect.bottom + 5}px`;
      })(),
      left: (() => {
        const buttonElement = document.querySelector(`button[data-dropdown-id="${user.user_id}-${request.research_id}"]`);
        if (!buttonElement) return 'auto';
        
        const rect = buttonElement.getBoundingClientRect();
        return `${rect.left}px`;
      })()
    }}
  >
    <div className="py-1">
      <button
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
        onClick={() => updateRequestStatus(user.user_id, request.request_id, request.research_id, 'Pending')}
      >
        <Clock className="w-4 h-4 text-amber-500 mr-2" />
        Pending
      </button>
      <button
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
        onClick={() => updateRequestStatus(user.user_id, request.request_id, request.research_id, 'Approved')}
      >
        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
        Approved
      </button>
      <button
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
        onClick={() => updateRequestStatus(user.user_id, request.request_id, request.research_id, 'Denied')}
      >
        <XCircle className="w-4 h-4 text-red-600 mr-2" />
        Denied
      </button>
    </div>
  </div>
)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No requests</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
  </div>
</div>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }