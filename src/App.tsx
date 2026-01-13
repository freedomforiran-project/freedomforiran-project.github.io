import React, { useEffect } from 'react';
import MPLookup from './components/MPLookup';

function App() {
  useEffect(() => {
    document.title = 'Contact Your MP About Iran - Take Action';
  }, []);

  return (
    <div className="min-h-screen">
      <MPLookup />
    </div>
  );
}

export default App;