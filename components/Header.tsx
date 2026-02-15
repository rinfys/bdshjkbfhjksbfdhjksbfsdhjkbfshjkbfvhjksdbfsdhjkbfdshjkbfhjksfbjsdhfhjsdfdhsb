import React from 'react';
import { NAV_LINKS } from '../constants';

const Header = () => {
  return (
    <header className="bg-fpl-purple border-b border-white/10 relative z-50">
      {/* Top Gradient Bar similar to official site */}
      <div className="h-1 w-full bg-gradient-to-r from-fpl-blue via-white to-fpl-green"></div>
      
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
        <nav className="flex items-center h-12 gap-6 text-[13px] font-medium text-white whitespace-nowrap">
          {NAV_LINKS.map((link, i) => (
            <a 
                key={link} 
                href="#" 
                className={`hover:text-fpl-green transition-colors ${i === 1 ? 'text-white border-b-4 border-fpl-green h-full flex items-center pt-1' : 'text-gray-300'}`}
            >
              {link}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
