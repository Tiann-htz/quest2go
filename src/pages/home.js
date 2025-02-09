import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, BellIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import LoginModal from '@/components/LoginModal';
import NetworkGraphModal from '@/components/NetworkGraphModal';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNetworkGraphModal, setShowNetworkGraphModal] = useState(false); // State for network graph modal
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const sidebarRef = useRef(null);
  const { search } = router.query;

  // Handle click outside sidebar
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
  // Sample research articles
const articles = [
  {
    id: 1,
    title: "The Impact of Social Media Usage on Depression Among University Students",
    date: "2025-01-15",
    link: "/home",
    author: "Dr. Sarah Johnson",
    institution: "University of Mindanao",
    abstract: "This study investigates the correlation between social media usage patterns and depression rates among university students in Davao City, utilizing a mixed-methods approach with 500 participants. The research explores how different aspects of social media engagement affect mental health outcomes.",
    category: "Mental Health - Depression",
    status: "Unpublished",
    referenceCount: 45,
    displayDetails: {
      title: "The Impact of Social Media Usage on Depression Among University Students",
      date: "2025-01-15",
      author: "Dr. Sarah Johnson",
      institution: "University of Mindanao"
    }
  },
  {
    id: 2,
    title: "Correlation Between Academic Pressure and Depression in Medical Students",
    date: "2020-06-20",
    link: "/home",
    author: "Prof. Manuel Santos",
    institution: "Davao Medical School Foundation",
    abstract: "An examination of the relationship between academic performance expectations and depressive symptoms among medical students, featuring a longitudinal study of 300 students over three years. The research highlights the impact of curriculum intensity on mental health.",
    category: "Mental Health - Depression",
    status: "Published",
    referenceCount: 68,
    displayDetails: {
      title: "Correlation Between Academic Pressure and Depression in Medical Students",
      date: "2020-06-20",
      author: "Prof. Manuel Santos",
      institution: "Davao Medical School Foundation"
    }
  },
  {
    id: 3,
    title: "Depression Patterns in Rural Communities of Davao Region",
    date: "2015-03-15",
    link: "/home",
    author: "Dr. Maria Garcia",
    institution: "San Pedro College",
    abstract: "A comprehensive analysis of depression prevalence in rural Davao communities, examining socioeconomic factors, access to mental health resources, and traditional coping mechanisms. The study includes data from 1000 participants across 15 rural communities.",
    category: "Mental Health - Depression",
    status: "Published",
    referenceCount: 92,
    displayDetails: {
      title: "Depression Patterns in Rural Communities of Davao Region",
      date: "2015-03-15",
      author: "Dr. Maria Garcia",
      institution: "San Pedro College"
    }
  },
  {
    id: 4,
    title: "Effectiveness of Online Therapy for Depression Treatment During COVID-19",
    date: "2005-09-10",
    link: "/home",
    author: "Dr. Antonio Reyes",
    institution: "Ateneo de Davao University",
    abstract: "This research evaluates the efficacy of online therapeutic interventions for depression treatment, comparing outcomes between traditional face-to-face therapy and virtual sessions. The study includes data from 400 patients who received online therapy during the pandemic period.",
    category: "Mental Health - Depression",
    status: "Published",
    referenceCount: 127,
    displayDetails: {
      title: "Effectiveness of Online Therapy for Depression Treatment During COVID-19",
      date: "2005-09-10",
      author: "Dr. Antonio Reyes",
      institution: "Ateneo de Davao University"
    }
  },
  {
    id: 5,
    title: "Genetic Factors in Depression: A Multi-Generational Study",
    date: "1995-11-30",
    link: "/home",
    author: "Dr. Elena Cruz",
    institution: "Davao Doctors College",
    abstract: "A pioneering study examining genetic predisposition to depression across three generations of families in Davao City. The research includes DNA analysis, family history documentation, and environmental factor assessment of 150 families over a 25-year period.",
    category: "Mental Health - Depression",
    status: "Published",
    referenceCount: 156,
    displayDetails: {
      title: "Genetic Factors in Depression: A Multi-Generational Study",
      date: "1995-11-30",
      author: "Dr. Elena Cruz",
      institution: "Davao Doctors College"
    }
  }
];

  const handleArticleClick = (article) => {
    if (!user) {
      setSelectedArticle(article);
      setShowLoginModal(true);
    } else {
      setSelectedArticle(article);
      setShowNetworkGraphModal(true); // Show network graph modal
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    setRefreshKey(prevKey => prevKey + 1);
    if (selectedArticle) {
      setShowNetworkGraphModal(true); // Show network graph modal after login
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

  // Search functionality
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
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
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={handleSearch}  
              className="w-full px-4 py-2 pr-10 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Filters</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-gray-700 hover:text-indigo-600">
                Recent
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-700 hover:text-indigo-600">
              Date of Completion
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-700 hover:text-indigo-600">
              Degree program
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-700 hover:text-indigo-600">
              Category
              </a>
            </li>
            <li>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-64 transition-margin duration-300 ease-in-out">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            {/* Mobile sidebar toggle */}
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
        <main className="p-6">
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

      {/* Network Graph Modal */}
      <NetworkGraphModal
        isOpen={showNetworkGraphModal}
        onClose={() => setShowNetworkGraphModal(false)}
        articles={articles}
      />
    </div>
  );
}