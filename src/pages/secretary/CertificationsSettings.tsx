import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { 
  getCooperative, 
  updateCooperativeCertifications 
} from '../../firebase/firestore';
import { Cooperative } from '../../types';
import { useTranslation } from 'react-i18next';
import { Award, Settings, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const CertificationsSettings: React.FC = () => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === 'en';
  const navigate = useNavigate();
  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Certifications states
  const [certHandloomMark, setCertHandloomMark] = useState<boolean>(false);
  const [certUdyam, setCertUdyam] = useState<boolean>(false);
  const [certGiTag, setCertGiTag] = useState<boolean>(false);

  useEffect(() => {
    const fetchCoopData = async () => {
      setLoading(true);
      try {
        const coopId = userProfile?.cooperativeId || 'coop1';
        const coopDetails = await getCooperative(coopId);
        setCoop(coopDetails);
        
        if (coopDetails) {
          const certs = coopDetails.certifications || [];
          setCertHandloomMark(certs.includes('handloomMark'));
          setCertUdyam(certs.includes('udyamRegistration'));
          setCertGiTag(certs.includes('giTag'));
        }
      } catch (err) {
        console.error("Error loading cooperative details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoopData();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const coopId = userProfile?.cooperativeId || 'coop1';
      const updatedCerts: string[] = [];
      if (certHandloomMark) updatedCerts.push('handloomMark');
      if (certUdyam) updatedCerts.push('udyamRegistration');
      if (certGiTag) updatedCerts.push('giTag');

      await updateCooperativeCertifications(coopId, updatedCerts);
      toast.success(isEnglish ? 'Certifications saved successfully!' : t('schemes.certificationsSaved', 'प्रमाणपत्र सफलतापूर्वक सहेजे गए!'));
    } catch (err) {
      console.error("Error saving certifications:", err);
      toast.error(isEnglish ? 'Unable to save certifications.' : 'प्रमाणपत्र सहेजने में विफल।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SecretaryLayout>
      <div className="space-y-6">
        
        {/* Back Button & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/secretary/schemes')}
              className="p-2 hover:bg-loom-sand/20 rounded-lg text-loom-wood transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-heading text-3xl font-bold text-loom-wood">
                {isEnglish ? 'Cooperative Certifications Settings' : t('schemes.certificationsSettings', 'सहकारी प्रमाणपत्र सेटिंग्स')}
              </h1>
              <p className="font-body text-sm text-loom-ink-light mt-0.5">
                {isEnglish
                  ? 'Manage active certifications and government tags for your cooperative.'
                  : 'अपनी सहकारी समिति के सक्रिय प्रमाणपत्रों और सरकारी टैग को प्रबंधित करें।'}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <p className="font-heading text-lg text-loom-wood animate-pulse">
              {isEnglish ? 'Loading...' : t('common.loading', 'लोड हो रहा है...')}
            </p>
          </div>
        ) : (
          <div className="max-w-2xl">
            <Card className="bg-loom-cream/40 border border-loom-beige">
              <CardHeader className="pb-3 border-b border-loom-beige/50">
                <CardTitle className="font-heading text-xl text-loom-wood flex items-center gap-2">
                  <Award className="w-5 h-5 text-loom-gold" />
                  {isEnglish ? 'Certifications checklist' : 'प्रमाणपत्रों की सूची (Certifications Checklist)'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 font-body">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-4">
                    
                    {/* Handloom Mark Toggle Switch */}
                    <div className="flex items-center justify-between p-4 bg-white border border-loom-beige rounded-xl shadow-sm">
                      <div>
                        <span className="font-heading font-bold text-loom-wood text-base block">
                          {isEnglish ? 'Handloom Mark Certified' : t('schemes.certifications.handloomMark', 'हैंडलूम मार्क प्रमाणित')}
                        </span>
                        <span className="text-xs text-loom-ink-light mt-0.5 block">
                          {isEnglish
                            ? 'Confirms that this product is entirely handwoven on a handloom.'
                            : 'यह प्रमाणित करता है कि उत्पाद पूरी तरह से हथकरघा पर हाथ से बुना गया है।'}
                        </span>
                      </div>
                      <div className="relative inline-block w-12 h-6 select-none align-middle shrink-0">
                        <input 
                          type="checkbox" 
                          id="cert-handloom"
                          checked={certHandloomMark}
                          onChange={(e) => setCertHandloomMark(e.target.checked)}
                          className="opacity-0 absolute w-0 h-0 peer"
                        />
                        <label 
                          htmlFor="cert-handloom"
                          className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-loom-beige peer-checked:bg-loom-gold rounded-full transition-all duration-300 before:content-[''] before:absolute before:left-1 before:bottom-1 before:bg-white before:w-4 before:h-4 before:rounded-full before:transition-all peer-checked:before:translate-x-6"
                        />
                      </div>
                    </div>

                    {/* Udyam Registration Toggle Switch */}
                    <div className="flex items-center justify-between p-4 bg-white border border-loom-beige rounded-xl shadow-sm">
                      <div>
                        <span className="font-heading font-bold text-loom-wood text-base block">
                          {isEnglish ? 'Udyam Registration' : t('schemes.certifications.udyamRegistration', 'उद्यम पंजीकरण')}
                        </span>
                        <span className="text-xs text-loom-ink-light mt-0.5 block">
                          {isEnglish
                            ? 'Registered enterprise status under India’s Ministry of MSME.'
                            : 'भारत सरकार के एमएसएमई (MSME) मंत्रालय के तहत पंजीकृत उद्यम का दर्जा।'}
                        </span>
                      </div>
                      <div className="relative inline-block w-12 h-6 select-none align-middle shrink-0">
                        <input 
                          type="checkbox" 
                          id="cert-udyam"
                          checked={certUdyam}
                          onChange={(e) => setCertUdyam(e.target.checked)}
                          className="opacity-0 absolute w-0 h-0 peer"
                        />
                        <label 
                          htmlFor="cert-udyam"
                          className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-loom-beige peer-checked:bg-loom-gold rounded-full transition-all duration-300 before:content-[''] before:absolute before:left-1 before:bottom-1 before:bg-white before:w-4 before:h-4 before:rounded-full before:transition-all peer-checked:before:translate-x-6"
                        />
                      </div>
                    </div>

                    {/* GI Tag Toggle Switch */}
                    <div className="flex items-center justify-between p-4 bg-white border border-loom-beige rounded-xl shadow-sm">
                      <div>
                        <span className="font-heading font-bold text-loom-wood text-base block">
                          {isEnglish ? 'GI Tag Certified' : t('schemes.certifications.giTag', 'जीआई टैग प्रमाणित')}
                        </span>
                        <span className="text-xs text-loom-ink-light mt-0.5 block">
                          {isEnglish
                            ? 'Geographical Indication status, such as Banarasi Silk or Bhagalpuri Silk.'
                            : 'भौगोलिक संकेतक (Geographical Indication) - जैसे बनारसी रेशम, भगालपुरी सिल्क, आदि।'}
                        </span>
                      </div>
                      <div className="relative inline-block w-12 h-6 select-none align-middle shrink-0">
                        <input 
                          type="checkbox" 
                          id="cert-gitag"
                          checked={certGiTag}
                          onChange={(e) => setCertGiTag(e.target.checked)}
                          className="opacity-0 absolute w-0 h-0 peer"
                        />
                        <label 
                          htmlFor="cert-gitag"
                          className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-loom-beige peer-checked:bg-loom-gold rounded-full transition-all duration-300 before:content-[''] before:absolute before:left-1 before:bottom-1 before:bg-white before:w-4 before:h-4 before:rounded-full before:transition-all peer-checked:before:translate-x-6"
                        />
                      </div>
                    </div>

                  </div>

                  <div className="flex gap-4 pt-4 border-t border-loom-beige/50">
                    <button
                      type="button"
                      onClick={() => navigate('/secretary/schemes')}
                      className="flex-1 py-3.5 bg-white border-2 border-loom-wood text-loom-wood rounded-xl font-heading font-bold text-sm hover:bg-loom-cream transition-colors cursor-pointer"
                    >
                      {isEnglish ? 'Back' : 'पीछे जाएं (Back)'}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-3.5 bg-loom-wood hover:bg-loom-wood-light text-white rounded-xl font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? (isEnglish ? 'Saving...' : 'सहेजा जा रहा है...') : (isEnglish ? 'Save changes' : 'परिवर्तन सहेजें (Save Changes)')}
                    </button>
                  </div>

                </form>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </SecretaryLayout>
  );
};
