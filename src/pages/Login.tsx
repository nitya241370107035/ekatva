import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EkatvaLogo } from '../components/EkatvaLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Toast } from '../components/ui/Toast';
import { AnimatedPage } from '../components/ui/AnimatedPage';
import { useTranslation } from 'react-i18next';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login, loginGoogle, loginDemo } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('login.emailAndPasswordRequired', 'कृपया ईमेल और पासवर्ड दर्ज करें।'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const profile = await login(email, password);
      setToastMessage(t('login.success', 'लॉग इन सफल!'));
      
      // Navigate based on role
      if (profile.role === 'weaver') {
        navigate('/weaver');
      } else if (profile.role === 'secretary') {
        navigate('/secretary');
      } else if (profile.role === 'buyer') {
        navigate('/buyer');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('auth/operation-not-allowed')) {
        setError(
          t('login.firebaseError', 'ईमेल-पासवर्ड प्रदाता फायरबेस कंसोल में सक्षम नहीं है। कृपया फायरबेस कंसोल -> ऑथेंटिकेशन -> साइन-इन मेथड में जाकर "Email/Password" को सक्षम करें। या फिर आप नीचे दिए गए "Google से प्रवेश करें" बटन का उपयोग कर सकते हैं, जो पहले से सक्षम और तैयार है!')
        );
      } else {
        setError(err.message || t('login.fail', 'लॉग इन करने में विफल। कृपया अपने क्रेडेंशियल जांचें।'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { profile } = await loginGoogle();
      setToastMessage(t('login.successGoogle', 'Google से लॉग इन सफल!'));
      
      if (profile) {
        if (profile.role === 'weaver') navigate('/weaver');
        else if (profile.role === 'secretary') navigate('/secretary');
        else if (profile.role === 'buyer') navigate('/buyer');
      } else {
        navigate('/register-profile');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('login.googleFail', 'Google से लॉग इन करने में विफल।'));
    } finally {
      setLoading(false);
    }
  };

  // Direct Demo Login helper for instant, hassle-free testing
  const handleQuickLogin = async (role: 'weaver' | 'secretary' | 'buyer') => {
    setLoading(true);
    setError('');
    try {
      const profile = await loginDemo(role);
      setToastMessage(t('login.successDemo', 'डेमो लॉग इन सफल!'));
      
      // Navigate based on role
      if (profile.role === 'weaver') {
        navigate('/weaver');
      } else if (profile.role === 'secretary') {
        navigate('/secretary');
      } else if (profile.role === 'buyer') {
        navigate('/buyer');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('login.demoFail', 'डेमो लॉग इन करने में विफल।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-loom-parchment bg-loom-pattern pattern-breathe flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <AnimatedPage>
          {/* Main Vintage Card */}
          <div className="vintage-card p-8 md:p-10 text-center relative">
          
          {/* Logo */}
          <div className="mb-6">
            <EkatvaLogo size={68} showText={false} />
            <h1 className="font-heading text-4xl font-bold text-loom-wood mt-2 inline-block border-b-2 border-loom-gold pb-1 px-4">
              {t('login.appName', 'एकत्व')}
            </h1>
            <p className="font-body text-base font-semibold text-loom-ink-light mt-2 tracking-wide">
              {t('login.appNameSubtitle', "Ekatva – Digital Weavers' Unity")}
            </p>
            <p className="font-body text-xs text-loom-gold tracking-widest mt-1 uppercase font-bold">
              {t('login.tagline', 'हाथकरघा सहकारिता का डिजिटल संगम')}
            </p>
          </div>

          {/* Inline Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-loom-error bg-loom-cream flex items-start gap-3 text-left text-sm text-loom-error font-body">
              <AlertTriangle className="w-5 h-5 shrink-0 text-loom-error" />
              <div>
                <span className="font-bold block">{t('login.errorTitle', 'त्रुटि (Error):')}</span>
                {error}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <Input
              id="email"
              type="email"
              label={t('login.emailLabel', 'ईमेल (Email Address)')}
              icon={<Mail className="w-4 h-4 text-loom-gold" />}
              placeholder="bunkar@ekatva.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              id="password"
              type="password"
              label={t('login.passwordLabel', 'पासवर्ड (Password)')}
              icon={<Lock className="w-4 h-4 text-loom-gold" />}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Button 
              type="submit" 
              className="w-full text-lg py-3 mt-6"
              disabled={loading}
            >
              {loading ? t('login.loading', 'प्रवेश किया जा रहा है...') : t('login.loginBtnBilingual', 'लॉग इन करें (Log In)')}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center justify-between gap-3 text-xs text-loom-ink-light font-body">
            <div className="h-[1px] bg-loom-beige/60 grow" />
            <span>{t('login.or', 'या (Or)')}</span>
            <div className="h-[1px] bg-loom-beige/60 grow" />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-loom-cream border border-loom-beige text-loom-ink font-heading font-semibold text-base py-3 px-4 rounded-xl shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('login.googleLogin', 'Google से प्रवेश करें (Sign in with Google)')}
          </button>

          {/* Registration Footer */}
          <div className="mt-8 pt-6 border-t border-loom-beige/40 text-center font-body text-base">
            <span className="text-loom-ink-light">{t('login.noAccount', 'खाता नहीं है?')} </span>
            <Link 
              to="/register" 
              className="font-bold text-loom-wood hover:text-loom-wood-light underline decoration-loom-gold underline-offset-4 inline-flex items-center gap-1 hover:gap-2 transition-all"
            >
              {t('login.registerLink', 'नया पंजीकरण करें')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Login Section for Reviewers */}
        <div className="mt-6 p-4 bg-loom-cream/80 border border-loom-beige rounded-xl shadow-sm">
          <p className="font-heading text-sm font-bold text-loom-wood mb-2.5 text-center">
            {t('login.quickFill', 'त्वरित परीक्षण क्रेडेंशियल (Developer Quick Fill)')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('weaver')}
              className="px-2 py-1.5 bg-loom-wood text-loom-cream rounded-lg text-xs font-heading font-medium hover:bg-loom-wood-light transition-colors cursor-pointer"
            >
              {t('login.weaver', 'बुनकर (Weaver)')}
            </button>
            <button
              onClick={() => handleQuickLogin('secretary')}
              className="px-2 py-1.5 bg-loom-gold text-loom-ink rounded-lg text-xs font-heading font-medium hover:bg-loom-gold/80 transition-colors cursor-pointer"
            >
              {t('login.secretary', 'सचिव (Secretary)')}
            </button>
            <button
              onClick={() => handleQuickLogin('buyer')}
              className="px-2 py-1.5 bg-loom-sand text-loom-ink rounded-lg text-xs font-heading font-medium hover:bg-loom-sand/80 transition-colors cursor-pointer"
            >
              {t('login.buyer', 'क्रेता (Buyer)')}
            </button>
          </div>
          <p className="text-[11px] text-loom-ink-light text-center mt-2.5 font-body">
            {t('login.note', 'नोट: यदि खाते अभी पंजीकृत नहीं हैं, तो कृपया नीचे दिए गए "नया पंजीकरण" बटन का उपयोग करके परीक्षण करें।')}
          </p>
        </div>
        </AnimatedPage>
      </div>

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          onClose={() => setToastMessage('')} 
        />
      )}
    </div>
  );
};
