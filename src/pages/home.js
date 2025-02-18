import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, BellIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import FilterSection from '@/components/FilterSection'; 
import LoginModal from '@/components/LoginModal';
import NetworkGraphModal from '@/components/NetworkGraphModal';
import ChatWindow from '@/components/ChatWindow';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNetworkGraphModal, setShowNetworkGraphModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const sidebarRef = useRef(null);
  const [activeFilters, setActiveFilters] = useState(null);
  const [mainContentLoading, setMainContentLoading] = useState(false);
  const [savedFilters, setSavedFilters] = useState(null);
  const [activeChatWindows, setActiveChatWindows] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
const [chatRequests, setChatRequests] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);

const fetchChatRequests = async () => {
  try {
    const response = await axios.get('/api/chat/requests');
    if (response.data.chatRequests) {
      setChatRequests(response.data.chatRequests);
      // Only show notifications for admin responses (is_read = 1)
      setUnreadCount(response.data.adminResponses || 0);
    }
  } catch (error) {
    console.error('Failed to fetch chat requests:', error);
  }
};

useEffect(() => {
  if (user) {
    fetchChatRequests();
    // Fetch chat requests every 30 seconds
    const interval = setInterval(fetchChatRequests, 30000);
    return () => clearInterval(interval);
  }
}, [user]);

  const handleOpenChat = (article) => {
    if (!activeChatWindows.find(chat => chat.id === article.id)) {
      setActiveChatWindows([...activeChatWindows, article]);
    }
  };

  const handleCloseChat = (articleId) => {
    setActiveChatWindows(activeChatWindows.filter(chat => chat.id !== articleId));
  };
  
  const { search } = router.query;
  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    fetchSearchResults(searchInput, newFilters);
  };

  useEffect(() => {
    if (search) {
      const decodedSearch = decodeURIComponent(search);
      setSearchInput(decodedSearch);
      fetchSearchResults(decodedSearch);
    } else {
      fetchSearchResults('');
    }
  }, [search]);

  const fetchSearchResults = async (query, filters = null) => {
    setMainContentLoading(true);
    setError('');
    try {
      const encodedQuery = query ? encodeURIComponent(query) : '';
      const filterParam = filters ? `&filters=${encodeURIComponent(JSON.stringify(filters))}` : '';
      const response = await axios.get(`/api/search?query=${encodedQuery}${filterParam}`);
      
      if (response.data && response.data.studies) {
        setSearchResults(response.data.studies);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      if (err.response?.status === 404) {
        setError('No results found for your search. Try different keywords or filters.');
      } else {
        setError('An error occurred while searching. Please try again.');
      }
    } finally {
      setMainContentLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/user');
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log('No authenticated user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [refreshKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
          !event.target.closest('button[aria-label="Toggle sidebar"]')) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push({
        pathname: '/home',
        query: { search: searchInput.trim() }
      }, undefined, { shallow: true });
      fetchSearchResults(searchInput.trim());
    }
  };

  const handleSearchInputChange = (event) => {
    setSearchInput(event.target.value);
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchSubmit(event);
    }
  };

  const handleArticleClick = (article) => {
    console.log('Selected article:', article); 
    
    if (!user) {
      setSelectedArticle(article);
      setShowLoginModal(true);
    } else {
      setSelectedArticle(article);
      setShowNetworkGraphModal(true);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    setRefreshKey(prevKey => prevKey + 1);
    if (selectedArticle) {
      setShowNetworkGraphModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
        <title>Home - Quest2Go</title>
        <meta name="description" content="Quest2Go Home - Discover unpublished research in Davao City." />
      </Head>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 z-30`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center mt-3 justify-center">
          <Link href="/" className="flex items-center px-4 hover:opacity-80 transition-opacity">
            <Image
              src="/Logo/q2glogo.png"
              alt="Quest2Go Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="ml-2 text-gray-900 font-bold text-xl">Quest2Go</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
          <div className="relative">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                className="w-full px-4 py-2 pr-10 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded-full"
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </button>
            </form>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4">
          <FilterSection 
            onFilterChange={handleFilterChange} 
            initialFilters={savedFilters}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-64 transition-margin duration-300 ease-in-out">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <button
              aria-label="Toggle sidebar"
              onClick={toggleSidebar}
              className="p-2 rounded-md lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 flex justify-end items-center space-x-4">
  {/* Notification Dropdown */}
<div className="relative">
<button 
  onClick={() => {
    setShowNotifications(!showNotifications);
    setIsDropdownOpen(false);
  }}
  className="p-2 text-gray-500 hover:text-gray-700 relative"
>
  <BellIcon className="h-6 w-6" />
  {unreadCount > 0 && (
    <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</button>
  
  {showNotifications && (
    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Chat Requests</h3>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {chatRequests.length > 0 ? (
          chatRequests.map((request) => (
  <button
    key={request.research_id}
    onClick={() => {
      handleOpenChat({
        id: request.research_id,
        title: request.title
      });
      setShowNotifications(false);
    }}
    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium text-gray-900 truncate pr-2">
          {request.title}
        </p>
        {request.admin_response_count > 0 && (
          <span className="flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            {request.admin_response_count} response{request.admin_response_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
    <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-gray-400" />
  </button>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            <p>No chat requests</p>
          </div>
        )}
      </div>
    </div>
  )}
</div>

  {/* User Account Dropdown - Keep existing code */}
  <div className="relative">
    <button
      onClick={() => {
        setIsDropdownOpen(!isDropdownOpen);
        setShowNotifications(false); // Close notifications when opening user dropdown
      }}
      className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full"
    >
      <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">
        {user && user.first_name && user.last_name ? `${user.first_name[0]}${user.last_name[0]}` : 'G'}
      </div>
      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
    </button>
    {isDropdownOpen && (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
        <div className="px-4 py-2 text-sm text-gray-700">
          <p className="font-medium">{user ? `${user.first_name} ${user.last_name}` : 'Guest'}</p>
          <p className="text-gray-500">{user ? user.user_type : 'Guest User'}</p>
        </div>
        <hr className="my-2" />
        {user ? (
          <>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Login
          </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {searchInput ? `Search Results for "${searchInput}"` : 'Recent Research Articles'}
            </h2>
            {mainContentLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500 font-medium mb-2">Sorry, no results found for your search.</p>
                <p className="text-gray-600">Try searching by:</p>
                <ul className="mt-2 text-gray-600">
                  <li>• Title of the research</li>
                  <li>• Author name</li>
                  <li>• Keywords</li>
                  <li>• Institution</li>
                </ul>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {searchResults.map((article) => (
                  <div
                    key={`search-result-${article.research_id}`} 
                    onClick={() => {
                      console.log('Clicked article:', article); 
                      handleArticleClick(article);
                    }}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Author: {article.author_name || article.author || 'Unknown Author'}
                    </p>
                    <p className="text-sm text-gray-600">Institution: {article.institution || 'Not specified'}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Posted on: {new Date(article.date_added).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No studies found matching your search criteria.</p>
                <button 
                  onClick={() => {
                    setSearchInput('');
                    router.push('/home');
                  }}
                  className="mt-4 text-indigo-600 hover:text-indigo-800"
                >
                  View all articles
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        />

      <NetworkGraphModal
        isOpen={showNetworkGraphModal}
        onClose={() => setShowNetworkGraphModal(false)}
        article={selectedArticle}
        articles={searchResults.map(article => ({
          id: article.research_id,
          title: article.title,
          author: article.author_name || article.author || 'Unknown Author',
          date: article.date_added,
          abstract: article.abstract || 'No abstract available',
          category: article.category || 'Uncategorized',
          referenceCount: article.reference_count || 0
        }))}
        activeChatWindows={activeChatWindows}
        onOpenChat={handleOpenChat}
        onCloseChat={handleCloseChat}
      />

      {/* Chat Windows */}
      {activeChatWindows.map(article => (
        <ChatWindow
          key={`chat-${article.id}`}
          article={article}
          isOpen={true}
          onClose={() => handleCloseChat(article.id)}
        />
      ))}
    </div>
  );
}