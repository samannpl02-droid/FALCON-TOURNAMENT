
import { 
  User, 
  Tournament, 
  Transaction, 
  DepositRequest, 
  WithdrawalRequest, 
  AppSettings,
  TransactionType,
  RequestStatus,
  TournamentStatus
} from '../types';

const STORAGE_KEYS = {
  USERS: 'tourna_np_users',
  TOURNAMENTS: 'tourna_np_tournaments',
  TRANSACTIONS: 'tourna_np_transactions',
  DEPOSITS: 'tourna_np_deposits',
  WITHDRAWALS: 'tourna_np_withdrawals',
  SETTINGS: 'tourna_np_settings',
  CURRENT_USER_ID: 'tourna_np_current_user_id'
};

// Initial Data Seeding
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const adminUser: User = {
      id: 1000000,
      username: 'daddyji',
      email: 'admin@tournanp.com',
      password: 'daddyjii', 
      wallet_balance: 999999,
      phone: '9800000000',
      created_at: new Date().toISOString(),
      isAdmin: true
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([adminUser]));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    const defaultSettings: AppSettings = {
      app_name: 'Tourna NP',
      support_email: 'support@tournanp.com',
      admin_upi_id: 'tournaadmin@esewa',
      admin_qr_code_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
      app_logo_url: '', 
      banner_ads: [
        'https://picsum.photos/seed/ad1/800/400',
        'https://picsum.photos/seed/ad2/800/400',
        'https://picsum.photos/seed/ad3/800/400'
      ],
      socials: {
        facebook: '',
        youtube: '',
        tiktok: '',
        instagram: ''
      }
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
};

seedData();

// Helpers
const getList = <T>(key: string): T[] => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : [];
};
const saveList = (key: string, list: any[]) => localStorage.setItem(key, JSON.stringify(list));

