
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { User, Transaction, AppSettings } from '../types';
import { notify } from '../services/events';

interface WalletProps {
  user: User;
  refreshUser: () => void;
}

const Wallet: React.FC<WalletProps> = ({ user, refreshUser }) => {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [view, setView] = useState<'main' | 'add' | 'withdraw'>('main');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'txns' | 'requests'>('txns');
  const [txnFilter, setTxnFilter] = useState<'all'|'credit'|'debit'>('all'); // New Filter
  
  // States
  const [depAmount, setDepAmount] = useState('');
  const [depTxnId, setDepTxnId] = useState('');
  const [depProof, setDepProof] = useState<string>('');
  const [wdAmount, setWdAmount] = useState('');
  const [wdQr, setWdQr] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    setHistory(db.getTransactions(user.id));
    setSettings(db.getSettings());
    const deps = db.getDepositRequests().filter(d => d.user_id === user.id).map(d => ({...d, type: 'Deposit'}));
    const wds = db.getWithdrawalRequests().filter(w => w.user_id === user.id).map(w => ({...w, type: 'Withdraw'}));
    setMyRequests([...deps, ...wds].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  }, [user.id, user.wallet_balance]); 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depAmount || !depProof) {
        notify("Please enter amount and upload screenshot", "error");
        return;
    }
    db.requestDeposit(user.id, Number(depAmount), depTxnId, depProof);
    notify('Deposit request submitted! Wait for Admin approval.', "success");
    setView('main');
    setDepAmount('');
    setDepTxnId('');
    setDepProof('');
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wdAmount || !wdQr) {
        notify("Please enter amount and upload your QR Code", "error");
        return;
    }
    const success = db.requestWithdrawal(user.id, Number(wdAmount), wdQr);
    if (success) {
      notify('Withdrawal request submitted!', "success");
      refreshUser();
      setView('main');
      setWdAmount('');
      setWdQr('');
    } else {
      notify('Insufficient balance.', "error");
    }
  };

  const filteredHistory = history.filter(t => txnFilter === 'all' ? true : t.type === txnFilter);

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-green-800 to-slate-900 rounded-2xl p-6 shadow-xl border border-green-700 relative overflow-hidden transform transition-all hover:scale-[1.01]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fa-solid fa-wallet text-9xl text-white"></i>
        </div>
        <p className="text-green-200 text-sm font-medium">Available Coins</p>
        <h2 className="text-4xl font-bold text-white mt-1">{user.wallet_balance} <span className="text-lg text-green-300">Coins</span></h2>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setView('add')} className="flex-1 bg-white text-green-900 font-bold py-2.5 rounded-lg shadow hover:bg-gray-100 flex items-center justify-center gap-2">
            <i className="fa-solid fa-circle-plus"></i> Buy Coin
          </button>
          <button onClick={() => setView('withdraw')} className="flex-1 bg-black/30 text-white font-bold py-2.5 rounded-lg border border-white/20 hover:bg-black/50 flex items-center justify-center gap-2">
            <i className="fa-solid fa-money-bill-transfer"></i> Withdraw
          </button>
        </div>
      </div>

      {/* MODAL: ADD MONEY */}
      {view === 'add' && settings && (
        <div className="bg-secondary p-4 rounded-xl border border-gray-800 animate-fade-in shadow-2xl">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
             <h3 className="font-bold text-white">Buy Coin Request</h3>
             <button onClick={() => setView('main')} className="text-gray-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white p-2 rounded-lg mb-2">
                <img src={settings.admin_qr_code_url} alt="Admin QR" className="w-40 h-40 object-contain" />
            </div>
            <p className="text-center text-xs text-gray-400">Scan to Pay Admin</p>
            <p className="text-center text-sm font-bold text-white mt-1 bg-gray-800 px-3 py-1 rounded select-all">{settings.admin_upi_id}</p>
          </div>
          <form onSubmit={handleDeposit} className="space-y-3">
            <input type="number" placeholder="Amount" className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white outline-none" value={depAmount} onChange={e => setDepAmount(e.target.value)} required/>
            <input type="text" placeholder="Transaction ID" className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white outline-none" value={depTxnId} onChange={e => setDepTxnId(e.target.value)} required/>
            <div className="space-y-1">
                <label className="text-xs text-gray-400">Payment Screenshot</label>
                <input type="file" accept="image/*" className="text-xs text-gray-400 w-full" onChange={(e) => handleFileChange(e, setDepProof)} required/>
                {depProof && <img src={depProof} alt="Preview" className="h-20 mt-2 rounded border border-gray-700" />}
            </div>
            <button className="w-full bg-accent text-black font-bold py-3 rounded-lg hover:bg-green-600">Submit</button>
          </form>
        </div>
      )}

      {/* MODAL: WITHDRAW */}
      {view === 'withdraw' && (
        <div className="bg-secondary p-4 rounded-xl border border-gray-800 animate-fade-in shadow-2xl">
           <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
             <h3 className="font-bold text-white">Withdraw Request</h3>
             <button onClick={() => setView('main')} className="text-gray-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <input type="number" placeholder="Withdraw Amount" className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white outline-none" value={wdAmount} onChange={e => setWdAmount(e.target.value)} required/>
            <div>
                <label className="text-xs text-gray-400 block mb-1">Your Receive QR</label>
                <input type="file" accept="image/*" className="text-xs text-gray-400 w-full" onChange={(e) => handleFileChange(e, setWdQr)} required/>
                {wdQr && <img src={wdQr} alt="Preview" className="h-20 mt-2 rounded border border-gray-700" />}
            </div>
            <button className="w-full bg-accent text-black font-bold py-3 rounded-lg hover:bg-green-600">Request</button>
          </form>
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex gap-4 border-b border-gray-700 mb-4">
            <button onClick={() => setActiveHistoryTab('txns')} className={`pb-2 text-sm font-bold ${activeHistoryTab === 'txns' ? 'text-accent border-b-2 border-accent' : 'text-gray-500'}`}>Transactions</button>
            <button onClick={() => setActiveHistoryTab('requests')} className={`pb-2 text-sm font-bold ${activeHistoryTab === 'requests' ? 'text-accent border-b-2 border-accent' : 'text-gray-500'}`}>Requests</button>
        </div>

        {activeHistoryTab === 'txns' ? (
             <div className="space-y-2">
                 <div className="flex gap-2 mb-2">
                     {(['all', 'credit', 'debit'] as const).map(f => (
                         <button key={f} onClick={() => setTxnFilter(f)} className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${txnFilter === f ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500'}`}>
                             {f}
                         </button>
                     ))}
                 </div>
                {filteredHistory.length === 0 ? <p className="text-gray-500 text-sm italic">No transactions.</p> : 
                filteredHistory.map(txn => (
                    <div key={txn.id} className="bg-secondary p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                    <div>
                        <p className="text-white text-sm font-medium">{txn.description}</p>
                        <p className="text-gray-500 text-[10px]">{new Date(txn.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`font-bold text-sm ${txn.type === 'credit' ? 'text-accent' : 'text-red-500'}`}>
                        {txn.type === 'credit' ? '+' : '-'} {txn.amount}
                    </span>
                    </div>
                ))}
            </div>
        ) : (
            <div className="space-y-2">
                {myRequests.length === 0 ? <p className="text-gray-500 text-sm italic">No requests.</p> :
                myRequests.map(req => (
                    <div key={req.id} className="bg-secondary p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                        <div>
                             <p className="text-white text-sm font-bold">{req.type} Request</p>
                             <p className="text-gray-400 text-xs">Amt: {req.amount}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                            req.status === 'Completed' ? 'bg-green-900 text-green-400' :
                            req.status === 'Rejected' ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'
                        }`}>
                            {req.status}
                        </span>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
