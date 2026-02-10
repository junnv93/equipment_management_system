'use client';

import { useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle,
  AlertCircle,
  Settings,
  Box,
  Clock,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

// 알림 유형별 아이콘 컴포넌트 매핑
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'calibration_due':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'calibration_completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rental_request':
      return <Box className="h-4 w-4 text-orange-500" />;
    case 'rental_approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rental_rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'rental_completed':
      return <Box className="h-4 w-4 text-blue-500" />;
    case 'return_requested':
      return <ArrowLeft className="h-4 w-4 text-purple-500" />;
    case 'return_approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'return_rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'equipment_maintenance':
      return <Settings className="h-4 w-4 text-gray-500" />;
    case 'checkout':
      return <Clock className="h-4 w-4 text-teal-500" />;
    case 'maintenance':
      return <Settings className="h-4 w-4 text-gray-500" />;
    case 'system':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-slate-500" />;
  }
};

// 알림 유형별 배경색 스타일 매핑
const getNotificationStyle = (type: string, isRead: boolean) => {
  const baseStyle = isRead ? 'opacity-60 bg-slate-50' : 'bg-white';

  switch (type) {
    case 'calibration_due':
      return `${baseStyle} border-l-4 border-l-blue-500`;
    case 'calibration_completed':
      return `${baseStyle} border-l-4 border-l-green-500`;
    case 'rental_request':
      return `${baseStyle} border-l-4 border-l-orange-500`;
    case 'rental_approved':
      return `${baseStyle} border-l-4 border-l-green-500`;
    case 'rental_rejected':
      return `${baseStyle} border-l-4 border-l-red-500`;
    case 'rental_completed':
      return `${baseStyle} border-l-4 border-l-blue-500`;
    case 'return_requested':
      return `${baseStyle} border-l-4 border-l-purple-500`;
    case 'return_approved':
      return `${baseStyle} border-l-4 border-l-green-500`;
    case 'return_rejected':
      return `${baseStyle} border-l-4 border-l-red-500`;
    case 'equipment_maintenance':
      return `${baseStyle} border-l-4 border-l-gray-500`;
    case 'checkout':
      return `${baseStyle} border-l-4 border-l-teal-500`;
    case 'maintenance':
      return `${baseStyle} border-l-4 border-l-gray-500`;
    case 'system':
      return `${baseStyle} border-l-4 border-l-red-500`;
    default:
      return `${baseStyle} border-l-4 border-l-slate-500`;
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.isRead);
  const icon = getNotificationIcon(notification.type);
  const style = getNotificationStyle(notification.type, isRead);

  const formattedDate = formatRelativeTime(notification.createdAt);

  const fullDate = formatDate(notification.createdAt, 'yyyy년 MM월 dd일 HH:mm');

  const handleClick = () => {
    if (!isRead) {
      setIsRead(true);
      onMarkAsRead(notification.id);
    }

    if (notification.linkUrl) {
      window.location.href = notification.linkUrl;
    }
  };

  return (
    <div
      className={`p-4 mb-2 rounded shadow-sm cursor-pointer relative ${style}`}
      onClick={handleClick}
      title={fullDate}
    >
      {!isRead && <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-600" />}
      <div className="flex items-start">
        <div className="mr-3 mt-1">{icon}</div>
        <div className="flex-1">
          <div className="font-medium text-sm">{notification.title}</div>
          <div className="text-sm text-gray-600 mt-1">{notification.content}</div>
          <div className="text-xs text-gray-400 mt-2">{formattedDate}</div>
        </div>
      </div>
    </div>
  );
}
