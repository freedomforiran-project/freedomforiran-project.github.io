import React, { useEffect, useState } from 'react';
import MPLookup from './components/MPLookup';
import TTPPage from './components/TTPPage';
import Navbar from './components/Navbar';

function App() {
  const [currentRoute, setCurrentRoute] = useState('/');

  useEffect(() => {
    // Check if redirected from 404.html
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      window.history.replaceState(null, '', redirect);
      setCurrentRoute(redirect);
    } else {
      // Handle initial route
      const path = window.location.pathname;
      setCurrentRoute(path);
    }

    // Listen for browser back/forward
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentRoute(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const titles: { [key: string]: string } = {
      '/': 'Contact Your MP About Iran - Take Action',
      '/ttp': 'Contact UN & UNICEF About Children in Iran'
    };
    document.title = titles[currentRoute] || titles['/'];
  }, [currentRoute]);

  return (
    <div className="min-h-screen">
      <Navbar />
      {currentRoute === '/' && <MPLookup />}
      {currentRoute === '/ttp' && <TTPPage />}
    </div>
  );
}

export default App;