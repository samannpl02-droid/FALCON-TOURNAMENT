
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Tournament, User } from '../types';
import { notify } from '../services/events';

const MyTournaments: React.FC<{ user: User }> = ({ user }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [timeStrings, setTimeStrings] = useState<{[key:number]: string}>({});

  useEffect(() => {
    const all = db.getTournaments();
    setTournaments(all.filter(t => t.participants.includes(user.id)).reverse());
  }, [user.id]);

  // Countdown Logic
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const nextTimes: {[key:number]: string} = {};
        
        tournaments.forEach(t => {
            if(t.status === 'Open') {
                const diff = new Date(t.match_time).getTime() - now;
                if(diff > 0) {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    nextTimes[t.id] = `${hours}h ${minutes}m ${seconds}s`;
                } else {
                    nextTimes[t.id] = "Starting Soon";
                }
            }
        });
        setTimeStrings(nextTimes);
    }, 1000);
    return () => clearInterval(interval);
  }, [tournaments]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notify("Copied to clipboard!", "success");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <i className="fa-solid fa-gamepad text-accent"></i> Game Lobby
      </h2>
      
      {tournaments.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-secondary rounded-xl border border-gray-800">
            <i className="fa-solid fa-ticket text-4xl mb-3 opacity-20"></i>
            <p>You haven't joined any tournaments yet.</p>
        </div>
      ) : (
        tournaments.map(t => (
          <div key={t.id} className="bg-secondary rounded-xl border border-gray-800 overflow-hidden shadow-lg relative">
            {/* Header */}
            <div className="bg-gray-900 p-3 border-b border-gray-800 flex justify-between items-center">
               <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${t.status === 'Completed' ? 'bg-blue-500' : 'bg-green-500 animate-pulse'}`}></div>
                   <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{t.status}</span>
               </div>
               {t.status === 'Open' && timeStrings[t.id] && (
                   <span className="text-xs font-mono text-accent bg-green-900/30 px-2 py-0.5 rounded border border-green-900/50">Starts: {timeStrings[t.id]}</span>
               )}
            </div>

            <div className="p-4">
                <h3 className="font-bold text-white text-xl mb-1">{t.title}</h3>
                <p className="text-sm text-accent font-medium mb-4">{t.game_name} • {new Date(t.match_time).toLocaleString()}</p>

                {/* Credentials Box */}
                <div className="bg-black/40 rounded-lg p-4 border border-gray-700/50 mb-4 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <i className="fa-solid fa-key text-4xl text-white"></i>
                    </div>

                    {t.room_id && t.room_password ? (
                        <div className="space-y-3 relative z-10">
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Room ID</label>
                                <div className="flex gap-2">
                                    <code className="bg-gray-800 text-white font-mono px-3 py-2 rounded flex-1 border border-gray-700 select-all flex items-center">
                                        {t.room_id}
                                    </code>
                                    <button onClick={() => copyToClipboard(t.room_id!)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded border border-gray-600">
                                        <i className="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Password</label>
                                <div className="flex gap-2">
                                    <code className="bg-gray-800 text-white font-mono px-3 py-2 rounded flex-1 border border-gray-700 select-all flex items-center">
                                        {t.room_password}
                                    </code>
                                    <button onClick={() => copyToClipboard(t.room_password!)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded border border-gray-600">
                                        <i className="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 relative z-10">
                            <i className="fa-solid fa-lock text-gray-600 text-2xl mb-2"></i>
                            <p className="text-gray-400 text-xs">Room details will be available 15 minutes before the match starts.</p>
                        </div>
                    )}
                </div>

                {t.status === 'Open' && (
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 mb-2 transition-transform active:scale-95">
                        <i className="fa-solid fa-rocket"></i> Launch Game
                    </button>
                )}

                {t.status === 'Completed' && t.winner_id === user.id && (
                    <div className="w-full bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border border-yellow-500/50 text-yellow-500 p-3 rounded-lg text-center font-bold animate-pulse">
                        <i className="fa-solid fa-trophy mr-2"></i> Winner! +{t.prize_pool} Coins
                    </div>
                )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyTournaments;
