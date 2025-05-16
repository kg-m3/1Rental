import React, { useState, useEffect } from 'react';
import { Menu, X, Truck, User, LogOut, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const shouldShowTransparentNav = isHomePage && !isScrolled;

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        shouldShowTransparentNav
          ? 'bg-transparent py-4'
          : 'bg-white shadow-md py-2'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/src/assests/img/OR_logo-small.png"
              className="h-8 md:h-10"
            />
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-2 ${
                    shouldShowTransparentNav ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  <User className="h-5 w-5" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="inline-block h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      <LogOut className="inline-block h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className={`${
                  shouldShowTransparentNav
                    ? 'text-white hover:text-gray-200'
                    : 'text-gray-800 hover:text-gray-600'
                }`}
              >
                Sign In
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${
                shouldShowTransparentNav ? 'text-white' : 'text-gray-800'
              } focus:outline-none`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pt-4 pb-2">
            <div className="flex flex-col space-y-3 bg-white rounded-lg p-4 shadow-lg">
              <Link
                to="/"
                className="text-gray-800 hover:text-yellow-600 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/#about"
                className="text-gray-800 hover:text-yellow-600 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                to="/#how-it-works"
                className="text-gray-800 hover:text-yellow-600 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </Link>
              <Link
                to="/equipment"
                className="text-gray-800 hover:text-yellow-600 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                Equipment
              </Link>
              <Link
                to="/#contact"
                className="text-gray-800 hover:text-yellow-600 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;