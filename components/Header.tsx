import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-blue-400">Gen</span>BOQ
            </h1>
            <p className="ml-4 text-sm text-slate-400 hidden md:block">AI-Powered AV Bill of Quantities</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
