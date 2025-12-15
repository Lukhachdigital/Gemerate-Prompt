import React from 'react';
import { VideoCameraIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="w-full h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[#050505] shrink-0 z-20">
      <div className="flex items-center gap-3">
        <VideoCameraIcon className="w-6 h-6 text-amber-500" />
        <h1 className="text-xl font-bold text-amber-500 tracking-[0.2em] cinematic-font">
          GENERATE PROMPT
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:block w-px h-4 bg-gray-800 mx-2"></div>
        <div className="hidden md:block text-gray-500 text-xs uppercase tracking-widest font-medium mr-2">
            Hollywood Screenwriter Assistant
        </div>
        <button 
          onClick={onOpenSettings}
          className="text-gray-400 hover:text-amber-500 transition-colors p-2 rounded-full hover:bg-gray-900"
          title="Cài đặt API Key"
        >
           <Cog6ToothIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;