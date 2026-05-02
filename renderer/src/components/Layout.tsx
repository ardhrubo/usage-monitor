import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      <nav className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">Usage Monitor</h1>
        </div>
        <div className="px-4 space-y-2">
          <a
            href="/"
            className="block px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
          >
            Dashboard
          </a>
          <a
            href="/timeline"
            className="block px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
          >
            Timeline
          </a>
          <a
            href="/settings"
            className="block px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
          >
            Settings
          </a>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
