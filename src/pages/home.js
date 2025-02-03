import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, BellIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import LoginModal from '@/components/LoginModal';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
  const { search } = router.query;

  // Check for existing authentication but don't redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/user');
        if (response.data.user) {
          console.log('User data after refresh:', response.data.user); // Debug logging
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

  // Sample research articles
  const articles = [
    {
      id: 1,
      title: "Impact of Online Learning on Student Performance",
      date: "2024-01-15",
      link: "/home",
      author: "Dr. Sarah Johnson",
      institution: "University of Mindanao"
    },
    {
      id: 2,
      title: "Sustainable Agriculture Practices in Davao Region",
      date: "2024-01-20",
      link: "/home",
      author: "Prof. Manuel Santos",
      institution: "Davao Medical School Foundation"
    },
    {
      id: 3,
      title: "Mental Health Among College Students During Pandemic",
      date: "2024-02-01",
      link: "/home",
      author: "Dr. Maria Garcia",
      institution: "San Pedro College"
    }
  ];

  const handleArticleClick = (article) => {
    if (!user) {
      setSelectedArticle(article);
      setShowLoginModal(true);
    } else {
      router.push(article.link);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    setRefreshKey(prevKey => prevKey + 1);
    if (selectedArticle) {
      router.push(selectedArticle.link);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Home - Quest2Go</title>
        <meta name="description" content="Quest2Go Home - Discover unpublished research in Davao City." />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Quest2Go</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <BellIcon className="h-6 w-6" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Settings
                      </a>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex">
        {/* Sidebar Toggle Button for Mobile */}
        <button
          onClick={toggleSidebar}
          className="fixed left-0 top-20 z-40 p-2 bg-indigo-600 text-white rounded-r-lg lg:hidden"
        >
          {isSidebarOpen ? '<' : '>'}
        </button>

        {/* Sidebar */}
        <aside
          className={`w-64 bg-white rounded-lg shadow-sm p-4 fixed lg:static lg:translate-x-0 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-200 ease-in-out z-30 lg:z-auto`}
        >
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                defaultValue={search || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Filters</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-700 hover:text-indigo-600">
                  Recent
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-indigo-600">
                  Popular
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-indigo-600">
                  Recommended
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-indigo-600">
                  By Author
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-indigo-600">
                  By Institution
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-0 lg:ml-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Research Articles</h2>
            <div className="grid grid-cols-1 gap-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">Author: {article.author}</p>
                  <p className="text-sm text-gray-600">Institution: {article.institution}</p>
                  <p className="text-sm text-gray-500 mt-2">Published on: {article.date}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}