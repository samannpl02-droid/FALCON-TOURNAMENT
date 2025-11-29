
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  toggleProfile: () => void;
  logoUrl?: string;
  appName?: string;
}

const Header: React.FC<HeaderProps> = ({ user, toggleProfile, logoUrl, appName }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-secondary border-b border-gray-800 z-50 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-10 w-10 object-cover rounded-full bg-gray-900 border border-gray-700" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
            <i className="fa-solid fa-trophy"></i>
          </div>
        )}
        <h1 className="text-xl font-bold tracking-tight text-white italic">{appName || "Tourna NP"}</h1>
      </div>
      
      {user && (
        <div className="flex items-center gap-3">
          {!user.isAdmin && (
            <div className="bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700 flex items-center gap-2">
              <i className="fa-solid fa-coins text-yellow-500 text-xs animate-pulse"></i>
              <span className="text-sm font-bold text-white">{user.wallet_balance}</span>
            </div>
          )}
          <button onClick={toggleProfile} className="w-9 h-9 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-300 active:scale-95 transition-transform overflow-hidden">
            {user.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover" />
            ) : (
                <i className="fa-solid fa-user"></i>
            )}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
