import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EkatvaLogo } from '../components/EkatvaLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toast } from '../components/ui/Toast';
import { User, Phone, Mail, Lock, Shield, Award, Landmark, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatedPage } from '../components/ui/AnimatedPage';


export const Register: React.FC = () => {
  const { registerWeaver } = useAuth();
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Step 1 Form fields (Personal Info)
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 Form fields (Skills & Capacity)
  const availableSkills = ["बनारसी", "इकत", "जामदानी", "कांथा", "चंदेरी", "पोचमपल्ली", "कांचीपुरम", "अन्य"];
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [numberOfLooms, setNumberOfLooms] = useState('');
  const [dailyCapacity, setDailyCapacity] = useState('');

  // Step 3 Form fields (Bank & Address)
  const [aadharNumber, setAadharNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('उत्तर प्रदेश');
  const [pincode, setPincode] = useState('');

  // Validate step navigation
  const handleNextStep = () => {
    setError('');
    
    if (step === 1) {
      if (!displayName || !email || !phone || !password || !confirmPassword) {
        setError('कृपया सभी व्यक्तिगत जानकारी फ़ील्ड भरें।');
        return;
      }
      if (password.length < 6) {
        setError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
        return;
      }
      if (password !== confirmPassword) {
        setError('पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।');
        return;
      }
      if (phone.length !== 10) {
        setError('कृपया एक वैध 10 अंकों का फोन नंबर दर्ज करें।');
        return;
      }
    } else if (step === 2) {
      if (selectedSkills.length === 0) {
        setError('कृपया कम से कम एक बुनाई शैली/कौशल चुनें।');
        return;
      }
      if (!experience || !numberOfLooms || !dailyCapacity) {
        setError('कृपया अनुभव, करघों की संख्या और दैनिक क्षमता भरें।');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Final checks
    if (!bankName || !accountNumber || !ifsc || !street || !city || !stateName || !pincode) {
      setError('कृपया बैंक विवरण और पूरा पता भरें।');
      return;
    }

    setLoading(true);

    try {
      await registerWeaver(email, password, {
        displayName,
        phone,
        skillTags: selectedSkills,
        experience: Number(experience),
        numberOfLooms: Number(numberOfLooms),
        dailyCapacity: Number(dailyCapacity),
        aadharNumber: aadharNumber || undefined,
        bankAccount: {
          bankName,
          accountNumber,
          ifsc
        },
        address: {
          street,
          city,
          state: stateName,
          pincode
        },
        photoURL: ''
      });

      setToastMessage('पंजीकरण सफल! एकत्व में आपका स्वागत है।');
      setTimeout(() => {
        navigate('/weaver');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('auth/operation-not-allowed')) {
        setError(
          'ईमेल-पासवर्ड प्रदाता फायरबेस कंसोल में सक्षम नहीं है। कृपया फायरबेस कंसोल -> ऑथेंटिकेशन -> साइन-इन मेथड में जाकर "Email/Password" को सक्षम करें। तब तक आप लॉगिन स्क्रीन पर उपलब्ध "Google से प्रवेश करें" या "त्वरित परीक्षण क्रेडेंशियल (Demo Accounts)" बटन का उपयोग कर सकते हैं।'
        );
      } else {
        setError(err.message || 'पंजीकरण करने में त्रुटि आई। कृपया पुनः प्रयास करें।');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-loom-parchment bg-loom-pattern pattern-breathe flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <AnimatedPage>
          {/* Registration Card */}
          <div className="vintage-card p-6 sm:p-10 text-center relative">
          
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <EkatvaLogo size={56} showText={false} />
            <h1 className="font-heading text-3xl font-bold text-loom-wood mt-2">
              बुनकर सहकारी पंजीकरण
            </h1>
            <p className="font-body text-base text-loom-ink-light">
              एकत्व डिजिटल सहकारी संघ से जुड़ें
            </p>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${step === 1 ? 'bg-loom-wood text-loom-cream' : 'bg-loom-sand/20 text-loom-wood-light border border-loom-beige'}`}>
              <span className="w-5 h-5 rounded-full bg-loom-gold text-loom-ink flex items-center justify-center text-[10px] font-bold">1</span>
              व्यक्तिगत जानकारी
            </div>
            <div className="h-[2px] w-8 bg-loom-beige" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${step === 2 ? 'bg-loom-wood text-loom-cream' : 'bg-loom-sand/20 text-loom-wood-light border border-loom-beige'}`}>
              <span className="w-5 h-5 rounded-full bg-loom-gold text-loom-ink flex items-center justify-center text-[10px] font-bold">2</span>
              कौशल और क्षमता
            </div>
            <div className="h-[2px] w-8 bg-loom-beige" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${step === 3 ? 'bg-loom-wood text-loom-cream' : 'bg-loom-sand/20 text-loom-wood-light border border-loom-beige'}`}>
              <span className="w-5 h-5 rounded-full bg-loom-gold text-loom-ink flex items-center justify-center text-[10px] font-bold">3</span>
              बैंक और पता
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-loom-error bg-loom-cream flex items-start gap-3 text-left text-sm text-loom-error font-body">
              <Shield className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold block">कृपया ध्यान दें:</span>
                {error}
              </div>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4 text-left">
              <Input
                id="name"
                type="text"
                label="पूरा नाम (Full Name)"
                icon={<User className="w-4 h-4 text-loom-gold" />}
                placeholder="उदा: रमेश कुमार"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <Input
                id="email"
                type="email"
                label="ईमेल (Email)"
                icon={<Mail className="w-4 h-4 text-loom-gold" />}
                placeholder="ramesh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="phone"
                type="tel"
                label="फ़ोन नंबर (10-Digit Mobile Phone)"
                icon={<Phone className="w-4 h-4 text-loom-gold" />}
                placeholder="9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="pwd"
                  type="password"
                  label="पासवर्ड (Password)"
                  icon={<Lock className="w-4 h-4 text-loom-gold" />}
                  placeholder="कम से कम 6 अक्षर"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  id="confirmPwd"
                  type="password"
                  label="पासवर्ड की पुष्टि करें"
                  icon={<Lock className="w-4 h-4 text-loom-gold" />}
                  placeholder="पासवर्ड पुनः दर्ज करें"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Skills & Capacity */}
          {step === 2 && (
            <div className="space-y-6 text-left">
              <div>
                <label className="font-heading text-lg font-bold text-loom-wood flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-loom-gold" />
                  बुनाई शैली / कौशल (Skill Tags)
                </label>
                <p className="text-xs text-loom-ink-light mb-4 font-body">
                  आप जिन शैलियों में बुनाई करने में सक्षम हैं, उन्हें चुनें (कम से कम एक चुनें):
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {availableSkills.map((skill, idx) => {
                    const selected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-4 py-2 rounded-full border-2 font-heading text-base font-semibold transition-all cursor-pointer ${
                          selected 
                            ? 'bg-loom-gold text-loom-ink border-loom-wood scale-105 shadow-md' 
                            : 'bg-loom-cream border-loom-beige text-loom-ink-light hover:border-loom-gold hover:text-loom-ink'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <Input
                  id="experience"
                  type="number"
                  label="अनुभव (वर्षों में)"
                  placeholder="उदा: 15"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                />
                <Input
                  id="looms"
                  type="number"
                  label="करघों की संख्या"
                  placeholder="उदा: 2"
                  value={numberOfLooms}
                  onChange={(e) => setNumberOfLooms(e.target.value)}
                  required
                />
                <Input
                  id="capacity"
                  type="number"
                  label="दैनिक क्षमता (थान/टुकड़े)"
                  placeholder="उदा: 1"
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Bank & Address */}
          {step === 3 && (
            <div className="space-y-6 text-left">
              <div>
                <h3 className="font-heading text-lg font-bold text-loom-wood flex items-center gap-2 border-b border-loom-beige/40 pb-2 mb-3">
                  <Landmark className="w-5 h-5 text-loom-gold" />
                  बैंक और पहचान विवरण (Bank & Identity)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="aadhar"
                    type="text"
                    label="आधार संख्या (वैकल्पिक)"
                    placeholder="12-digit Aadhar"
                    maxLength={12}
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
                  />
                  <Input
                    id="bankName"
                    type="text"
                    label="बैंक का नाम"
                    placeholder="State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <Input
                    id="accountNumber"
                    type="text"
                    label="खाता संख्या (Account Number)"
                    placeholder="30123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <Input
                    id="ifsc"
                    type="text"
                    label="आईएफएससी कोड (IFSC Code)"
                    placeholder="SBIN0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              <div>
                <h3 className="font-heading text-lg font-bold text-loom-wood flex items-center gap-2 border-b border-loom-beige/40 pb-2 mb-3">
                  <MapPin className="w-5 h-5 text-loom-gold" />
                  पता विवरण (Postal Address)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="street"
                    type="text"
                    label="गली / मोहल्ला / ग्राम"
                    placeholder="वार्ड नं 4, पीली कोठी"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                  <Input
                    id="city"
                    type="text"
                    label="शहर / जनपद"
                    placeholder="वाराणसी"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <Input
                    id="state"
                    type="text"
                    label="राज्य"
                    placeholder="उत्तर प्रदेश"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    required
                  />
                  <Input
                    id="pincode"
                    type="text"
                    label="पिनकोड (Pincode)"
                    placeholder="221001"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-loom-beige/40 flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <ChevronLeft className="w-5 h-5" />
                पिछला (Previous)
              </Button>
            ) : (
              <Link 
                to="/login"
                className="font-heading text-lg font-bold text-loom-wood hover:text-loom-wood-light underline decoration-loom-gold"
              >
                लॉग इन पर लौटें
              </Link>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-2 ml-auto"
              >
                अगला (Next)
                <ChevronRight className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 ml-auto"
                disabled={loading}
              >
                {loading ? 'पंजीकरण किया जा रहा है...' : 'पंजीकरण करें (Register)'}
              </Button>
            )}
          </div>

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
