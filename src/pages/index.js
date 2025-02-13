import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon, DocumentMagnifyingGlassIcon, MapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
  };
  
  // Check initially
  checkMobile();
  
  // Add resize listener
  window.addEventListener('resize', checkMobile);
  
  // Cleanup
  return () => window.removeEventListener('resize', checkMobile);
}, []);

  // Check authentication status on mount
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
      }
    };
    checkAuth();
  }, []);

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      // Only handle click outside for mobile screens
      if (isMobile && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          !event.target.closest('.user-menu-button')
      ) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  const handleLogout = async (e) => {
    e.preventDefault(); // Prevent default action
    e.stopPropagation(); // Stop event propagation
    
    try {
      await axios.post('/api/logout');
      setUser(null);
      setIsDropdownOpen(false); // Close dropdown after successful logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearchWithValidation = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim()) {
        setSearchError(false);
        router.push({
          pathname: '/home',
          query: { search: encodeURIComponent(searchQuery.trim()) }
        });
      } else {
        setSearchError(true);
        setTimeout(() => setSearchError(false), 3000);
      }
    }
  };

  // User menu component
  const UserMenu = () => {
    if (!user) {
      return (
        <div className="flex items-center space-x-4">
          <a
            href="/login"
            className="bg-indigo-600 text-white px-4 py-2 ml-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            Login
          </a>
          <a
            href="/signup"
            className="bg-white text-indigo-600 px-4 py-2 rounded-md border border-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
          >
            Signup
          </a>
        </div>
      );
    }
  
    const initials = `${user.first_name[0]}${user.last_name[0]}`;
    const displayName = `${user.first_name} ${user.last_name}`;
  
    return (
      <div ref={dropdownRef} className="relative inline-block text-left">
        <button
          className="user-menu-button flex items-center space-x-2 hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
        >
          <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">
            {initials}
          </div>
          <span className="text-gray-700 truncate max-w-[120px]">{displayName}</span>
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        </button>
  
        {isDropdownOpen && (
          <div 
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[60]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout(e);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="backdrop-blur-sm bg-white/30 sticky top-0 z-50 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Text - Only visible on desktop */}
            <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
              <Image
                src="/Logo/q2glogo.png"
                alt="Quest2Go Logo"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <span className="text-lg sm:text-2xl font-bold">
                <span className="text-indigo-600">Quest</span>
                <span className="text-gray-800">2Go</span>
              </span>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center">
              <button
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Links and User Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#main" className="text-gray-700 hover:text-gray-900 font-medium">
                Home
              </a>
              <a href="#about" className="text-gray-700 hover:text-gray-900 font-medium">
                About
              </a>
              <a href="#features" className="text-gray-700 hover:text-gray-900 font-medium">
                Features
              </a>
              <UserMenu />
            </div>

            {/* Mobile User Menu */}
            <div className="flex md:hidden items-center">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Mobile Menu - Positioned below the nav header */}
      <div 
        className={`fixed inset-0 md:hidden ${
          isMenuOpen ? 'z-50' : 'pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          ref={menuRef}
          onClick={e => e.stopPropagation()}
          className={`fixed top-16 left-0 w-64 bg-white rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo in mobile menu */}
          <div className="flex items-center space-x-2 p-4 border-b">
            <Image
              src="/Logo/q2glogo.png"
              alt="Quest2Go Logo"
              width={40}
              height={40}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold">
              <span className="text-indigo-600">Quest</span>
              <span className="text-gray-800">2Go</span>
            </span>
          </div>

          {/* Mobile menu links */}
          <div className="flex flex-col p-4 space-y-4">
            <a 
              href="#about" 
              className="text-gray-700 hover:text-gray-900 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <a 
              href="#features" 
              className="text-gray-700 hover:text-gray-900 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <section id="main" className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <video autoPlay loop muted playsInline className="absolute min-w-full min-h-full object-cover w-full h-full">
            <source src="/Background/bg.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="text-center px-4 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="text-indigo-600">Bridging</span> <span className="text-violet-600">Research</span> <span className="text-gray-800">Gaps</span>
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 mb-8">
            <span className="text-purple-600 font-semibold">Connect</span> •{' '}
            <span className="text-indigo-600 font-semibold">Discover</span> •{' '}
            <span className="text-blue-600 font-semibold">Share</span>
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-md mx-auto sm:max-w-lg md:max-w-2xl">
            <div className={`flex items-center rounded-md shadow-xl bg-white/90 p-4 border-2 ${searchError ? 'border-indigo-300' : 'border-indigo-100 hover:border-indigo-300'} transition-all backdrop-blur-sm`}>
              <MagnifyingGlassIcon className={`h-6 w-6 ${searchError ? 'text-indigo-500' : 'text-indigo-500'} cursor-pointer`} onClick={handleSearchWithValidation} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError(false);
                }}
                onKeyPress={handleSearchWithValidation}
                className="flex-grow p-2 focus:outline-none ml-2 placeholder-gray-400 bg-transparent text-gray-800"
                placeholder="Search by title, keywords, author, institution, or research topic..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-extrabold text-gray-900">About Quest2Go</h2>
            <p className="mt-4 text-gray-600">
              Quest2Go is your gateway to discovering unpublished research treasures within Davao City's academic landscape. We bridge the gap between researchers, students, teachers and valuable academic work by creating an interconnected network of institutional research repositories.
            </p>
            <button className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              Learn More
            </button>
          </div>

          <div className="md:w-1/2 mt-8 md:mt-0 ml-20">
            <Image src="/Images/about.png" alt="About Quest2Go" width={600} height={400} className="rounded-lg shadow-md" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">Features</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <DocumentMagnifyingGlassIcon className="h-10 w-10 text-indigo-600 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 mt-4 text-center">Advanced Search</h3>
              <p className="mt-2 text-gray-600 text-center">Search for unpublished research by keyword, author, institution, or research topic.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <MapIcon className="h-10 w-10 text-indigo-600 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 mt-4 text-center">Institution Mapping</h3>
              <p className="mt-2 text-gray-600 text-center">Locate research materials from various academic institutions in Davao City.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <UserGroupIcon className="h-10 w-10 text-indigo-600 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 mt-4 text-center">Collaboration Tools</h3>
              <p className="mt-2 text-gray-600 text-center">Connect with researchers, academics, and institutions to foster collaborative work.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            &copy; {new Date().getFullYear()} Quest2Go. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}