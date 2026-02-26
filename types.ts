export enum View {
  DASHBOARD = "DASHBOARD",
  ANALYTICS = "ANALYTICS",
  CALENDAR = "CALENDAR",
  CREATE_POST = "CREATE_POST",
  MEDIA_LIBRARY = "MEDIA_LIBRARY",
  INBOX = "INBOX",
  REWARDS = "REWARDS",
  SETTINGS = "SETTINGS",
  BLOCKCHAIN_MONITOR = "BLOCKCHAIN_MONITOR",
  PORTFOLIO = "PORTFOLIO",
  TRANSACTION_HISTORY = "TRANSACTION_HISTORY",
  ACCOUNT_PERFORMANCE = "ACCOUNT_PERFORMANCE",
  REWARDS_CONFIG = "REWARDS_CONFIG",
}

export interface NavItem {
  id: View;
  label: string;
  icon: any;
}

export interface ViewProps {
  onNavigate: (view: View) => void;
}
51

export interface MonetizationSettings {
  enableTips: boolean;
  payPerView: boolean;
  subscriptionOnly: boolean;
  tipAmount?: number;
  accessPrice?: number;
  selectedToken?: string;
  ipfsMetadataHash?: string;
  accessControlContract?: string;
}

export interface Post {
  id: string;
  platform: "instagram" | "tiktok" | "facebook" | "youtube" | "linkedin" | "x";
  content: string;
  image?: string;
  date: Date;
  status: "scheduled" | "published" | "draft";
  stats?: {
    likes: number;
    views: number;
  };
  monetization?: MonetizationSettings;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  platform: "instagram" | "facebook" | "x";
  user: string;
  avatar: string;
  lastMessage: string;
  unread: boolean;
  status: "new" | "pending" | "resolved";
  messages: Message[];
}

export enum Platform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  YOUTUBE = 'youtube',
  LINKEDIN = 'linkedin',
  X = 'x'
}

export enum TransactionType {
  POST = 'post',
  SCHEDULE = 'schedule',
  UPDATE = 'update',
  DELETE = 'delete',
  REPLY = 'reply'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  platform: Platform;
  title: string;
  description?: string;
  scheduledTime?: Date;
  relatedTransactions?: string[];
  createdAt: Date;
  data?: any;
}
