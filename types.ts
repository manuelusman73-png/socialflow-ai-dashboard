export enum View {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  CALENDAR = 'CALENDAR',
  CREATE_POST = 'CREATE_POST',
  MEDIA_LIBRARY = 'MEDIA_LIBRARY',
  INBOX = 'INBOX',
  SETTINGS = 'SETTINGS',
  EXECUTIVE_REPORTING = 'EXECUTIVE_REPORTING'
}

export interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
}

export interface ViewProps {
  onNavigate: (view: View) => void;
}

export interface Post {
  id: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'linkedin' | 'x';
  content: string;
  image?: string;
  date: Date;
  status: 'scheduled' | 'published' | 'draft';
  stats?: {
    likes: number;
    views: number;
  };
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
  platform: 'instagram' | 'facebook' | 'x';
  user: string;
  avatar: string;
  lastMessage: string;
  unread: boolean;
  status: 'new' | 'pending' | 'resolved';
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

// Reporting Types
export enum ReportFormat {
  PDF = 'pdf',
  POWERPOINT = 'pptx',
  CSV = 'csv',
  EXCEL = 'xlsx'
}

export enum ReportSchedule {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELIVERED = 'delivered'
}

export interface ReportRecipient {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export interface ReportDistributionList {
  id: string;
  name: string;
  recipients: ReportRecipient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  format: ReportFormat;
  schedule: ReportSchedule;
  scheduleTime?: string; // HH:mm format
  scheduleDayOfWeek?: number; // 0-6 for weekly
  scheduleDayOfMonth?: number; // 1-31 for monthly
  distributionLists: string[]; // IDs of distribution lists
  includeMetrics: string[];
  dateRange: 'last7days' | 'last30days' | 'lastMonth' | 'custom';
  customDateRange?: { start: Date; end: Date };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

export interface ReportDelivery {
  id: string;
  reportConfigId: string;
  reportName: string;
  format: ReportFormat;
  status: ReportStatus;
  recipients: string[]; // email addresses
  generatedAt: Date;
  deliveredAt?: Date;
  error?: string;
  fileUrl?: string;
  fileSize?: number;
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  dateRange: { start: Date; end: Date };
  metrics: {
    totalPosts: number;
    totalEngagement: number;
    totalReach: number;
    totalImpressions: number;
    engagementRate: number;
    topPlatform: Platform;
    topPost?: Post;
  };
  platformBreakdown: Array<{
    platform: Platform;
    posts: number;
    engagement: number;
    reach: number;
  }>;
  performanceTrends: Array<{
    date: string;
    engagement: number;
    reach: number;
    posts: number;
  }>;
}