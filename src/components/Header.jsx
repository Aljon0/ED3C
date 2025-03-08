import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { scroller } from 'react-scroll';
import './Header.css';
import { Menu, X } from 'lucide-react'; // Using Lucide icons for menu and close

function Header() {
    const location = useLocation();
    const [activeLink, setActiveLink] = useState('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (location.state?.scrollTo) {
            scroller.scrollTo(location.state.scrollTo, {
                smooth: true,
                duration: 50,
                offset: -80,
            });
        }
        
        // Update active link based on current path
        const path = location.pathname.substring(1) || 'home';
        setActiveLink(path);

        // Close mobile menu when location changes
        setIsMobileMenuOpen(false);
    }, [location]);

    const handleLinkClick = (link) => {
        setActiveLink(link);
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const renderLinks = (isMobile = false) => {
        const linkClassName = isMobile 
            ? "block py-4 text-center text-white hover:bg-[#3A5A66] transition-colors" 
            : `nav-link text-base py-2 relative ${isMobile ? '' : 'hidden md:block'}`;

        return (
            <>
                <Link
                    to="/"
                    state={{ scrollTo: 'home' }}
                    className={`${linkClassName} ${activeLink === 'home' ? 'active' : ''}`}
                    onClick={() => handleLinkClick('home')}
                >
                    Home
                </Link>
                <Link
                    to="/"
                    state={{ scrollTo: 'features' }}
                    className={`${linkClassName} ${activeLink === 'features' ? 'active' : ''}`}
                    onClick={() => handleLinkClick('features')}
                >
                    Features
                </Link>
                <Link
                    to="/"
                    state={{ scrollTo: 'sample' }}
                    className={`${linkClassName} ${activeLink === 'sample' ? 'active' : ''}`}
                    onClick={() => handleLinkClick('sample')}
                >
                    Sample
                </Link>
                <Link
                    to="/"
                    state={{ scrollTo: 'contact' }}
                    className={`${linkClassName} ${activeLink === 'contact' ? 'active' : ''}`}
                    onClick={() => handleLinkClick('contact')}
                >
                    Contact
                </Link>
                <Link
                    to="/login"
                    className={`${linkClassName} ${activeLink === 'login' ? 'active' : ''}`}
                    onClick={() => handleLinkClick('login')}
                >
                    Login
                </Link>
            </>
        );
    };

    return (
        <header className="text-white fixed w-full h-24 flex items-center justify-between px-4 sm:px-[5%] py-2 sm:py-3 bg-[#2F424B] z-[200]">
            <div className="flex items-center sm:h-12">
                <img src="/assets/logo2.png" className="h-8 sm:h-10 md:h-12 lg:h-16 mr-2" alt="Logo" />
                <Link to="/" className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold italic whitespace-nowrap">DOUBLE SEVEN</Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:block">
                <div className="flex space-x-4 xl:space-x-8">
                    {renderLinks()}
                </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
                className="lg:hidden text-white"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-[#2F424B] top-[70px] sm:top-[56px] md:top-[64px] flex flex-col">
                    <div className="flex flex-col items-center pt-8">
                        {renderLinks(true)}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;