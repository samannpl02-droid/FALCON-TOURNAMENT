
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Tournament, User, TournamentStatus } from '../types';
import BannerCarousel from '../components/BannerCarousel';
import { Tab } from '../components/BottomNav';
import { notify } from '../services/events';

interface HomeProps {
  user: User;
  refreshUser: () => void;
  onNavigate: (tab: Tab) => void;
}

const Home: React.FC<HomeProps> = ({ user, refreshUser, onNavigate }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [banners, setBanners] = useState<string[]>([]);

  useEffect(() => {
    setTournaments(db.getTournaments());
    setBanners(db.getSettings().banner_ads);
  }, []);

  const handleJoin = (tId: number, entryFee: number) => {
    // Immediate balance check for better UX
    if (user.wallet_balance < entryFee) {
        notify("Insufficient Balance! Please deposit coins.", "error");
        onNavigate('wallet'); // Redirect user to wallet page
        return;
    }

    // Attempt join
    const res = db.joinTournament(user.id, tId);
    
    if (res.success) {
      notify("Joined successfully! Good luck.", "success");
      setTournaments(db.getTournaments()); // Refresh list
      refreshUser(); // Refresh balance
    } else {
      notify(res.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <BannerCarousel banners={banners} />

      <div>
        <h2 className="text-xl font-bold text-white mb-3 pl-1 border-l-4 border-accent">Live Tournaments</h2>
        
        {tournaments.length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-secondary rounded-xl border border-gray-800">
            <i className="fa-solid fa-ghost text-4xl mb-3 opacity-20"></i>
            <p>No tournaments active right now.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournaments.map(t => {
              const isJoined = t.participants.includes(user.id);
              const isOpen = t.status === TournamentStatus.OPEN;

              return (
                <div key={t.id} className="bg-secondary rounded-xl border border-gray-800 overflow-hidden shadow-lg transition-transform hover:scale-[1.01]">
                  <div className="h-36 bg-gray-800 relative">
                    <img src={`https://picsum.photos/seed/${t.id}/600/300`} alt="game" className="w-full h-full object-cover opacity-70" />
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${isOpen ? 'bg-red-600 animate-pulse' : 'bg-gray-600'}`}>
                      {t.status}
                    </div>
                    {isJoined && (
                        <div className="absolute top-2 left-2 bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white shadow-lg">
                            <i className="fa-solid fa-check-circle mr-1"></i> Joined
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                       <h3 className="text-lg font-bold text-white">{t.title}</h3>
                       <p className="text-xs text-accent font-medium">{t.game_name}</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4 bg-gray-900/50 p-2 rounded-lg">
                      <div className="text-center">
                        <span className="text-gray-500 text-[10px] block uppercase">Prize</span>
                        <span className="text-accent font-black text-lg">₹{t.prize_pool}</span>
                      </div>
                      <div className="h-8 w-[1px] bg-gray-700"></div>
                      <div className="text-center">
                        <span className="text-gray-500 text-[10px] block uppercase">Entry</span>
                        <span className="text-white font-black text-lg">₹{t.entry_fee}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-400 mb-4 px-1">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-regular fa-clock text-accent"></i> {new Date(t.match_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit'})}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-users text-accent"></i> {t.participants.length} Joined
                      </div>
                    </div>

                    {isJoined ? (
                      <button 
                        onClick={() => onNavigate('my-tournaments')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 relative"
                      >
                        <i className="fa-solid fa-gamepad mr-2"></i> Play
                      </button>
                    ) : isOpen ? (
                      <button 
                        onClick={() => handleJoin(t.id, t.entry_fee)}
                        className="w-full bg-accent hover:bg-green-600 text-black font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-green-900/20"
                      >
                        Join Now
                      </button>
                    ) : (
                      <button disabled className="w-full bg-gray-800 text-gray-500 font-bold py-2.5 rounded-lg cursor-not-allowed">
                        Registration Closed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
