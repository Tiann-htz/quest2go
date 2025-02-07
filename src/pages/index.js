import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import {
  DocumentMagnifyingGlassIcon,
  MapIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/router'; 

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [searchError, setSearchError] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const router = useRouter(); 

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSearch = (e) => {
    // Only proceed if there's a non-empty search query (trimmed to remove whitespace)
    if ((e.key === 'Enter' || e.type === 'click') && searchQuery.trim()) {
      router.push(`/home?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchWithValidation = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim()) {
        setSearchError(false);
        router.push(`/home?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        setSearchError(true);
        // Remove error state after 3 seconds
        setTimeout(() => setSearchError(false), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Quest2Go - Mapping Unpublished Research in Davao City</title>
        <meta name="description" content="A web-based mapping system for finding unpublished research among institutions in Davao City." />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Quicksand:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Navbar with Dropdown for Mobile */}
      <nav className="backdrop-blur-sm bg-white/30 sticky top-0 z-50 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Text Combined - Adjusted for mobile */}
            <div className="flex items-center space-x-1 sm:space-x-2">
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

            {/* Desktop Nav Links */}
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
              <a
                href="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                Login
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center">
              <button
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div ref={menuRef} className="absolute left-0 right-0 bg-white shadow-lg md:hidden">
              <div className="flex flex-col space-y-4 py-4">
                <a href="#about" className="text-gray-700 hover:text-gray-900 px-4 font-medium">
                  About
                </a>
                <a href="#features" className="text-gray-700 hover:text-gray-900 px-4 font-medium">
                  Features
                </a>
                <a
                  href="/login"
                  className="bg-indigo-600 text-white px-4 py-2 mx-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                >
                  Login
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Section */}
      <section id="main" className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute min-w-full min-h-full object-cover w-full h-full"
          >
            <source src="/Background/bg.mp4" type="video/mp4" />
          </video>
          {/* Overlay to ensure text remains readable */}
          <div className="absolute inset-0 "></div>
        </div>

        {/* Existing Content - Now with z-index to appear above video */}
        <div className="text-center px-4 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Poppins' }}>
            <span className="text-indigo-600">Bridging</span>{' '}
            <span className="text-violet-600">Research</span>{' '}
            <span className="text-gray-800">Gaps</span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 mb-8" style={{ fontFamily: 'Quicksand' }}>
            <span className="text-purple-600 font-semibold">Connect</span> •{' '}
            <span className="text-indigo-600 font-semibold">Discover</span> •{' '}
            <span className="text-blue-600 font-semibold">Share</span>
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-md mx-auto sm:max-w-lg md:max-w-2xl">
  <div className={`flex items-center rounded-md shadow-xl bg-white/90 p-4 border-2 ${
    searchError ? 'border-indigo-300' : 'border-indigo-100 hover:border-indigo-300'
  } transition-all backdrop-blur-sm`}>
    <MagnifyingGlassIcon 
      className={`h-6 w-6 ${searchError ? 'text-indigo-500' : 'text-indigo-500'} cursor-pointer`}
      onClick={handleSearchWithValidation}
    />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        if (searchError) setSearchError(false);
      }}
      onKeyPress={handleSearchWithValidation}
      className="flex-grow p-2 focus:outline-none ml-2 placeholder-gray-400 bg-transparent text-gray-800"
      placeholder="Search by keyword, author, institution, or research topic..."
      style={{ fontFamily: 'Quicksand' }}
    />
  </div>
</div>
        </div>
      </section>



      {/* About Section */}
      <section id="about" className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          {/* Text and Learn More Button */}
    <div className="md:w-1/2">
      <h2 className="text-3xl font-extrabold text-gray-900">About Quest2Go</h2>
      <p className="mt-4 text-gray-600">
        Quest2Go is your gateway to discovering unpublished research treasures within Davao City's academic landscape. We bridge the gap between researchers, educators, and valuable academic work by creating an interconnected network of institutional research repositories. Our platform simplifies the process of finding, accessing, and collaborating on research projects, making previously hard-to-find academic work easily discoverable.
      </p>
      <button className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
        Learn More
      </button>
    </div>

          {/* Right Side: Image */}
          <div className="md:w-1/2 mt-8 md:mt-0 ml-20">
            <Image
              src="/Images/about.png" 
              alt="About Quest2Go"
              width={600} 
              height={400} 
              className="rounded-lg shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">Features</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Search Card */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <DocumentMagnifyingGlassIcon className="h-10 w-10 text-indigo-600 mx-auto" /> {/* Icon */}
              <h3 className="text-xl font-semibold text-gray-900 mt-4 text-center">Advanced Search</h3>
              <p className="mt-2 text-gray-600 text-center">
                Search for unpublished research by keyword, author, institution, or research topic.
              </p>
            </div>

            {/* Institution Mapping Card */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <MapIcon className="h-10 w-10 text-indigo-600 mx-auto" /> {/* Icon */}
              <h3 className="text-xl font-semibold text-gray-900 mt-4 text-center">Institution Mapping</h3>
              <p className="mt-2 text-gray-600 text-center">
                Locate research materials from various academic institutions in Davao City.
              </p>
            </div>

            {/* Collaboration Tools Card */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <UserGroupIcon className="h-10 w-10 text-indigo-600 mx-auto" /> {/* Icon */}
              <h3 className="text-xl font-semibold text-gray-900 mt-4 text-center">Collaboration Tools</h3>
              <p className="mt-2 text-gray-600 text-center">
                Connect with researchers and institutions to foster collaboration.
              </p>
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