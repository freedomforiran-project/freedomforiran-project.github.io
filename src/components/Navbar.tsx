import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navLinks = [
    { path: '/', label: 'Email Your MP' },
    { path: '/ttp', label: 'The Teach Project' }
  ];

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    setMobileMenuOpen(false);
    // Trigger popstate event for App.tsx to pick up
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getLinkClasses = (path: string) => {
    const isActive = currentPath === path;
    const baseClasses = 'py-2 transition-colors';

    if (isActive) {
      return `${baseClasses} text-green-600 border-b-2 border-green-600 font-semibold`;
    }
    return `${baseClasses} text-gray-600 hover:text-green-500`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Flags */}
          <a
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={(e) => handleNavigation(e, '/')}
          >
            <img src="/flag.svg" alt="Iranian Flag" className="w-8 h-8 flex-shrink-0" />
            <img src="/canadaflag.svg" alt="Canadian Flag" className="w-8 h-8 flex-shrink-0" />
            <span className="font-bold text-lg text-gray-900 hidden sm:inline">Freedom for Iran</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={getLinkClasses(link.path)}
                onClick={(e) => handleNavigation(e, link.path)}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className={`px-4 ${getLinkClasses(link.path)}`}
                  onClick={(e) => handleNavigation(e, link.path)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
