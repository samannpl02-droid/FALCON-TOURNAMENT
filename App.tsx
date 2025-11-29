
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav, { Tab } from './components/BottomNav';
import Toast from './components/Toast';
import { db } from './services/mockDb';
import { User } from './types';
import Login from './views/Login';
import Home from './views/Home';
import Wallet from './views/Wallet';
import Profile from './views/Profile';
import MyTournaments from './views/MyTournaments';
import AdminDashboard from './views/AdminDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);
  const [appLogo, setAppLogo] = useState<string>('');
  const [appName, setAppName] = useState<string>('Tourna NP');
  
  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);

  // Initial Auth & Settings Check
  useEffect(() => {
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.isAdmin) setActiveTab('admin');
    }
    
    // Load logo and name
    const settings = db.getSettings();
    if (settings.app_logo_url) setAppLogo(settings.app_logo_url);
    if (settings.app_name) setAppName(settings.app_name);

    setLoading(false);

    // Toast Listener
    const handleToast = (e: any) => {
        setToast({ msg: e.detail.message, type: e.detail.type });
    };
    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  // Poll for wallet/settings/profile updates
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
        const freshUser = db.getCurrentUser();
        // Detect profile or balance changes
        if(freshUser && (freshUser.wallet_balance !== user.wallet_balance || freshUser.avatar_url !== user.avatar_url || freshUser.username !== user.username)) {
            setUser(freshUser);
        }
        // Check for Logo/Name update
        const s = db.getSettings();
        if(s.app_logo_url !== appLogo) setAppLogo(s.app_logo_url);
        if(s.app_name !== appName) setAppName(s.app_name);
    }, 2000);
    return () => clearInterval(interval);
  }, [user, appLogo, appName]);

  const handleLogin = (u: User) => {
    setUser(u);
    setActiveTab(u.isAdmin ? 'admin' : 'home');
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setActiveTab('home');
  };

  if (loading) return <div className="min-h-screen bg-primary flex items-center justify-center text-accent animate-pulse"><i className="fa-solid fa-trophy text-4xl"></i></div>;

  return (
    <div className="min-h-screen bg-primary pb-20 pt-16 font-sans">
      {/* Global Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {!user ? (
        <Login onLogin={handleLogin} appName={appName} />
      ) : user.isAdmin ? (
         <div className="bg-primary pb-safe font-sans min-h-screen">
             <div className="max-w-md mx-auto p-4">
               <AdminDashboard user={user} onLogout={handleLogout} />
             </div>
         </div>
      ) : (
        <>
            <Header user={user} toggleProfile={() => setActiveTab('profile')} logoUrl={appLogo} appName={appName} />
            
            <main className="max-w-md mx-auto h-full p-4 animate-fade-in">
                {activeTab === 'home' && <Home user={user} refreshUser={() => setUser(db.getCurrentUser())} onNavigate={setActiveTab} />}
                {activeTab === 'my-tournaments' && <MyTournaments user={user} />}
                {activeTab === 'wallet' && <Wallet user={user} refreshUser={() => setUser(db.getCurrentUser())} />}
                {activeTab === 'profile' && <Profile user={user} onLogout={handleLogout} />}
            </main>

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={false} />
        </>
      )}
    </div>
  );
};

export default App;
