import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { parseVoiceCommand } from '../utils/commandParser';
import { useTranslation } from 'react-i18next';
import { 
  getJobCardsByWeaver, 
  updateJobCardStatus, 
  getPaymentsByWeaver, 
  getNoticesByCooperative, 
  markWeaverAttendance,
  getWeaverAttendanceToday
} from '../firebase/firestore';
import { 
  Mic, 
  MicOff, 
  X, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export const JobSakhi: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const { 
    transcript, 
    isListening, 
    error: voiceError, 
    startListening, 
    stopListening, 
    speak, 
    browserSupported 
  } = useVoiceAssistant();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [sakhiTranscript, setSakhiTranscript] = useState<string>('');
  const [attendanceToday, setAttendanceToday] = useState(false);

  // Close peeking trigger when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#job-sakhi-trigger')) return;
      setIsExpanded(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isExpanded]);

  // Check attendance on mount/open
  useEffect(() => {
    if (currentUser?.uid && isOpen) {
      getWeaverAttendanceToday(currentUser.uid).then(setAttendanceToday).catch(console.error);
    }
  }, [currentUser, isOpen]);

  if (!browserSupported) {
    return (
      <div id="job-sakhi-unsupported" className="fixed bottom-6 right-6 z-40 bg-rose-50 border border-rose-200 p-3 rounded-xl shadow-lg max-w-xs text-xs text-rose-700 font-semibold">
        आवाज़ सहायता अनुपलब्ध (Browser voice not supported)
      </div>
    );
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setResultMsg(null);
      setSakhiTranscript('');
      setIsOpen(true);
      // Speak initial prompt
      speak("नमस्ते जी! मैं आपकी जॉब सखी हूँ। आप अपनी हाज़िरी, कमाई, नया नोटिस या जॉब कार्ड शुरू करने और पूरा करने के लिए बोल सकते हैं। बोलिए, मैं सुन रही हूँ।");
      
      // Delay listening slightly to avoid picking up the Sakhi's own voice
      setTimeout(() => {
        startListening(processCommand);
      }, 1000);
    }
  };

  const processCommand = async (recognizedText: string) => {
    if (!recognizedText.trim()) return;
    setSakhiTranscript(recognizedText);
    setProcessing(true);
    setResultMsg(null);

    const weaverId = currentUser?.uid;
    const cooperativeId = userProfile?.cooperativeId;

    if (!weaverId || !cooperativeId) {
      const err = i18n.language.startsWith('bn') 
        ? "যাচাইকরণ ত্রুটি: অনুগ্রহ করে আবার লগইন করুন।" 
        : i18n.language.startsWith('en') 
        ? "Authentication error: please login again." 
        : "सत्यापन त्रुटि: कृपया पुनः लॉगिन करें।";
      setResultMsg(err);
      speak(err);
      setProcessing(false);
      return;
    }

    const command = parseVoiceCommand(recognizedText, i18n.language);
    const isBn = i18n.language.startsWith('bn');
    const isEn = i18n.language.startsWith('en');

    try {
      switch (command.type) {
        case 'START_JOB': {
          const jobs = await getJobCardsByWeaver(weaverId);
          const assignedJobs = jobs.filter(j => j.status === 'assigned');

          if (assignedJobs.length === 0) {
            const reply = isBn 
              ? "তাঁতি ভাই, আপনার জন্য বর্তমানে কোনো নতুন কাজ বরাদ্দ নেই।" 
              : isEn 
              ? "Weaver brother, there are no jobs currently assigned to you." 
              : "बुनकर भाई, आपके लिए वर्तमान में कोई नया जॉब आवंटित नहीं है।";
            setResultMsg(reply);
            speak(reply);
            toast.error(reply);
            break;
          }

          // Pick the best match or default to latest
          let targetJob = assignedJobs[0];
          if (command.jobKeyword) {
            const kw = command.jobKeyword.toLowerCase();
            const matched = assignedJobs.find(j => 
              j.title.toLowerCase().includes(kw) || 
              j.designCode.toLowerCase().includes(kw)
            );
            if (matched) {
              targetJob = matched;
            }
          }

          await updateJobCardStatus(targetJob.jobCardId, 'in_progress', 'Started via Job Sakhi voice command');
          const reply = isBn 
            ? `চমৎকার! আপনার ${targetJob.title} এর কাজ শুরু করা হয়েছে। ভালোভাবে বুনন করুন!` 
            : isEn 
            ? `Great! Your job for ${targetJob.title} has started. Happy weaving!` 
            : `बहुत बढ़िया! आपका ${targetJob.title} का कार्य शुरू हो गया है। अच्छी बुनाई करें!`;
          setResultMsg(reply);
          speak(reply);
          toast.success(reply);
          break;
        }

        case 'COMPLETE_JOB': {
          const jobs = await getJobCardsByWeaver(weaverId);
          const activeJobs = jobs.filter(j => j.status === 'in_progress');

          if (activeJobs.length === 0) {
            const reply = isBn 
              ? "তাঁতি ভাই, বর্তমানে আপনার কোনো কাজ চলছে না যা সম্পূর্ণ করা যেতে পারে।" 
              : isEn 
              ? "Weaver brother, you have no job in progress to complete." 
              : "बुनकर भाई, आपका कोई भी जॉब वर्तमान में प्रगति पर नहीं है जिसे पूरा किया जा सके।";
            setResultMsg(reply);
            speak(reply);
            toast.error(reply);
            break;
          }

          const targetJob = activeJobs[0];
          await updateJobCardStatus(targetJob.jobCardId, 'completed', 'Completed via Job Sakhi voice command');
          const reply = isBn 
            ? `অসাধারণ! আপনার ${targetJob.title} এর কাজ সম্পন্ন হয়েছে। সেক্রেটারি শীঘ্রই এটি পরীক্ষা করবেন।` 
            : isEn 
            ? `Wonderful! Your work for ${targetJob.title} has been marked complete. The secretary will inspect it soon.` 
            : `अति सुंदर! आपका ${targetJob.title} का कार्य पूरा चिह्नित कर दिया गया है। सचिव महोदय जल्द ही इसका निरीक्षण करेंगे।`;
          setResultMsg(reply);
          speak(reply);
          toast.success(reply);
          break;
        }

        case 'CHECK_BALANCE': {
          const payments = await getPaymentsByWeaver(weaverId);
          const wages = payments.filter(p => p.type === 'wage').reduce((sum, p) => sum + p.amount, 0);
          const advances = payments.filter(p => p.type === 'advance').reduce((sum, p) => sum + p.amount, 0);
          const deductions = payments.filter(p => p.type === 'deduction').reduce((sum, p) => sum + p.amount, 0);
          const balance = wages - advances - deductions;

          const reply = isBn 
            ? `তাঁতি ভাই, আপনার মোট বকেয়া টাকা হলো ${balance} টাকা।` 
            : isEn 
            ? `Weaver brother, your total pending balance is ${balance} Rupees.` 
            : `बुनकर भाई, आपकी कुल बकाया राशि ${balance} रुपये है।`;
          setResultMsg(reply);
          speak(reply);
          toast.success(isBn ? `বকেয়া টাকা: ₹${balance}` : isEn ? `Pending balance: ₹${balance}` : `बकाया राशि: ₹${balance}`);
          break;
        }

        case 'LATEST_NOTICE': {
          const notices = await getNoticesByCooperative(cooperativeId);
          if (notices.length === 0) {
            const reply = isBn 
              ? "সমিতি দ্বারা সম্প্রতি কোনো বিজ্ঞপ্তি প্রকাশ করা হয়নি।" 
              : isEn 
              ? "No notices have been published by the cooperative recently." 
              : "सहकारी समिति द्वारा हाल ही में कोई सूचना जारी नहीं की गई है।";
            setResultMsg(reply);
            speak(reply);
            break;
          }

          const latest = notices[0];
          const reply = isBn 
            ? `নতুন বিজ্ঞপ্তি হলো: ${latest.title}। বিবরণ: ${latest.body}` 
            : isEn 
            ? `The latest notice is: ${latest.title}. Details: ${latest.body}` 
            : `नवीनतम सूचना है: ${latest.title}। विवरण: ${latest.body}`;
          setResultMsg(reply);
          speak(isBn ? `নতুন বিজ্ঞপ্তি হলো: ${latest.title}।` : isEn ? `Latest notice is: ${latest.title}.` : `नवीनतम सूचना है: ${latest.title}।`);
          toast.info(isBn ? `বিজ্ঞপ্তি: ${latest.title}` : isEn ? `Notice: ${latest.title}` : `सूचना: ${latest.title}`);
          break;
        }

        case 'ATTENDANCE': {
          const checkToday = await getWeaverAttendanceToday(weaverId);
          if (checkToday) {
            const reply = isBn 
              ? "তাঁতি ভাই, আপনার আজকের হাজিরা ইতিমধ্যেই নথিভুক্ত করা হয়েছে। ধন্যবাদ!" 
              : isEn 
              ? "Weaver brother, your attendance for today is already marked. Thank you!" 
              : "बुनकर भाई, आपकी आज की हाज़िरी पहले से ही दर्ज है। धन्यवाद!";
            setResultMsg(reply);
            speak(reply);
            toast.info(reply);
            break;
          }

          await markWeaverAttendance(weaverId, cooperativeId);
          const reply = isBn 
            ? "আপনার আজকের দৈনিক হাজিরা সফলভাবে একত্ব খাতায় নথিভুক্ত করা হয়েছে। আপনার দিনটি শুভ হোক!" 
            : isEn 
            ? "Your daily attendance has been successfully marked in the Ekatva ledger. Have a great day!" 
            : "आपकी आज की दैनिक हाज़िरी सफलतापूर्वक एकत्व बहीखाते में दर्ज कर ली गई है। आपका दिन शुभ हो!";
          setResultMsg(reply);
          speak(reply);
          toast.success(isBn ? "দৈনিক হাজিরা নথিভুক্ত করা হয়েছে" : isEn ? "Daily attendance marked" : "दैनिक हाज़िरी दर्ज की गई।");
          setAttendanceToday(true);
          break;
        }

        default: {
          const reply = isBn 
            ? `দুঃখিত তাঁতি ভাই, আমি বুঝতে পারিনি। দয়া করে বলবেন "হাজিরা", "কাজ শুরু করো", "কাজ শেষ হয়েছে", "উপার্জন কত" বা "বিজ্ঞপ্তি"।` 
            : isEn 
            ? `Sorry weaver, I didn't understand that. Please say "attendance", "start job", "finish job", "check balance", or "latest notice".` 
            : `क्षमा करें बुनकर भाई, मुझे समझ नहीं आया। कृपया कहें "हाज़िरी", "जॉब शुरू करो", "जॉब पूरा हुआ", "मेरी कमाई बताओ" या "कल की सूचना"।`;
          setResultMsg(reply);
          speak(reply);
          break;
        }
      }
    } catch (err: any) {
      console.error(err);
      const reply = isBn 
        ? "পদক্ষেপ নিতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" 
        : isEn 
        ? "Error processing command. Please try again." 
        : "कार्यवाही करने में त्रुटि हुई। कृपया पुनः प्रयास करें।";
      setResultMsg(reply);
      speak(reply);
    } finally {
      setProcessing(false);
    }
  };

  const retryListening = () => {
    setResultMsg(null);
    setSakhiTranscript('');
    const prompt = i18n.language.startsWith('bn') 
      ? "হ্যাঁ বলুন, আমি শুনছি।" 
      : i18n.language.startsWith('en') 
      ? "Yes please, speak again. I am listening." 
      : "हाँ जी, दोबारा बोलिए। मैं सुन रही हूँ।";
    speak(prompt);
    setTimeout(() => {
      startListening(processCommand);
    }, 1000);
  };

  const handleClose = () => {
    stopListening();
    setIsOpen(false);
    setIsExpanded(false);
  };

  return (
    <>
      <button
        id="job-sakhi-trigger"
        onClick={(e) => {
          if (!isExpanded) {
            e.stopPropagation();
            setIsExpanded(true);
          } else {
            handleMicClick();
          }
        }}
        style={{
          transform: isExpanded ? 'translateX(-16px)' : 'translateX(28px)',
          transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, box-shadow 0.2s'
        }}
        className="fixed bottom-6 right-0 z-40 h-14 bg-loom-wood hover:bg-loom-wood-light text-white px-4 rounded-l-2xl rounded-r-none shadow-2xl flex items-center justify-center gap-2.5 border-2 border-r-0 border-loom-gold cursor-pointer"
      >
        <Mic className={`w-6 h-6 shrink-0 ${isListening ? 'animate-bounce text-emerald-400' : 'text-loom-gold'}`} />
        <span 
          style={{
            transition: 'max-width 350ms ease-in-out, opacity 300ms ease-in-out, margin 350ms ease-in-out',
            maxWidth: isExpanded ? '200px' : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
          className="font-heading font-black text-sm pr-1 overflow-hidden whitespace-nowrap block"
        >
          {isListening ? `${t('voice.assistantName')} ${t('voice.listening')}` : t('voice.assistantName')}
        </span>
      </button>

      {/* Speech Bubble / Dialog Drawer */}
      {isOpen && (
        <div id="job-sakhi-dialog-container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          {/* Backdrop Closer */}
          <div className="absolute inset-0" onClick={handleClose} />

          <div id="job-sakhi-dialog" className="relative w-full max-w-md bg-loom-cream border-t-8 border-loom-gold rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-5 border border-loom-beige">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-loom-beige/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-loom-gold/10 border border-loom-gold/50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-loom-gold animate-spin-slow" />
                </div>
                <div>
                  <h4 className="font-heading text-lg font-black text-loom-wood">
                    {t('voice.assistantName')} (Voice Assistant)
                  </h4>
                  <span className="text-[10px] text-loom-wood-light font-bold uppercase tracking-wider block">
                    {i18n.language.startsWith('bn') 
                      ? "আপনার বিশ্বস্ত তাঁত সহচরী" 
                      : i18n.language.startsWith('en') 
                      ? "Your trusted handloom companion" 
                      : "आपकी विश्वसनीय हथकरघा सहचरी"}
                  </span>
                </div>
              </div>
              <button 
                id="job-sakhi-close"
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-loom-sand/20 text-loom-wood/60 hover:text-loom-wood transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voice Status Indicator */}
            <div className="flex justify-center py-2">
              {isListening ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-12 w-12 rounded-full bg-rose-500/30 animate-ping" />
                    <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center border border-rose-400">
                      <Mic className="w-5 h-5 text-white animate-pulse" />
                    </div>
                  </div>
                  <span className="text-xs text-rose-700 font-extrabold tracking-wide animate-pulse">
                    {i18n.language.startsWith('bn') 
                      ? "বলুন, আমি শুনছি..." 
                      : i18n.language.startsWith('en') 
                      ? "Speak, I am listening..." 
                      : "बोलिए, मैं सुन रही हूँ..."}
                  </span>
                </div>
              ) : processing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-loom-wood font-extrabold tracking-wide">
                    {i18n.language.startsWith('bn') 
                      ? "বিশ্লেষণ করা হচ্ছে..." 
                      : i18n.language.startsWith('en') 
                      ? "Analyzing..." 
                      : "विश्लेषण कर रही हूँ..."}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-loom-wood rounded-full flex items-center justify-center border border-loom-gold">
                    <MicOff className="w-5 h-5 text-loom-gold" />
                  </div>
                  <span className="text-xs text-loom-wood-light font-bold">
                    {i18n.language.startsWith('bn') 
                      ? "মাইক বন্ধ আছে" 
                      : i18n.language.startsWith('en') 
                      ? "Mic is off" 
                      : "माइक बंद है"}
                  </span>
                </div>
              )}
            </div>

            {/* Transcript & Speech Bubbles */}
            <div className="bg-white border border-loom-beige/80 rounded-xl p-4 min-h-[90px] flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-heading font-bold text-loom-gold uppercase tracking-widest block mb-1">
                  {t('voice.recognizedText')}
                </span>
                <p className="text-sm font-semibold text-loom-ink italic">
                  {sakhiTranscript || transcript || (isListening ? "..." : (
                    i18n.language.startsWith('bn') 
                      ? "আপনার বলা বাক্য এখানে প্রদর্শিত হবে।" 
                      : i18n.language.startsWith('en') 
                      ? "Your spoken sentences will appear here." 
                      : "यहाँ आपके द्वारा बोला गया वाक्य दिखाई देगा।"
                  ))}
                </p>
              </div>

              {voiceError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{voiceError}</span>
                </div>
              )}
            </div>

            {/* Sakhi Answer / Feedback Box */}
            {resultMsg && (
              <div id="job-sakhi-result" className="bg-loom-sand/10 border-l-4 border-loom-gold rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] font-heading font-bold text-loom-wood uppercase tracking-widest block mb-1 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-loom-gold shrink-0" />
                  {i18n.language.startsWith('bn') 
                    ? "সখীর উত্তর:" 
                    : i18n.language.startsWith('en') 
                    ? "Sakhi Reply:" 
                    : "सखी का उत्तर:"}
                </span>
                <p className="text-sm font-medium text-loom-wood whitespace-pre-line leading-relaxed">
                  {resultMsg}
                </p>
              </div>
            )}

            {/* Attendance indicator */}
            <div id="job-sakhi-attendance-status" className="flex items-center justify-between text-xs font-semibold px-2">
              <span className="text-loom-wood-light">
                {i18n.language.startsWith('bn') 
                  ? "আজকের হাজিরা স্থিতি:" 
                  : i18n.language.startsWith('en') 
                  ? "Today's Attendance Status:" 
                  : "आज की हाज़िरी स्थिति:"}
              </span>
              {attendanceToday ? (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 
                  {i18n.language.startsWith('bn') ? "নথিভুক্ত" : i18n.language.startsWith('en') ? "Marked" : "दर्ज है"}
                </span>
              ) : (
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {i18n.language.startsWith('bn') ? "নথিভুক্ত নয়" : i18n.language.startsWith('en') ? "Not Marked" : "दर्ज नहीं है"}
                </span>
              )}
            </div>

            {/* Suggested Commands Cheat Sheet */}
            <div id="job-sakhi-cheat-sheet" className="bg-loom-parchment/30 border border-loom-beige/50 rounded-xl p-3.5 text-[11px] text-loom-wood leading-relaxed">
              <span className="font-heading font-black text-xs text-loom-wood block mb-1.5">
                💡 {i18n.language.startsWith('bn') 
                  ? "আপনি এই বাক্যগুলি বলতে পারেন:" 
                  : i18n.language.startsWith('en') 
                  ? "You can say phrases like:" 
                  : "आप इन वाक्यों का उपयोग कर सकते हैं:"}
              </span>
              {i18n.language.startsWith('bn') ? (
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong className="text-loom-wood-light">হাজিরা:</strong> "আমার হাজিরা নথিভুক্ত করো"</li>
                  <li><strong className="text-loom-wood-light">কাজ শুরু:</strong> "কাজ শুরু করো"</li>
                  <li><strong className="text-loom-wood-light">কাজ শেষ:</strong> "কাজ শেষ হয়েছে"</li>
                  <li><strong className="text-loom-wood-light">উপার্জন:</strong> "আমার কত টাকা বকেয়া আছে"</li>
                  <li><strong className="text-loom-wood-light">বিজ্ঞপ্তি:</strong> "নতুন বিজ্ঞপ্তি বলো"</li>
                </ul>
              ) : i18n.language.startsWith('en') ? (
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong className="text-loom-wood-light">Attendance:</strong> "Mark my attendance"</li>
                  <li><strong className="text-loom-wood-light">Start Job:</strong> "Start job"</li>
                  <li><strong className="text-loom-wood-light">Complete Job:</strong> "Complete job"</li>
                  <li><strong className="text-loom-wood-light">Balance:</strong> "Check my balance"</li>
                  <li><strong className="text-loom-wood-light">Notice:</strong> "Tell me the latest notice"</li>
                </ul>
              ) : (
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong className="text-loom-wood-light">हाज़िरी:</strong> "मेरी हाज़िरी दर्ज करो"</li>
                  <li><strong className="text-loom-wood-light">जॉब शुरू:</strong> "जॉब शुरू करो"</li>
                  <li><strong className="text-loom-wood-light">जॉब पूरा:</strong> "मेरा जॉब पूरा हो गया है"</li>
                  <li><strong className="text-loom-wood-light">कमाई:</strong> "मेरी कुल कमाई या बकाया बताओ"</li>
                  <li><strong className="text-loom-wood-light">सूचना:</strong> "समिति की कल की सूचना बताओ"</li>
                </ul>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex gap-3 justify-end pt-2 border-t border-loom-beige/30">
              <button
                id="job-sakhi-retry"
                type="button"
                onClick={retryListening}
                disabled={isListening || processing}
                className="px-4 py-2 bg-white hover:bg-loom-sand/20 text-loom-wood border border-loom-beige rounded-xl font-heading font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('voice.retry')}
              </button>
              <button
                id="job-sakhi-cancel"
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-loom-wood hover:bg-loom-wood-light text-white rounded-xl font-heading font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {t('voice.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
