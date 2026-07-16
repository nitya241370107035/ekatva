import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface UseVoiceAssistantReturn {
  transcript: string;
  isListening: boolean;
  error: string | null;
  startListening: (onCommand: (text: string) => void) => void;
  stopListening: () => void;
  speak: (text: string) => void;
  resetTranscript: () => void;
  browserSupported: boolean;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);
  const { i18n, t } = useTranslation();
  
  const recognitionRef = useRef<any>(null);
  const onCommandCallbackRef = useRef<((text: string) => void) | null>(null);

  const mapLang = (lang: string) => {
    const code = lang.split('-')[0];
    if (code === 'bn') return 'bn-IN';
    if (code === 'en') return 'en-IN';
    return 'hi-IN';
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      setError(t('voice.unsupported', 'आपका ब्राउज़र वॉइस सपोर्ट नहीं करता। कृपया क्रोम (Chrome) या सफारी (Safari) का उपयोग करें।'));
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = mapLang(i18n.language);
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript || '';
      setTranscript(resultText);
      if (onCommandCallbackRef.current) {
        onCommandCallbackRef.current(resultText);
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError(t('voice.noMic', 'माइक्रोफ़ोन की अनुमति नहीं है। कृपया सेटिंग में जाकर अनुमति दें।'));
      } else {
        setError(t('voice.error', 'आवाज़ पहचानने में त्रुटि हुई। कृपया दोबारा प्रयास करें।'));
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, []);

  // Update language dynamically on recognition instance when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = mapLang(i18n.language);
    }
  }, [i18n.language]);

  const startListening = (onCommand: (text: string) => void) => {
    if (!browserSupported) return;
    setTranscript('');
    setError(null);
    onCommandCallbackRef.current = onCommand;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.lang = mapLang(i18n.language);
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!browserSupported) return;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (err) {
      console.error('Failed to stop speech recognition:', err);
    }
    setIsListening(false);
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const speechLang = mapLang(i18n.language);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.9; // Slightly slower for clear pronunciations
    
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.includes(speechLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    speak,
    resetTranscript,
    browserSupported
  };
}
