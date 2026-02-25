export enum View {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  CALENDAR = 'CALENDAR',
  CREATE_POST = 'CREATE_POST',
  MEDIA_LIBRARY = 'MEDIA_LIBRARY',
  INBOX = 'INBOX',
  SETTINGS = 'SETTINGS'
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

// Report Analytics Types
export interface ReportView {
  id: string;
  reportId: string;
  reportName: string;
  viewedBy: string;
  viewedAt: Date;
  duration: number;
  device: 'desktop' | 'mobile' | 'tablet';
}

export interface ReportDownload {
  id: string;
  reportId: string;
  reportName: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  downloadedBy: string;
  downloadedAt: Date;
  fileSize: number;
}

export interface MetricPopularity {
  metricName: string;
  viewCount: number;
  includeCount: number;
  avgValue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  lastUsed: Date;
  avgGenerationTime: number;
  metrics: string[];
  category: 'performance' | 'engagement' | 'financial' | 'custom';
}

export interface ReportEngagement {
  reportId: string;
  reportName: string;
  totalViews: number;
  uniqueViewers: number;
  totalDownloads: number;
  avgViewDuration: number;
  shareCount: number;
  commentCount: number;
  lastActivity: Date;
}

export interface UsageInsight {
  type: 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: Date;
  data?: Record<string, any>;
}
