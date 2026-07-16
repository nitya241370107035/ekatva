import React, { useState } from 'react';
import { Notice } from '../types';
import { StatusBadge } from './StatusBadge';
import { Megaphone, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NoticeCardProps {
  notice: Notice;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice }) => {
  const { i18n, t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const formattedDate = notice.createdAt 
    ? new Date(notice.createdAt).toLocaleDateString(
        i18n.language === 'en' ? 'en-US' : i18n.language === 'bn' ? 'bn-IN' : 'hi-IN',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      )
    : '';

  const showToggleButton = notice.body.length > 120;
  const displayedBody = expanded ? notice.body : notice.body.substring(0, 120) + (showToggleButton ? '...' : '');

  return (
    <div className={`vintage-card p-5 border-l-4 transition-all ${
      notice.priority === 'urgent' ? 'border-l-red-500' : 'border-l-loom-gold'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Megaphone className={`w-5 h-5 shrink-0 ${notice.priority === 'urgent' ? 'text-red-500' : 'text-loom-gold'}`} />
          <h3 className="font-heading text-lg font-bold text-loom-wood">{notice.title}</h3>
        </div>
        <StatusBadge status={notice.priority} />
      </div>

      <div className="flex items-center gap-1 text-xs text-loom-ink-light font-body mb-3">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formattedDate}</span>
      </div>

      <p className="font-body text-base text-loom-ink whitespace-pre-wrap leading-relaxed">
        {displayedBody}
      </p>

      {showToggleButton && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 inline-flex items-center gap-1.5 font-heading font-bold text-sm text-loom-wood hover:text-loom-gold transition-all cursor-pointer"
        >
          {expanded ? (
            <>
              {t('common.showLess', 'कम दिखाएं (Show Less)')} <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              {t('common.readMore', 'और पढ़ें (Read More)')} <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
};
