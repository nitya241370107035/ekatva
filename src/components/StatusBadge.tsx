import React from 'react';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'resolved' | 'normal' | 'urgent' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  let text = '';
  let classes = 'px-3 py-1 text-xs font-bold font-body rounded-full border ';

  switch (status) {
    case 'open':
      text = t('status.open', 'खुली (Open)');
      classes += 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'urgent':
      text = t('status.urgent', 'आवश्यक (Urgent)');
      classes += 'bg-red-100 text-red-800 border-red-300 animate-pulse';
      break;
    case 'in_progress':
      text = t('status.in_progress', 'प्रगति पर (In Progress)');
      classes += 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'normal':
      text = t('status.normal', 'सामान्य (Normal)');
      classes += 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'resolved':
      text = t('status.resolved', 'हल (Resolved)');
      classes += 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    default:
      text = status;
      classes += 'bg-loom-sand/20 text-loom-wood border-loom-beige';
  }

  return <span className={classes}>{text}</span>;
};
