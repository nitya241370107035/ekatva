export type VoiceActionType = 
  | 'START_JOB'
  | 'COMPLETE_JOB'
  | 'CHECK_BALANCE'
  | 'LATEST_NOTICE'
  | 'ATTENDANCE'
  | 'UNKNOWN';

export interface VoiceAction {
  type: VoiceActionType;
  jobKeyword?: string;
  originalTranscript: string;
}

export function parseVoiceCommand(transcript: string, langCode?: string): VoiceAction {
  const normalized = transcript.toLowerCase().trim();
  
  // Detect language: parameter -> localStorage -> default to 'hi'
  let lang = langCode;
  if (!lang && typeof window !== 'undefined') {
    lang = window.localStorage.getItem('i18nextLng') || 'hi';
  }
  if (!lang) lang = 'hi';
  
  // Normalize language string (e.g. 'hi-IN' -> 'hi')
  lang = lang.split('-')[0];

  // Define keywords based on selected language
  let startKeywords: string[] = [];
  let completeKeywords: string[] = [];
  let balanceKeywords: string[] = [];
  let noticeKeywords: string[] = [];
  let attendanceKeywords: string[] = [];

  if (lang === 'bn') {
    startKeywords = [
      'কাজ শুরু',
      'বুনন শুরু',
      'জব শুরু',
      'শুরু করো',
      'শুরু কর',
      'shuru',
      'start job',
      'begin job'
    ];
    completeKeywords = [
      'কাজ শেষ',
      'কাজ সম্পন্ন',
      'জব শেষ',
      'শেষ করো',
      'শেষ কর',
      'শেষ হয়েছে',
      'shesh',
      'complete job',
      'finish job'
    ];
    balanceKeywords = [
      'উপার্জন',
      'টাকা',
      'কত টাকা',
      'ব্যালেন্স',
      'বকেয়া',
      'পেমেন্ট',
      'balance',
      'earnings',
      'payment',
      'taka'
    ];
    noticeKeywords = [
      'বিজ্ঞপ্তি',
      'নোটিশ',
      'খবর',
      'নোটিস',
      'notice',
      'latest notice',
      'announcement',
      'biggopti'
    ];
    attendanceKeywords = [
      'হাজিরা',
      'উপস্থিতি',
      'প্রেজেন্ট',
      'অ্যাটেনডেন্স',
      'attendance',
      'present',
      'hajira'
    ];
  } else if (lang === 'en') {
    startKeywords = [
      'start job',
      'begin job',
      'start work',
      'begin work',
      'start'
    ];
    completeKeywords = [
      'complete job',
      'finish job',
      'complete work',
      'finish work',
      'complete',
      'done'
    ];
    balanceKeywords = [
      'balance',
      'earnings',
      'payment',
      'check balance',
      'wages',
      'money'
    ];
    noticeKeywords = [
      'notice',
      'announcement',
      'news',
      'notices',
      'latest notice'
    ];
    attendanceKeywords = [
      'attendance',
      'present',
      'mark present',
      'mark attendance'
    ];
  } else {
    // Default: Hindi (hi)
    startKeywords = [
      'जॉब शुरू',
      'कार्य शुरू',
      'काम शुरू',
      'स्टार्ट जॉब',
      'शुरू करो',
      'शुरू कीजिए',
      'shuru',
      'start job',
      'begin job'
    ];
    completeKeywords = [
      'जॉब पूरा',
      'कार्य पूरा',
      'काम पूरा',
      'जॉब कंपलीट',
      'पूरा हुआ',
      'पूरा करो',
      'पूरा कीजिए',
      'poora',
      'complete job',
      'finish job'
    ];
    balanceKeywords = [
      'कमाई',
      'बैलेंस',
      'बकाया',
      'पैसे',
      'रुपये',
      'चेक बैलेंस',
      'balance',
      'earnings',
      'payment',
      'check balance'
    ];
    noticeKeywords = [
      'सूचना',
      'नोटिस',
      'खबर',
      'कल की सूचना',
      'आज की सूचना',
      'notice',
      'yesterday notice',
      'latest notice',
      'announcement'
    ];
    attendanceKeywords = [
      'हाजिरी',
      'हाज़िरी',
      'उपस्थिति',
      'अटेंडेंस',
      'प्रेजेंट',
      'attendance',
      'present'
    ];
  }

  // 1. START_JOB detection
  if (startKeywords.some(keyword => normalized.includes(keyword))) {
    let jobKeyword = '';
    let cleaned = normalized;
    startKeywords.forEach(k => {
      cleaned = cleaned.replace(k, '');
    });
    
    // Clean Hindi fillers & general fillers
    cleaned = cleaned
      .replace(/को/g, '')
      .replace(/का/g, '')
      .replace(/करो/g, '')
      .replace(/करें/g, '')
      .replace(/कीजिए/g, '')
      .replace(/कृप्या/g, '')
      .replace(/कृपया/g, '')
      .replace(/please/g, '')
      .replace(/job/g, '')
      .replace(/কাজ/g, '')
      .replace(/করুন/g, '')
      .trim();

    return {
      type: 'START_JOB',
      jobKeyword: cleaned || undefined,
      originalTranscript: transcript
    };
  }

  // 2. COMPLETE_JOB detection
  if (completeKeywords.some(keyword => normalized.includes(keyword))) {
    return {
      type: 'COMPLETE_JOB',
      originalTranscript: transcript
    };
  }

  // 3. CHECK_BALANCE detection
  if (balanceKeywords.some(keyword => normalized.includes(keyword))) {
    return {
      type: 'CHECK_BALANCE',
      originalTranscript: transcript
    };
  }

  // 4. LATEST_NOTICE detection
  if (noticeKeywords.some(keyword => normalized.includes(keyword))) {
    return {
      type: 'LATEST_NOTICE',
      originalTranscript: transcript
    };
  }

  // 5. ATTENDANCE detection
  if (attendanceKeywords.some(keyword => normalized.includes(keyword))) {
    return {
      type: 'ATTENDANCE',
      originalTranscript: transcript
    };
  }

  return {
    type: 'UNKNOWN',
    originalTranscript: transcript
  };
}
