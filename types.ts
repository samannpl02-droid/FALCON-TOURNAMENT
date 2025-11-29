
export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

export enum RequestStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected'
}

export enum TournamentStatus {
  OPEN = 'Open',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  wallet_balance: number;
  phone: string;
  avatar_url?: string; // Custom User Logo
  created_at: string;
  isAdmin: boolean;
}

export interface Tournament {
  id: number;
  title: string;
  game_name: string;
  entry_fee: number;
  prize_pool: number;
  match_time: string;
  room_id?: string;
  room_password?: string;
  status: TournamentStatus;
  created_at: string;
  participants: number[]; // User IDs
  winner_id?: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: TransactionType;
  description: string;
  created_at: string;
}

export interface DepositRequest {
  id: number;
  user_id: number;
  amount: number;
  transaction_id: string; 
  screenshot_url?: string; // Base64 proof
  status: RequestStatus;
  created_at: string;
}

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount: number;
  qr_code_url?: string; // Base64 User's QR to receive money
  status: RequestStatus;
  created_at: string;
}

export interface AppSettings {
  app_name: string; // Dynamic App Name
  support_email: string; // Support Contact
  admin_upi_id: string;
  admin_qr_code_url: string;
  app_logo_url: string; // Custom App Logo
  banner_ads: string[]; // Array of image URLs for carousel
  socials: {
    facebook: string;
    youtube: string;
    tiktok: string;
    instagram: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
