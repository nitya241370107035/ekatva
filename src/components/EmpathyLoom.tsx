import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Palette, 
  Heart, 
  Compass, 
  Layers, 
  Info,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PoetryVerse {
  hindi: string;
  english: string;
  meaningHindi: string;
  meaningEnglish: string;
  author: string;
}

interface OrganicDye {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  colorClass: string;
  hex: string;
  sourceHindi: string;
  sourceEnglish: string;
  timeHindi: string;
  timeEnglish: string;
  descriptionHindi: string;
  descriptionEnglish: string;
}

export const EmpathyLoom: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [selectedDye, setSelectedDye] = useState<string>('indigo');
  const [weaverStep, setWeaverStep] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'poetry' | 'dye' | 'craft'>( 'poetry');
  const [verseIndex, setVerseIndex] = useState(0);

  // Audio nodes refs for synthesizing loom sound
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Traditional poetry verses about weaving and human connection
  const verses: PoetryVerse[] = [
    {
      hindi: "झीनी झीनी बीनी चदरिया।\nकाहे का ताना, काहे की भरनी, कौन तार से बीनी चदरिया॥",
      english: "Finely, so finely woven is this tapestry of life.\nWhat is the warp, what is the weft, and what precious threads did you weave it with?",
      meaningHindi: "महान संत और बुनकर कबीर दास जी कहते हैं कि हमारा जीवन ईश्वर द्वारा बुने गए सुंदर हथकरघा वस्त्र की तरह है। ताना और बाना हमारे श्वास और कर्म हैं।",
      meaningEnglish: "Saint Kabir, a master weaver himself, compares human existence to a delicate handloom weave. Every breath is a warp thread, and every action is the weft.",
      author: "संत कबीर दास (Saint Kabir)"
    },
    {
      hindi: "सूती धागा प्रेम का, मत तोड़ो चटकाय।\nटूटे से फिर ना मिले, मिले गाँठ पड़ जाय॥",
      english: "The cotton thread of love is delicate, do not snap it in haste.\nOnce broken it cannot be joined, and if joined, a knot remains.",
      meaningHindi: "धागों की तरह मानवीय रिश्ते भी नाजुक होते हैं। इन्हें सब्र और समर्पण के साथ बुना जाता है, बिल्कुल वैसे ही जैसे एक बुनकर करघे पर घंटों ध्यान लगाता है।",
      meaningEnglish: "Like spun cotton, human bonds are fine. They are crafted with patience and love, just as a weaver spends hours on the loom with total devotion.",
      author: "कवि रहीम (Rahim)"
    },
    {
      hindi: "करघे की हर खटखट में बसता है एक परिवार का सपना।\nहर धागा गवाही है सदियों की सादगी, समर्पण और सब्र की॥",
      english: "In every rhythmic beat of the loom lives a family's dream.\nEvery single thread is a testament to centuries of simplicity, devotion, and patience.",
      meaningHindi: "यह सिर्फ एक कपड़ा नहीं है, यह एक बुनकर की उंगलियों की छाप, उसकी धड़कन और उसकी पीढ़ी की विरासत है।",
      meaningEnglish: "This is not merely fabric; it is the imprint of a weaver's fingers, their pulse, and the ancestral heritage of their lineage.",
      author: "एकत्व विरासत (Ekatva Heritage)"
    }
  ];

  // Natural Organic Dyes Details
  const organicDyes: OrganicDye[] = [
    {
      id: 'indigo',
      nameHindi: 'नील (Indigo Blue)',
      nameEnglish: 'Natural Indigo',
      colorClass: 'bg-indigo-900',
      hex: '#1e1b4b',
      sourceHindi: 'इंडिगोफेरा पौधों की हरी पत्तियों का किण्वन (Fermentation)',
      sourceEnglish: 'Fermented leaves of the Indigofera plant',
      timeHindi: '10 से 15 दिन',
      timeEnglish: '10 to 15 days of preparation',
      descriptionHindi: 'प्राचीन भारत की "नीली सोने" की विरासत। यह रंग समय के साथ और अधिक निखरता है और त्वचा के लिए अनुकूल है।',
      descriptionEnglish: 'Known as "Blue Gold" of ancient India. This dye is therapeutic for skin, bio-degradable, and grows richer with age.'
    },
    {
      id: 'madder',
      nameHindi: 'मंजीठ (Madder Root Red)',
      nameEnglish: 'Madder Root Red',
      colorClass: 'bg-amber-900',
      hex: '#78350f',
      sourceHindi: 'मंजीठ (Rubia cordifolia) जड़ी-बूटी की जड़ें',
      sourceEnglish: 'Roots of the Rubia cordifolia herb',
      timeHindi: '5 से 7 दिन की उबलाई',
      timeEnglish: '5 to 7 days of gradual boiling & curing',
      descriptionHindi: 'मंजीठ की जड़े गहरा लाल और ईंट जैसा सुहावना रंग देती हैं, जो पीढ़ियों तक फीका नहीं पड़ता।',
      descriptionEnglish: 'Yields magnificent warm reds and earthy terracottas. Resistant to fading, lasting generations.'
    },
    {
      id: 'turmeric',
      nameHindi: 'हल्दी और कत्था (Turmeric Gold)',
      nameEnglish: 'Turmeric & Catechu Gold',
      colorClass: 'bg-amber-500',
      hex: '#d97706',
      sourceHindi: 'कच्ची हल्दी की गांठें और खैर के पेड़ की छाल (कत्था)',
      sourceEnglish: 'Raw turmeric rhizomes combined with Acacia catechu',
      timeHindi: '3 दिन की प्राकृतिक कढ़ना',
      timeEnglish: '3 days of natural brewing',
      descriptionHindi: 'यह चमकीला पीला और सुनहरा रंग शुभ अवसरों का प्रतीक है तथा पूरी तरह से रोगाणुरोधी (anti-microbial) है।',
      descriptionEnglish: 'Symbolizes prosperity and purity in Indian culture. Offers beautiful golden hues with antimicrobial properties.'
    }
  ];

  // Rotate verses automatically unless tab changes
  useEffect(() => {
    if (activeTab !== 'poetry') return;
    const interval = setInterval(() => {
      setVerseIndex((prev) => (prev + 1) % verses.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [activeTab, verses.length]);

  // Handle Play/Stop of the Web Audio Loom Synthesizer
  const toggleLoomSound = () => {
    if (isPlayingSound) {
      stopLoomSound();
    } else {
      startLoomSound();
    }
  };

  const startLoomSound = () => {
    // 1. Initialize Audio Context
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;
      setIsPlayingSound(true);

      let step = 0;
      
      // 2. Synthesize loom sounds in a rhythmic cycle (approx 750ms per step)
      const playLoomBeat = () => {
        if (!ctx || ctx.state === 'closed') return;

        // Ensure context is running (needed due to browser autoplay policies)
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;

        if (step % 2 === 0) {
          // Beat 0 & 2: Wood clack of the loom frame (shuttle meeting wood block)
          // Low drum-like wooden thud
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(110, now);
          osc.frequency.exponentialRampToValueAtTime(10, now + 0.12);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

          // Add a high-pitch transient for wood-to-wood click
          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          clickOsc.type = 'sine';
          clickOsc.frequency.setValueAtTime(900, now);
          clickOsc.frequency.exponentialRampToValueAtTime(100, now + 0.02);

          clickGain.gain.setValueAtTime(0.25, now);
          clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);

          osc.connect(gain);
          gain.connect(ctx.destination);
          
          clickOsc.connect(clickGain);
          clickGain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.15);

          clickOsc.start(now);
          clickOsc.stop(now + 0.03);

          setWeaverStep(0);
        } else {
          // Beat 1 & 3: The sweeping "swoosh" of the shuttle carrying the weft thread
          // Bandpassed white noise sweep
          const bufferSize = ctx.sampleRate * 0.25; // 250ms duration
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }

          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(300, now);
          filter.Q.setValueAtTime(3.0, now);
          filter.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.08, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(ctx.destination);

          noise.start(now);
          noise.stop(now + 0.25);

          setWeaverStep(1);
        }

        step = (step + 1) % 4;
      };

      // Play immediate first beat, then schedule every 420ms
      playLoomBeat();
      const interval = setInterval(playLoomBeat, 420);
      audioIntervalRef.current = interval;

    } catch (err) {
      console.error("Failed to start loom audio synthesis:", err);
    }
  };

  const stopLoomSound = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlayingSound(false);
  };

  useEffect(() => {
    return () => {
      // Cleanup audio context on unmount
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const currentDye = organicDyes.find(d => d.id === selectedDye) || organicDyes[0];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-loom-cream border-2 border-loom-gold/60 p-5 sm:p-7 shadow-xl bg-loom-pattern relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-800 via-amber-800 to-amber-500 animate-thread-weave" />
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-loom-beige/50 pb-4 relative z-10">
        <div>
          <span className="text-[10px] uppercase font-heading font-black tracking-widest text-loom-gold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-loom-gold animate-pulse" />
            {t('empathy.titlePre', 'हथकरघा दर्शन (Craft & Devotion)')}
          </span>
          <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-loom-wood mt-0.5">
            {t('empathy.title', 'ताने-बाने का संगीत (The Rhythm of Loom)')}
          </h3>
        </div>

        {/* Listen to Loom Button */}
        <button
          onClick={toggleLoomSound}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-black transition-all shadow-md cursor-pointer ${
            isPlayingSound 
              ? 'bg-rose-800 text-white animate-pulse' 
              : 'bg-[#854d0e] hover:bg-[#713f12] text-white'
          }`}
          title="Loom Synthesizer"
        >
          {isPlayingSound ? (
            <>
              <VolumeX className="w-4 h-4 text-white animate-bounce" />
              <span>करघा रोकें (Mute Loom)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-loom-gold animate-bounce" />
              <span>करघे की धड़कन सुनें (Listen to Loom)</span>
            </>
          )}
        </button>
      </div>

      {/* Loom visual simulation when playing */}
      {isPlayingSound && (
        <div className="mb-6 p-4 bg-white/70 border border-loom-beige/60 rounded-xl flex items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-loom-gold/5 via-transparent to-loom-gold/5 pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-3.5 h-3.5 rounded-full ${weaverStep === 0 ? 'bg-loom-gold' : 'bg-indigo-900'} transition-all duration-75 transform scale-125 shadow-md`} />
            <span className="font-heading font-bold text-xs text-loom-wood">
              {weaverStep === 0 
                ? "खट (Clack!) - करघा ढांचा खिसका" 
                : "सूं... (Swoosh!) - ध्यानी नाल (Shuttle) बुनाई"
              }
            </span>
          </div>

          {/* Thread wave animation */}
          <div className="flex-1 h-3 flex items-center justify-center gap-1 overflow-hidden max-w-[150px] sm:max-w-xs px-2">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-full rounded-full transition-all duration-100 ${
                  weaverStep === 0 
                    ? 'bg-loom-gold/80 h-3' 
                    : 'bg-indigo-950/40 h-1'
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation tabs for Empathy experience */}
      <div className="flex border-b border-loom-beige/40 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('poetry')}
          className={`pb-2.5 px-3 font-heading text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all relative cursor-pointer ${
            activeTab === 'poetry' 
              ? 'text-loom-wood border-b-2 border-loom-gold' 
              : 'text-loom-ink/50 hover:text-loom-wood'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          कबीर का करघा (Poetic Soul)
        </button>
        <button
          onClick={() => setActiveTab('dye')}
          className={`pb-2.5 px-3 font-heading text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all relative cursor-pointer ${
            activeTab === 'dye' 
              ? 'text-loom-wood border-b-2 border-loom-gold' 
              : 'text-loom-ink/50 hover:text-loom-wood'
          }`}
        >
          <Palette className="w-3.5 h-3.5 shrink-0" />
          जैविक रंगाई (Organic Dyeing)
        </button>
        <button
          onClick={() => setActiveTab('craft')}
          className={`pb-2.5 px-3 font-heading text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all relative cursor-pointer ${
            activeTab === 'craft' 
              ? 'text-loom-wood border-b-2 border-loom-gold' 
              : 'text-loom-ink/50 hover:text-loom-wood'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          बुनाई की मेहनत (Devoted Hours)
        </button>
      </div>

      {/* Content Panels */}
      <div className="min-h-[160px] flex flex-col justify-between">
        
        {/* Tab 1: Poetry */}
        {activeTab === 'poetry' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white/80 p-5 rounded-2xl border border-loom-beige/60 relative">
              <div className="absolute -top-3 -left-2 text-4xl text-loom-gold/30 font-serif font-black select-none">“</div>
              <p className="font-body text-base sm:text-lg text-loom-wood font-extrabold leading-relaxed whitespace-pre-line italic text-center">
                {i18n.language === 'en' ? verses[verseIndex].english : verses[verseIndex].hindi}
              </p>
              <div className="text-right font-heading text-xs font-black text-loom-gold mt-3">
                — {verses[verseIndex].author}
              </div>
            </div>

            <div className="p-3.5 bg-[#fdfaf2] rounded-xl border border-loom-beige/30 flex gap-2.5 items-start">
              <Info className="w-4 h-4 text-loom-gold shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-loom-ink-light leading-relaxed font-body">
                {i18n.language === 'en' ? verses[verseIndex].meaningEnglish : verses[verseIndex].meaningHindi}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Organic Dye */}
        {activeTab === 'dye' && (
          <div className="space-y-5 animate-fade-in">
            {/* Color Select Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {organicDyes.map((dye) => (
                <button
                  key={dye.id}
                  onClick={() => setSelectedDye(dye.id)}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-left cursor-pointer transition-all ${
                    selectedDye === dye.id 
                      ? 'bg-white border-loom-gold shadow-sm scale-[1.02]' 
                      : 'bg-white/50 border-loom-beige/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${dye.colorClass} border border-black/10 shrink-0`} />
                  <span className="font-heading font-black text-[11px] truncate text-loom-wood">
                    {i18n.language === 'en' ? dye.nameEnglish : dye.nameHindi}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Dye Details Card */}
            <div className="p-4 bg-white/90 border border-loom-beige/60 rounded-xl space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-full`} style={{ backgroundColor: currentDye.hex }} />
                  <span className="font-heading font-black text-sm text-loom-wood">
                    {i18n.language === 'en' ? currentDye.nameEnglish : currentDye.nameHindi}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-2 py-0.5 font-bold">
                  {i18n.language === 'en' ? currentDye.timeEnglish : currentDye.timeHindi}
                </span>
              </div>

              <div className="text-xs space-y-1.5 font-body text-loom-ink/90 leading-relaxed">
                <p>
                  <strong>कच्चा स्रोत (Organic Source):</strong> {i18n.language === 'en' ? currentDye.sourceEnglish : currentDye.sourceHindi}
                </p>
                <p className="text-loom-ink-light italic">
                  {i18n.language === 'en' ? currentDye.descriptionEnglish : currentDye.descriptionHindi}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Devoted Hours Weaving Math */}
        {activeTab === 'craft' && (
          <div className="space-y-4 animate-fade-in font-body text-xs sm:text-sm text-loom-ink">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white border border-loom-beige/60 rounded-xl text-center">
                <span className="text-[10px] font-heading font-bold text-loom-wood block">ताना संरेखण (Warp Setup)</span>
                <span className="font-heading text-lg font-black text-loom-wood block mt-1">20,000+ धागे</span>
                <span className="text-[10px] text-loom-ink-light block mt-0.5 leading-normal">करघे पर ताने को खींचने और कसने में 3 दिन लगते हैं।</span>
              </div>
              <div className="p-3.5 bg-white border border-loom-beige/60 rounded-xl text-center">
                <span className="text-[10px] font-heading font-bold text-loom-wood block">धीमी गति (Weaving Speed)</span>
                <span className="font-heading text-lg font-black text-loom-wood block mt-1">3 से 5 सेमी प्रति घंटा</span>
                <span className="text-[10px] text-loom-ink-light block mt-0.5 leading-normal">बनारसी कढ़ुआ डिजाइन के महीन काम में बुनाई अत्यंत सूक्ष्म होती है।</span>
              </div>
              <div className="p-3.5 bg-white border border-loom-beige/60 rounded-xl text-center">
                <span className="text-[10px] font-heading font-bold text-loom-wood block">कुल समर्पण (Total Dedication)</span>
                <span className="font-heading text-lg font-black text-loom-wood block mt-1">150+ घंटे प्रति साड़ी</span>
                <span className="text-[10px] text-loom-ink-light block mt-0.5 leading-normal">एक हथकरघा उत्कृष्ट साड़ी 2 बुनकरों के 20 दिनों की कठिन तपस्या है।</span>
              </div>
            </div>

            <div className="p-3 bg-loom-gold/10 border border-loom-gold/30 rounded-xl flex items-center gap-2">
              <Heart className="w-5 h-5 text-loom-wood shrink-0 animate-pulse fill-loom-gold" />
              <p className="text-xs font-semibold leading-relaxed text-loom-ink">
                {t('empathy.callToAction', 'जब आप एकत्व उत्पाद खरीदते हैं, तो आप केवल धागा नहीं, बल्कि बुनकर के जीवन के संजोए हुए 150 घंटे और उसकी सांसों की लय खरीदते हैं।')}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
