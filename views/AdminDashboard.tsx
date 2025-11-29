
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { User, Tournament, DepositRequest, WithdrawalRequest, TournamentStatus, AppSettings, RequestStatus } from '../types';
import { notify } from '../services/events';

interface AdminProps {
  user: User;
  onLogout: () => void;
}

type AdminView = 'home' | 'users' | 'deposits' | 'withdrawals' | 'settings';

const AdminDashboard: React.FC<AdminProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<AdminView>('home');
  
  // Data State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ 
      app_name: '', support_email: '', admin_upi_id: '', admin_qr_code_url: '', app_logo_url: '', banner_ads: [],
      socials: { facebook: '', youtube: '', tiktok: '', instagram: '' }
  });

  // UI States
  const [isCreating, setIsCreating] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [userSearch, setUserSearch] = useState('');
  
  // Create Form
  const [tForm, setTForm] = useState({ 
      title: '', game_name: '', entry_fee: 0, prize_pool: 0, match_time: '', room_id: '', room_password: ''
  });

  // Edit Form (Derived from editingTournament but separate state for inputs)
  const [editForm, setEditForm] = useState({
      title: '', game_name: '', entry_fee: 0, prize_pool: 0, match_time: '', room_id: '', room_password: ''
  });

  const [airdropUid, setAirdropUid] = useState('');
  const [airdropAmt, setAirdropAmt] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Load All Data
  const loadData = () => {
    setTournaments(db.getTournaments());
    setUsers(db.getAllUsers());
    setDeposits(db.getDepositRequests().filter(d => d.status === RequestStatus.PENDING));
    setWithdrawals(db.getWithdrawalRequests().filter(w => w.status === RequestStatus.PENDING));
    setSettings(db.getSettings());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, []);

  // Helpers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- Actions ---

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    db.createTournament(tForm);
    setIsCreating(false);
    setTForm({ title: '', game_name: '', entry_fee: 0, prize_pool: 0, match_time: '', room_id: '', room_password: '' });
    loadData();
    notify("Tournament Created Successfully!", "success");
  };

  const handleEditClick = (t: Tournament) => {
      setEditingTournament(t);
      setEditForm({
          title: t.title,
          game_name: t.game_name,
          entry_fee: t.entry_fee,
          prize_pool: t.prize_pool,
          match_time: t.match_time,
          room_id: t.room_id || '',
          room_password: t.room_password || ''
      });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingTournament) return;
      db.updateTournament(editingTournament.id, editForm);
      setEditingTournament(null);
      loadData();
      notify("Tournament Updated!", "success");
  };

  const handleDeclareWinner = (tId: number) => {
    const winnerIdStr = prompt("Enter Winner's User ID (UID):");
    if (!winnerIdStr) return;
    
    // Check if user exists first logic is inside declareWinner now
    const res = db.declareWinner(tId, Number(winnerIdStr));
    
    if (res.success) {
        notify("🎉 Winner Declared! Msg Sent.", "success");
        loadData();
    } else {
        notify(`Failed: ${res.message}`, "error");
    }
  };

  const handleDeleteTournament = (id: number) => {
    if(window.confirm("Delete this tournament?")) {
        db.deleteTournament(id);
        loadData(); // Force refresh
        notify("Tournament Deleted", "info");
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      db.updateSettings(settings);
      notify("Settings Saved!", "success");
      setTimeout(() => window.location.reload(), 1000);
  };

  const handleDeleteUser = (uId: number) => {
      if(window.confirm(`Permanently delete User ${uId}?`)) {
          db.deleteUser(Number(uId));
          loadData(); // Force refresh to update UI immediately
          notify("User Deleted", "info");
      }
  }

  const handleAirdrop = (e: React.FormEvent) => {
      e.preventDefault();
      if(!airdropUid || !airdropAmt) return;
      const success = db.adminAddCoins(Number(airdropUid), Number(airdropAmt));
      if(success) {
          notify(`Sent ${airdropAmt} coins to UID ${airdropUid}`, "success");
          setAirdropUid('');
          setAirdropAmt('');
          loadData();
      } else {
          notify("User not found!", "error");
      }
  }

  const handleDeposit = (id: number, approved: boolean) => {
      if(window.confirm(approved ? "Approve & Credit Coins?" : "Reject Request?")) {
          db.processDeposit(id, approved);
          loadData();
          notify(approved ? "Deposit Approved" : "Deposit Rejected", approved ? "success" : "info");
      }
  }

  const handleWithdrawal = (id: number, approved: boolean) => {
      if(window.confirm(approved ? "Mark COMPLETED (Money Sent)?" : "Reject (Refund Coins)?")) {
          db.processWithdrawal(id, approved);
          loadData();
          notify(approved ? "Withdrawal Completed" : "Withdrawal Rejected", approved ? "success" : "info");
      }
  }

  // Filtered Users
  const filteredUsers = users.filter(u => 
      u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.phone.includes(userSearch) || 
      u.id.toString().includes(userSearch)
  );

  const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
    <div className={`bg-secondary p-4 rounded-xl border-t-4 ${color} shadow-lg flex flex-col justify-center items-center`}>
        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">{label}</p>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setZoomImage(null)}>
            <img src={zoomImage} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="Zoom" />
            <button className="absolute top-4 right-4 text-white text-xl bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition-colors">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
      )}

      {/* Edit Tournament Modal */}
      {editingTournament && (
         <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
             <form onSubmit={handleSaveEdit} className="bg-secondary w-full max-w-sm rounded-xl border border-gray-700 p-4 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                     <h3 className="text-white font-bold">Edit Tournament</h3>
                     <button type="button" onClick={() => setEditingTournament(null)} className="text-gray-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                 </div>
                 
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block">Title</label>
                    <input className="input-field" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required/>
                 </div>
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block">Game</label>
                    <input className="input-field" value={editForm.game_name} onChange={e => setEditForm({...editForm, game_name: e.target.value})} required/>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Entry Fee</label>
                        <input type="number" className="input-field" value={editForm.entry_fee} onChange={e => setEditForm({...editForm, entry_fee: Number(e.target.value)})} required/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Prize</label>
                        <input type="number" className="input-field" value={editForm.prize_pool} onChange={e => setEditForm({...editForm, prize_pool: Number(e.target.value)})} required/>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block">Match Time</label>
                    <input type="datetime-local" className="input-field" value={editForm.match_time} onChange={e => setEditForm({...editForm, match_time: e.target.value})} required/>
                 </div>
                 
                 <div className="bg-gray-900 p-2 rounded border border-gray-700">
                     <p className="text-xs font-bold text-accent mb-2">Room Credentials</p>
                     <div className="space-y-2">
                        <input placeholder="Room ID" className="input-field text-sm" value={editForm.room_id} onChange={e => setEditForm({...editForm, room_id: e.target.value})} />
                        <input placeholder="Password" className="input-field text-sm" value={editForm.room_password} onChange={e => setEditForm({...editForm, room_password: e.target.value})} />
                     </div>
                 </div>

                 <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500">Save Changes</button>
             </form>
         </div>
      )}

      {/* Admin Header */}
      <div className="flex justify-between items-center bg-secondary p-4 rounded-xl border border-gray-800 shadow-md">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-accent"></i> Admin Panel
            </h2>
            <p className="text-xs text-gray-400">{settings.app_name} Manager</p>
        </div>
        <button onClick={onLogout} className="bg-red-900/20 text-red-500 border border-red-900/50 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-900/40">
            Logout
        </button>
      </div>

      {/* Nav */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
            { id: 'home', icon: 'fa-house', label: 'Home' },
            { id: 'users', icon: 'fa-users', label: 'Users' },
            { id: 'deposits', icon: 'fa-money-bill-transfer', label: 'Deposits' },
            { id: 'withdrawals', icon: 'fa-money-bill-1', label: 'Payouts' },
            { id: 'settings', icon: 'fa-gear', label: 'Config' },
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setView(tab.id as AdminView)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all flex-1 justify-center ${
                    view === tab.id ? 'bg-accent text-black shadow-lg shadow-green-900/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
                <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
        ))}
      </div>

      {/* VIEW: HOME */}
      {view === 'home' && (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Users" value={users.length} color="border-blue-500" />
                  <StatCard label="Live" value={tournaments.filter(t => t.status === TournamentStatus.OPEN).length} color="border-green-500" />
                  <StatCard label="Dep. Pending" value={deposits.length} color="border-yellow-500" />
                  <StatCard label="W/D Pending" value={withdrawals.length} color="border-red-500" />
              </div>

              <div>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-white text-lg pl-2 border-l-4 border-accent">Tournaments</h3>
                      <button onClick={() => setIsCreating(!isCreating)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2">
                        <i className={`fa-solid ${isCreating ? 'fa-xmark' : 'fa-plus'}`}></i> {isCreating ? 'Cancel' : 'Create'}
                      </button>
                  </div>
                  
                  {isCreating && (
                    <form onSubmit={handleCreateTournament} className="bg-secondary border border-gray-700 p-4 rounded-xl space-y-3 shadow-xl mb-4">
                        <h4 className="text-white font-bold text-sm border-b border-gray-700 pb-2">New Tournament Details</h4>
                        <input placeholder="Title" className="input-field" value={tForm.title} onChange={e => setTForm({...tForm, title: e.target.value})} required/>
                        <input placeholder="Game" className="input-field" value={tForm.game_name} onChange={e => setTForm({...tForm, game_name: e.target.value})} required/>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="number" placeholder="Fee" className="input-field" value={tForm.entry_fee} onChange={e => setTForm({...tForm, entry_fee: Number(e.target.value)})} required/>
                            <input type="number" placeholder="Prize" className="input-field" value={tForm.prize_pool} onChange={e => setTForm({...tForm, prize_pool: Number(e.target.value)})} required/>
                        </div>
                        <input type="datetime-local" className="input-field" value={tForm.match_time} onChange={e => setTForm({...tForm, match_time: e.target.value})} required/>
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                            <label className="text-xs text-accent font-bold mb-2 block"><i className="fa-solid fa-key"></i> Room (Optional)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="Room ID" className="input-field text-sm" value={tForm.room_id} onChange={e => setTForm({...tForm, room_id: e.target.value})}/>
                                <input placeholder="Password" className="input-field text-sm" value={tForm.room_password} onChange={e => setTForm({...tForm, room_password: e.target.value})}/>
                            </div>
                        </div>
                        <button className="w-full bg-accent text-black font-bold py-3 rounded-lg hover:bg-green-600 transition-all shadow-lg">Publish</button>
                    </form>
                  )}

                  <div className="space-y-3">
                    {tournaments.length === 0 && <p className="text-gray-500 text-center">No tournaments yet.</p>}
                    {tournaments.map(t => (
                        <div key={t.id} className="bg-secondary rounded-xl border border-gray-800 p-4 shadow-lg">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white text-lg">{t.title}</h3>
                                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${t.status === 'Open' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{t.status}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>{t.game_name}</span>
                                <span>{new Date(t.match_time).toLocaleString()}</span>
                            </div>
                            <div className="bg-gray-900 p-2 rounded flex justify-between items-center mb-3 border border-gray-700/50">
                                <div><span className="text-[10px] text-gray-500 uppercase block">Fee</span><span className="text-white font-bold">{t.entry_fee}</span></div>
                                <div className="h-6 w-[1px] bg-gray-700"></div>
                                <div className="text-right"><span className="text-[10px] text-gray-500 uppercase block">Prize</span><span className="text-accent font-bold">{t.prize_pool}</span></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleEditClick(t)} className="bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded py-2 text-xs font-bold hover:bg-blue-900/40">Edit</button>
                                <button onClick={() => handleDeclareWinner(t.id)} className="bg-yellow-900/20 text-yellow-400 border border-yellow-900/50 rounded py-2 text-xs font-bold hover:bg-yellow-900/40">Winner</button>
                                <button onClick={() => handleDeleteTournament(t.id)} className="bg-red-900/20 text-red-400 border border-red-900/50 rounded py-2 text-xs font-bold hover:bg-red-900/40">Delete</button>
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      )}

      {/* VIEW: USERS */}
      {view === 'users' && (
        <div className="space-y-4 animate-fade-in">
            {/* Quick Send */}
            <div className="bg-secondary p-4 rounded-xl border border-gray-800">
                <h3 className="font-bold text-white mb-2 text-sm"><i className="fa-solid fa-paper-plane text-accent"></i> Send Coin (Airdrop)</h3>
                <form onSubmit={handleAirdrop} className="flex gap-2">
                    <input placeholder="UID" className="w-20 input-field" value={airdropUid} onChange={e => setAirdropUid(e.target.value)}/>
                    <input placeholder="Amount" className="flex-1 input-field" value={airdropAmt} onChange={e => setAirdropAmt(e.target.value)}/>
                    <button className="bg-accent text-black px-4 rounded font-bold text-sm hover:bg-green-600">Send</button>
                </form>
            </div>

            {/* Search */}
            <div className="relative">
                <i className="fa-solid fa-search absolute left-3 top-3.5 text-gray-500"></i>
                <input 
                    placeholder="Search Users (Name, Phone, UID)..." 
                    className="w-full bg-gray-900 border border-gray-700 pl-10 pr-4 py-3 rounded-lg text-white outline-none focus:border-accent"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                {filteredUsers.length === 0 && <p className="text-gray-500 text-center">No users found.</p>}
                {filteredUsers.map(u => (
                    <div key={u.id} className="bg-secondary p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                             {u.avatar_url ? <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover border border-gray-600"/> : <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"><i className="fa-solid fa-user"></i></div>}
                            <div>
                                <div className="font-bold text-white text-sm">{u.username}</div>
                                <div className="text-xs text-gray-400">UID: {u.id} | {u.phone}</div>
                                <div className="text-xs text-accent font-bold">Bal: {u.wallet_balance}</div>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteUser(u.id)} className="bg-red-900/20 text-red-500 w-8 h-8 rounded flex items-center justify-center hover:bg-red-900/40 border border-red-900/30">
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* VIEW: DEPOSITS */}
      {view === 'deposits' && (
        <div className="space-y-4 animate-fade-in">
             <div className="bg-yellow-900/20 text-yellow-500 p-2 rounded border border-yellow-900/50 text-xs text-center">Only "Pending" requests shown.</div>
             {deposits.length === 0 && <p className="text-gray-500 text-center py-10">No pending requests.</p>}
             {deposits.map(d => (
                 <div key={d.id} className="bg-secondary p-4 rounded-xl border border-gray-800 shadow-lg">
                     <div className="flex justify-between items-center mb-3">
                         <span className="font-black text-2xl text-accent">{d.amount} <span className="text-sm font-normal text-gray-400">Coins</span></span>
                         <span className="text-[10px] px-2 py-1 rounded uppercase font-bold bg-yellow-600 text-white">PENDING</span>
                     </div>
                     <div className="text-xs text-gray-400 mb-4 bg-gray-900 p-2 rounded">
                         <p>UID: <span className="text-white font-mono">{d.user_id}</span></p>
                         <p>Txn ID: <span className="text-white font-mono">{d.transaction_id}</span></p>
                     </div>
                     {d.screenshot_url && (
                         <div className="mb-4 relative group cursor-pointer" onClick={() => setZoomImage(d.screenshot_url || '')}>
                             <img src={d.screenshot_url} className="w-full h-32 object-cover rounded border border-gray-700" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 text-white font-bold"><i className="fa-solid fa-magnifying-glass mr-2"></i> Zoom</div>
                         </div>
                     )}
                     <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => handleDeposit(d.id, true)} className="bg-green-600 text-white py-3 rounded font-bold shadow hover:bg-green-500">Approve</button>
                         <button onClick={() => handleDeposit(d.id, false)} className="bg-red-600 text-white py-3 rounded font-bold shadow hover:bg-red-500">Reject</button>
                     </div>
                 </div>
             ))}
        </div>
      )}

      {/* VIEW: WITHDRAWALS */}
      {view === 'withdrawals' && (
        <div className="space-y-4 animate-fade-in">
             <div className="bg-yellow-900/20 text-yellow-500 p-2 rounded border border-yellow-900/50 text-xs text-center">Only "Pending" requests shown.</div>
             {withdrawals.length === 0 && <p className="text-gray-500 text-center py-10">No pending requests.</p>}
             {withdrawals.map(w => (
                 <div key={w.id} className="bg-secondary p-4 rounded-xl border border-gray-800 shadow-lg">
                     <div className="flex justify-between items-center mb-3">
                         <span className="font-black text-2xl text-white">{w.amount} <span className="text-sm font-normal text-gray-400">Coins</span></span>
                         <span className="text-[10px] px-2 py-1 rounded uppercase font-bold bg-yellow-600 text-white">PENDING</span>
                     </div>
                     <div className="text-xs text-gray-400 mb-4">UID: {w.user_id}</div>
                     {w.qr_code_url && (
                         <div className="mb-4 cursor-pointer" onClick={() => setZoomImage(w.qr_code_url || '')}>
                             <img src={w.qr_code_url} className="w-32 h-32 object-contain bg-white rounded p-2" />
                         </div>
                     )}
                     <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => handleWithdrawal(w.id, true)} className="bg-green-600 text-white py-3 rounded font-bold shadow hover:bg-green-500">Sent</button>
                         <button onClick={() => handleWithdrawal(w.id, false)} className="bg-red-600 text-white py-3 rounded font-bold shadow hover:bg-red-500">Reject</button>
                     </div>
                 </div>
             ))}
        </div>
      )}

      {/* VIEW: SETTINGS */}
      {view === 'settings' && (
        <div className="animate-fade-in bg-secondary border border-gray-800 rounded-xl p-4">
            <h3 className="font-bold text-white mb-4">App Configuration</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="border-b border-gray-800 pb-4">
                    <h4 className="text-sm font-bold text-accent mb-2">General</h4>
                    <label className="text-xs text-gray-500 block mb-1">App Name</label>
                    <input className="input-field" value={settings.app_name} onChange={e => setSettings({...settings, app_name: e.target.value})} />
                    <label className="text-xs text-gray-500 block mt-3 mb-1">Support Email</label>
                    <input className="input-field" value={settings.support_email} onChange={e => setSettings({...settings, support_email: e.target.value})} />
                </div>
                
                <div className="border-b border-gray-800 pb-4">
                    <h4 className="text-sm font-bold text-accent mb-2">Social Links</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1"><i className="fa-brands fa-facebook"></i> Facebook</label>
                            <input className="input-field" placeholder="https://..." value={settings.socials.facebook} onChange={e => setSettings({...settings, socials: {...settings.socials, facebook: e.target.value}})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1"><i className="fa-brands fa-youtube"></i> YouTube</label>
                            <input className="input-field" placeholder="https://..." value={settings.socials.youtube} onChange={e => setSettings({...settings, socials: {...settings.socials, youtube: e.target.value}})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1"><i className="fa-brands fa-tiktok"></i> TikTok</label>
                            <input className="input-field" placeholder="https://..." value={settings.socials.tiktok} onChange={e => setSettings({...settings, socials: {...settings.socials, tiktok: e.target.value}})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1"><i className="fa-brands fa-instagram"></i> Instagram</label>
                            <input className="input-field" placeholder="https://..." value={settings.socials.instagram} onChange={e => setSettings({...settings, socials: {...settings.socials, instagram: e.target.value}})} />
                        </div>
                    </div>
                </div>

                <div className="border-b border-gray-800 pb-4">
                    <h4 className="text-sm font-bold text-accent mb-2">Admin Payment Info</h4>
                    <label className="text-xs text-gray-500 block mb-1">UPI/Phone</label>
                    <input className="input-field" value={settings.admin_upi_id} onChange={e => setSettings({...settings, admin_upi_id: e.target.value})} />
                    <label className="text-xs text-gray-500 block mt-3 mb-1">QR Image</label>
                    <input type="file" className="text-xs text-gray-400" onChange={e => handleFileChange(e, (s) => setSettings({...settings, admin_qr_code_url: s}))} />
                    {settings.admin_qr_code_url && <img src={settings.admin_qr_code_url} className="w-20 h-20 mt-2 bg-white object-contain p-1 rounded"/>}
                </div>
                <div className="border-b border-gray-800 pb-4">
                    <h4 className="text-sm font-bold text-accent mb-2">Branding</h4>
                    <label className="text-xs text-gray-500 block mb-1">Logo</label>
                    <input type="file" className="text-xs text-gray-400" onChange={e => handleFileChange(e, (s) => setSettings({...settings, app_logo_url: s}))} />
                    {settings.app_logo_url && <img src={settings.app_logo_url} className="w-16 h-16 mt-2 rounded-full border border-gray-600 object-cover"/>}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-accent mb-2">Banners</h4>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {settings.banner_ads.map((ad, idx) => (
                            <div key={idx} className="relative group">
                                <img src={ad} className="w-full h-16 object-cover rounded border border-gray-700" />
                                <button type="button" onClick={() => setSettings({...settings, banner_ads: settings.banner_ads.filter((_, i) => i !== idx)})} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">x</button>
                            </div>
                        ))}
                    </div>
                    <input type="file" className="text-xs text-gray-400" onChange={e => handleFileChange(e, (s) => setSettings({...settings, banner_ads: [...settings.banner_ads, s]}))} />
                </div>
                <button className="w-full bg-accent text-black font-bold py-3 rounded-lg mt-4 hover:bg-green-600">Save Configuration</button>
            </form>
        </div>
      )}

      <style>{`
        .input-field {
            width: 100%;
            background-color: #0f172a;
            border: 1px solid #374151;
            padding: 0.75rem;
            border-radius: 0.5rem;
            color: white;
            outline: none;
            transition: border-color 0.2s;
        }
        .input-field:focus {
            border-color: #22c55e;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
