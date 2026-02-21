export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  accountNumber: string;
  bank: string;
  monthlyPay: number;
  status: 'Active' | 'On Leave' | 'Suspended';
  avatarInitials: string;
}

export interface Transaction {
  id: string;
  type: 'Credit' | 'Debit' | 'Payroll' | 'Withdrawal';
  description: string;
  amount: number;
  recipientOrSender: string;
  channel: 'Bank Transfer' | 'Card' | 'USSD' | 'Wallet';
  status: 'Successful' | 'Pending' | 'Failed';
  date: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'LIVE' | 'OFFLINE';
  thumbnail?: string; // In a real app, this would be a snapshot URL
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  read: boolean;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  status: 'Online' | 'Offline' | 'Busy';
  lastMessage?: string;
  unreadCount?: number;
}

export type ScreenView =
'dashboard' |
'staff' |
'transactions' |
'cctv' |
'comms' |
'settings';
export type MobileTab = 'home' | 'staff' | 'transactions' | 'cctv' | 'more';