export const db = {
  // --- USER AUTH ---
  login: (credential: string, password: string): User | null => {
    const users = getList<User>(STORAGE_KEYS.USERS);
    // Login with username OR phone
    const user = users.find(u => (u.username === credential || u.phone === credential) && u.password === password);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id.toString());
      return user;
    }
    return null;
  },

  register: (username: string, email: string, password: string, phone: string): User | string => {
    const users = getList<User>(STORAGE_KEYS.USERS);
    
    // Validation
    if (phone.length !== 10 || isNaN(Number(phone))) return "Phone number must be exactly 10 digits";
    if (users.find(u => u.username === username)) return "Username taken";
    if (users.find(u => u.phone === phone)) return "Phone number already registered";

    const newUser: User = {
      id: 1000000 + users.length + 1,
      username,
      email,
      password,
      wallet_balance: 0,
      phone,
      created_at: new Date().toISOString(),
      isAdmin: false
    };
    users.push(newUser);
    saveList(STORAGE_KEYS.USERS, users);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id.toString());
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  },

  getCurrentUser: (): User | null => {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!id) return null;
    const users = getList<User>(STORAGE_KEYS.USERS);
    return users.find(u => u.id === parseInt(id)) || null;
  },

  updateProfile: (userId: number, updates: Partial<User>) => {
    const users = getList<User>(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      // Prevent username duplication if changing username
      if (updates.username && updates.username !== users[idx].username) {
          if(users.find(u => u.username === updates.username)) return null; // Taken
      }
      users[idx] = { ...users[idx], ...updates };
      saveList(STORAGE_KEYS.USERS, users);
      return users[idx];
    }
    return null;
  },

  // --- ADMIN USER MANAGEMENT ---
  getAllUsers: (): User[] => {
    return getList<User>(STORAGE_KEYS.USERS).filter(u => !u.isAdmin);
  },

  // FIXED: Explicit number conversion and filtering
  deleteUser: (userId: number) => {
    let users = getList<User>(STORAGE_KEYS.USERS);
    users = users.filter(u => u.id !== Number(userId));
    saveList(STORAGE_KEYS.USERS, users);
  },

  adminAddCoins: (userId: number, amount: number) => {
    const users = getList<User>(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].wallet_balance += amount;
      saveList(STORAGE_KEYS.USERS, users);

      const txns = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
      txns.push({
        id: Date.now(),
        user_id: userId,
        amount: amount,
        type: TransactionType.CREDIT,
        description: 'Admin Airdrop / Bonus',
        created_at: new Date().toISOString()
      });
      saveList(STORAGE_KEYS.TRANSACTIONS, txns);
      return true;
    }
    return false;
  },

  // --- TOURNAMENTS ---
  getTournaments: (): Tournament[] => getList<Tournament>(STORAGE_KEYS.TOURNAMENTS),
  
  createTournament: (data: Omit<Tournament, 'id' | 'created_at' | 'participants' | 'status'>) => {
    const list = getList<Tournament>(STORAGE_KEYS.TOURNAMENTS);
    const newItem: Tournament = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      participants: [],
      status: TournamentStatus.OPEN
    };
    list.unshift(newItem); // Newest first
    saveList(STORAGE_KEYS.TOURNAMENTS, list);
    return newItem;
  },

  joinTournament: (userId: number, tournamentId: number): { success: boolean, message: string } => {
    const users = getList<User>(STORAGE_KEYS.USERS);
    const tournaments = getList<Tournament>(STORAGE_KEYS.TOURNAMENTS);
    
    // Strict number casting to ensure ID matching works regardless of storage format
    const uId = Number(userId);
    const tId = Number(tournamentId);

    const userIdx = users.findIndex(u => u.id === uId);
    const tourIdx = tournaments.findIndex(t => t.id === tId);

    if (userIdx === -1 || tourIdx === -1) return { success: false, message: 'Data error: User or Tournament not found' };
    
    const user = users[userIdx];
    const tour = tournaments[tourIdx];

    if (tour.participants.includes(uId)) return { success: false, message: 'Already joined' };
    if (user.wallet_balance < tour.entry_fee) return { success: false, message: 'Insufficient balance' };
    if (tour.status !== TournamentStatus.OPEN) return { success: false, message: 'Tournament closed' };

    // Deduct Balance
    user.wallet_balance -= tour.entry_fee;
    
    // Add to Participants
    tour.participants.push(uId);

    // Record Transaction
    const transactions = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    transactions.push({
      id: Date.now(),
      user_id: uId,
      amount: tour.entry_fee,
      type: TransactionType.DEBIT,
      description: `Joined: ${tour.title}`,
      created_at: new Date().toISOString()
    });

    saveList(STORAGE_KEYS.USERS, users);
    saveList(STORAGE_KEYS.TOURNAMENTS, tournaments);
    saveList(STORAGE_KEYS.TRANSACTIONS, transactions);

    return { success: true, message: 'Joined successfully' };
  },

  updateTournament: (id: number, updates: Partial<Tournament>) => {
    const list = getList<Tournament>(STORAGE_KEYS.TOURNAMENTS);
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveList(STORAGE_KEYS.TOURNAMENTS, list);
    }
  },

  // FIXED: Explicit number conversion and filtering
  deleteTournament: (id: number) => {
    let list = getList<Tournament>(STORAGE_KEYS.TOURNAMENTS);
    list = list.filter(t => t.id !== Number(id));
    saveList(STORAGE_KEYS.TOURNAMENTS, list);
  },

  // ENHANCED: Check if user exists and add congratulatory message
  declareWinner: (tournamentId: number, winnerUserId: number) => {
    const tournaments = getList<Tournament>(STORAGE_KEYS.TOURNAMENTS);
    const users = getList<User>(STORAGE_KEYS.USERS);
    
    const tourIdx = tournaments.findIndex(t => t.id === tournamentId);
    const userIdx = users.findIndex(u => u.id === winnerUserId);

    if (tourIdx === -1 || userIdx === -1) return { success: false, message: "User or Tournament not found" };

    const tour = tournaments[tourIdx];
    const user = users[userIdx];

    if (tour.status === TournamentStatus.COMPLETED) return { success: false, message: "Tournament already completed" };

    tour.status = TournamentStatus.COMPLETED;
    tour.winner_id = winnerUserId;
    user.wallet_balance += tour.prize_pool;

    const transactions = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    transactions.push({
      id: Date.now(),
      user_id: winnerUserId,
      amount: tour.prize_pool,
      type: TransactionType.CREDIT,
      description: `🎉 Congrats! Won ${tour.title}`, // Celebratory Message
      created_at: new Date().toISOString()
    });

    saveList(STORAGE_KEYS.TOURNAMENTS, tournaments);
    saveList(STORAGE_KEYS.USERS, users);
    saveList(STORAGE_KEYS.TRANSACTIONS, transactions);
    return { success: true, message: "Winner Declared Successfully" };
  },

  // --- WALLET ---
  getTransactions: (userId: number) => {
    const list = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    return list.filter(t => t.user_id === userId).reverse();
  },

  requestDeposit: (userId: number, amount: number, txnId: string, screenshotUrl?: string) => {
    const list = getList<DepositRequest>(STORAGE_KEYS.DEPOSITS);
    list.push({
      id: Date.now(),
      user_id: userId,
      amount,
      transaction_id: txnId,
      screenshot_url: screenshotUrl,
      status: RequestStatus.PENDING,
      created_at: new Date().toISOString()
    });
    saveList(STORAGE_KEYS.DEPOSITS, list);
  },

  requestWithdrawal: (userId: number, amount: number, qrCodeUrl?: string) => {
    const users = getList<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === userId);
    if (!user || user.wallet_balance < amount) return false;

    // Deduct immediately, refund if rejected
    user.wallet_balance -= amount;
    saveList(STORAGE_KEYS.USERS, users);

    const list = getList<WithdrawalRequest>(STORAGE_KEYS.WITHDRAWALS);
    list.push({
      id: Date.now(),
      user_id: userId,
      amount,
      qr_code_url: qrCodeUrl,
      status: RequestStatus.PENDING,
      created_at: new Date().toISOString()
    });
    saveList(STORAGE_KEYS.WITHDRAWALS, list);

    const txns = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    txns.push({
        id: Date.now(),
        user_id: userId,
        amount: amount,
        type: TransactionType.DEBIT,
        description: 'Withdrawal Request',
        created_at: new Date().toISOString()
    });
    saveList(STORAGE_KEYS.TRANSACTIONS, txns);

    return true;
  },

  // --- ADMIN WALLET ACTIONS ---
  getDepositRequests: () => getList<DepositRequest>(STORAGE_KEYS.DEPOSITS).reverse(),
  getWithdrawalRequests: () => getList<WithdrawalRequest>(STORAGE_KEYS.WITHDRAWALS).reverse(),

  processDeposit: (reqId: number, approved: boolean) => {
    const deposits = getList<DepositRequest>(STORAGE_KEYS.DEPOSITS);
    const idx = deposits.findIndex(d => d.id === reqId);
    if (idx === -1) return;

    const req = deposits[idx];
    if (req.status !== RequestStatus.PENDING) return;

    req.status = approved ? RequestStatus.COMPLETED : RequestStatus.REJECTED;
    deposits[idx] = req;
    saveList(STORAGE_KEYS.DEPOSITS, deposits);

    if (approved) {
      const users = getList<User>(STORAGE_KEYS.USERS);
      const userIdx = users.findIndex(u => u.id === req.user_id);
      if (userIdx !== -1) {
        users[userIdx].wallet_balance += req.amount;
        saveList(STORAGE_KEYS.USERS, users);

        const txns = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        txns.push({
          id: Date.now(),
          user_id: req.user_id,
          amount: req.amount,
          type: TransactionType.CREDIT,
          description: `Deposit Approved`,
          created_at: new Date().toISOString()
        });
        saveList(STORAGE_KEYS.TRANSACTIONS, txns);
      }
    }
  },

  processWithdrawal: (reqId: number, approved: boolean) => {
    const withdrawals = getList<WithdrawalRequest>(STORAGE_KEYS.WITHDRAWALS);
    const idx = withdrawals.findIndex(w => w.id === reqId);
    if (idx === -1) return;

    const req = withdrawals[idx];
    if (req.status !== RequestStatus.PENDING) return;

    req.status = approved ? RequestStatus.COMPLETED : RequestStatus.REJECTED;
    withdrawals[idx] = req;
    saveList(STORAGE_KEYS.WITHDRAWALS, withdrawals);

    if (!approved) {
      // Refund
      const users = getList<User>(STORAGE_KEYS.USERS);
      const userIdx = users.findIndex(u => u.id === req.user_id);
      if (userIdx !== -1) {
        users[userIdx].wallet_balance += req.amount;
        saveList(STORAGE_KEYS.USERS, users);

        const txns = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        txns.push({
          id: Date.now(),
          user_id: req.user_id,
          amount: req.amount,
          type: TransactionType.CREDIT,
          description: `Withdrawal Refund`,
          created_at: new Date().toISOString()
        });
        saveList(STORAGE_KEYS.TRANSACTIONS, txns);
      }
    }
  },

  // --- SETTINGS ---
  getSettings: (): AppSettings => {
    const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const defaults: AppSettings = { 
        app_name: 'Tourna NP',
        support_email: 'support@tournanp.com',
        admin_upi_id: '', 
        admin_qr_code_url: '', 
        app_logo_url: '', 
        banner_ads: [],
        socials: { facebook: '', youtube: '', tiktok: '', instagram: '' }
    };
    if (s) {
        const parsed = JSON.parse(s);
        // Merge allows adding new keys to existing data
        return { ...defaults, ...parsed, socials: { ...defaults.socials, ...parsed.socials } };
    }
    return defaults;
  },
  updateSettings: (s: AppSettings) => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s)),
};
