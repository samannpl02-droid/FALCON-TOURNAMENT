
import React from 'react';

export type Tab = 'home' | 'my-tournaments' | 'wallet' | 'profile' | 'admin';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  isAdmin: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const NavItem = ({ tab, icon, label }: { tab: Tab; icon: string; label: string }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:bg-gray-800 rounded-lg mx-1 ${activeTab === tab ? 'text-accent' : 'text-gray-500'}`}
    >
      <i className={`fa-solid ${icon} text-lg`}></i>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  // If Admin, do not show bottom nav, they only have the Dashboard
  if (isAdmin) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-secondary border-t border-gray-800 flex items-center justify-around z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
      <NavItem tab="home" icon="fa-house" label="Home" />
      <NavItem tab="my-tournaments" icon="fa-gamepad" label="My Matches" />
      <NavItem tab="wallet" icon="fa-wallet" label="Wallet" />
      <NavItem tab="profile" icon="fa-user" label="Profile" />
    </div>
  );
};

export default BottomNav;
