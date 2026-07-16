import React, { useEffect, useRef } from 'react';
import { GrievanceMessage } from '../types';
import { User, MessageSquare } from 'lucide-react';

interface GrievanceMessageThreadProps {
  messages: GrievanceMessage[];
  currentUserId: string;
}

export const GrievanceMessageThread: React.FC<GrievanceMessageThreadProps> = ({ messages, currentUserId }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + 
           date.toLocaleDateString('hi-IN', { month: 'short', day: 'numeric' });
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-loom-ink-light bg-loom-cream/40 rounded-xl border border-dashed border-loom-beige/40">
        <MessageSquare className="w-10 h-10 text-loom-gold/60 mb-2" />
        <p className="font-heading font-semibold text-base">कोई संदेश नहीं है।</p>
        <p className="font-body text-sm">बातचीत शुरू करने के लिए नीचे संदेश भेजें।</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[450px] overflow-y-auto p-4 rounded-xl bg-loom-cream/20 border border-loom-beige/30">
      {messages.map((msg) => {
        const isSelf = msg.senderId === currentUserId;
        
        return (
          <div
            key={msg.messageId}
            className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
          >
            {/* Sender tag */}
            <span className="text-xs text-loom-ink-light font-body mb-1 px-1 flex items-center gap-1">
              <User className="w-3 h-3" />
              {msg.senderName} ({msg.senderRole === 'secretary' ? 'सचिव' : 'बुनकर'})
            </span>

            {/* Bubble */}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm font-body text-base leading-relaxed ${
                isSelf
                  ? 'bg-loom-wood text-white rounded-tr-none'
                  : 'bg-amber-100/60 text-loom-ink rounded-tl-none border border-loom-beige'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              <div className={`text-[10px] mt-1.5 text-right ${isSelf ? 'text-white/70' : 'text-loom-ink-light'}`}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
