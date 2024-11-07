import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { scroller } from 'react-scroll'; // Import for smooth scrolling
import './Header.css'; // Import your CSS file

function Header() {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState('home');

  // Handle smooth scrolling when navigating from another route
  useEffect(() => {
    if (location.state?.scrollTo) {
      scroller.scrollTo(location.state.scrollTo, {
        smooth: true,
        duration: 50,
        offset: -80, // Adjust this offset for header overlap
      });
    }
  }, [location]);

  const handleLinkClick = (link) => {
    setActiveLink(link);
  };

  return (
    <header className="text-[#2F424B] fixed w-full flex items-center justify-between px-[5%] py-6 bg-inherit z-auto">
      <div className="flex items-center">
        <img src="/assets/logo.png" className="h-16 mr-2" alt="Logo" />
        <Link to="/" className="text-4xl font-bold italic">DOUBLE SEVEN</Link>
      </div>
      <nav className="relative">
        <div className="flex space-x-8">
          {/* Links with smooth scroll and sliding background */}
          <Link
            to="/"
            state={{ scrollTo: 'home' }}
            className={`nav-link text-lg px-4 py-2 relative ${activeLink === 'home' ? 'active' : ''}`}
            onClick={() => handleLinkClick('home')}
          >
            Home
          </Link>
          <Link
            to="/"
            state={{ scrollTo: 'features' }}
            className={`nav-link text-lg px-4 py-2 relative ${activeLink === 'features' ? 'active' : ''}`}
            onClick={() => handleLinkClick('features')}
          >
            Features
          </Link>
          <Link
            to="/"
            state={{ scrollTo: 'sample' }}
            className={`nav-link text-lg px-4 py-2 relative ${activeLink === 'sample' ? 'active' : ''}`}
            onClick={() => handleLinkClick('sample')}
          >
            Sample
          </Link>
          <Link
            to="/"
            state={{ scrollTo: 'contact' }}
            className={`nav-link text-lg px-4 py-2 relative ${activeLink === 'contact' ? 'active' : ''}`}
            onClick={() => handleLinkClick('contact')}
          >
            Contact
          </Link>
          <Link
            to="/login"
            className={`nav-link text-lg px-4 py-2 relative ${activeLink === 'login' ? 'active' : ''}`}
            onClick={() => handleLinkClick('login')}
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;
