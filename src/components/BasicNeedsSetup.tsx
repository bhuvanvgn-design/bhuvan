import React, { useState } from 'react';
import { User, Phone, Mail, ArrowRight, Shield, MapPin, Bell, Lock, Settings, Users, AlertTriangle, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BasicNeedsData {
  name: string;
  phone: string;
  userPhone: string; // For guardian verification
  gender: string;
  emergencyDetails: string;
  emergencyContact: string;
  emergencyPhone: string;
  locationEnabled: boolean;
  sosTrigger: string;
  privacyAccepted: boolean;
  language: string;
}

interface BasicNeedsSetupProps {
  onComplete: (data: BasicNeedsData, setError: (error: string) => void) => void;
  onGoogleLogin: () => void;
  t: (key: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  role: string | null;
}

export const BasicNeedsSetup: React.FC<BasicNeedsSetupProps> = ({ onComplete, onGoogleLogin, t, language, setLanguage, role }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BasicNeedsData>({
    name: '',
    phone: '',
    userPhone: '',
    gender: '',
    emergencyDetails: '',
    emergencyContact: '',
    emergencyPhone: '',
    locationEnabled: true,
    sosTrigger: 'Power Button 3x',
    privacyAccepted: false,
    language: language,
  });

  const totalSteps = role === 'Guardian' ? 4 : 6;

  const nextStep = () => {
    setError(null);
    if (step === 1 && (!data.name || !data.phone)) {
      setError(t("Please fill in your name and phone number."));
      return;
    }
    
    if (role !== 'Guardian') {
      if (step === 2 && (!data.emergencyContact || !data.emergencyPhone)) {
        setError(t("Please fill in guardian details."));
        return;
      }
    }

    if (step === (role === 'Guardian' ? 3 : 5) && !data.privacyAccepted) {
      setError(t("Please accept the privacy policy."));
      return;
    }
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data, setError);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-500">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold">🧍‍♀️ {t("Personal Details")}</h3>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder={t("Full Name")}
                  className="w-full pl-12 pr-4 py-5 bg-white/60 backdrop-blur-md border border-white/80 rounded-[2rem] focus:ring-2 focus:ring-black outline-none font-medium shadow-sm"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder={t("Phone Number")}
                  className="w-full pl-12 pr-4 py-5 bg-white/60 backdrop-blur-md border border-white/80 rounded-[2rem] focus:ring-2 focus:ring-black outline-none font-medium shadow-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Female', 'Male', 'Other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setData({ ...data, gender: g })}
                    className={`py-4 rounded-2xl text-sm font-black transition-all border ${
                      data.gender === g ? 'bg-black text-white border-black shadow-xl' : 'bg-white/60 text-gray-400 border-white/80 backdrop-blur-sm'
                    }`}
                  >
                    {t(g)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        if (role === 'Guardian') {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                  <MapPin size={24} />
                </div>
                <h3 className="text-xl font-bold">📍 {t("Location & Safety")}</h3>
              </div>
              <div className="bg-white/60 backdrop-blur-md p-5 rounded-[2rem] flex items-center justify-between border border-white/80 shadow-sm">
                <div>
                  <p className="font-black text-gray-900">{t("Live Location Tracking")}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{t("Enable for real-time guardian updates")}</p>
                </div>
                <button
                  onClick={() => setData({ ...data, locationEnabled: !data.locationEnabled })}
                  className={`w-14 h-8 rounded-full transition-colors relative ${data.locationEnabled ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${data.locationEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold">👨‍👩‍👧 {t("User Phone Number")}</h3>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={data.userPhone}
                  onChange={(e) => setData({ ...data, userPhone: e.target.value })}
                  placeholder={t("User Phone Number")}
                  className="w-full pl-12 pr-4 py-5 bg-white/60 backdrop-blur-md border border-white/80 rounded-[2rem] focus:ring-2 focus:ring-black outline-none font-medium shadow-sm"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        if (role === 'Guardian') {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-bold">🔐 {t("Privacy & Permissions")}</h3>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t("We value your privacy. Your data is encrypted and only shared with your chosen guardians during emergencies.")}
                </p>
                <button
                  onClick={() => setData({ ...data, privacyAccepted: !data.privacyAccepted })}
                  className="flex items-center gap-3 text-left"
                >
                  <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${data.privacyAccepted ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                    {data.privacyAccepted && <Shield size={14} />}
                  </div>
                  <span className="text-sm font-medium">{t("I accept the Privacy Policy and Terms of Service")}</span>
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-bold">📍 {t("Location & Safety")}</h3>
            </div>
            <div className="bg-white/60 backdrop-blur-md p-5 rounded-[2rem] flex items-center justify-between border border-white/80 shadow-sm">
              <div>
                <p className="font-black text-gray-900">{t("Live Location Tracking")}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{t("Enable for real-time guardian updates")}</p>
              </div>
              <button
                onClick={() => setData({ ...data, locationEnabled: !data.locationEnabled })}
                className={`w-14 h-8 rounded-full transition-colors relative ${data.locationEnabled ? 'bg-black' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${data.locationEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        );
      case 4:
        if (role === 'Guardian') {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <Settings size={24} />
                </div>
                <h3 className="text-xl font-bold">⚙️ {t("App Preferences")}</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-medium">{t("Select Language")}</p>
                <div className="grid grid-cols-2 gap-3">
                  {['English', 'Hindi', 'Marathi'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`p-5 rounded-[2rem] border transition-all font-black text-sm shadow-sm ${
                        language === lang ? 'border-black bg-black text-white' : 'border-white/80 bg-white/60 backdrop-blur-md text-gray-500'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <Bell size={24} />
              </div>
              <h3 className="text-xl font-bold">⏱️ {t("SOS Settings")}</h3>
            </div>
            <div className="space-y-3">
              {['Power Button 3x', 'Voice Trigger', 'Shake Device'].map((trigger) => (
                <button
                  key={trigger}
                  onClick={() => setData({ ...data, sosTrigger: trigger })}
                  className={`w-full p-5 rounded-[2rem] text-left border transition-all shadow-sm ${
                    data.sosTrigger === trigger ? 'border-black bg-black text-white' : 'border-white/80 bg-white/60 backdrop-blur-md text-gray-500'
                  }`}
                >
                  <p className="font-bold">{t(trigger)}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold">🔐 {t("Privacy & Permissions")}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("We value your privacy. Your data is encrypted and only shared with your chosen guardians during emergencies.")}
              </p>
              <button
                onClick={() => setData({ ...data, privacyAccepted: !data.privacyAccepted })}
                className="flex items-center gap-3 text-left"
              >
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${data.privacyAccepted ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                  {data.privacyAccepted && <Shield size={14} />}
                </div>
                <span className="text-sm font-medium">{t("I accept the Privacy Policy and Terms of Service")}</span>
              </button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-bold">⚙️ {t("App Preferences")}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500 font-medium">{t("Select Language")}</p>
              <div className="grid grid-cols-2 gap-3">
                {['English', 'Hindi', 'Marathi'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`p-5 rounded-[2rem] border transition-all font-black text-sm shadow-sm ${
                      language === lang ? 'border-black bg-black text-white' : 'border-white/80 bg-white/60 backdrop-blur-md text-gray-500'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-6 border-b border-white/50 bg-white/40 backdrop-blur-xl z-10">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevStep} className={`text-gray-900 font-bold bg-white/60 backdrop-blur-sm p-2 rounded-full border border-white/80 shadow-sm ${step === 1 ? 'invisible' : ''}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i + 1 === step ? 24 : 6 }}
                className={`h-1.5 rounded-full transition-all ${
                  i + 1 === step ? 'bg-black' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="w-10" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{t("Setup Iris")}</h2>
      </div>

      <div className="flex-grow p-6 overflow-y-auto z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 space-y-4 bg-white/40 backdrop-blur-xl border-t border-white/50 shadow-2xl z-10">
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</motion.p>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={nextStep}
          className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3"
        >
          {step === totalSteps ? t("Finish Setup") : t("Continue")}
          <ArrowRight size={20} />
        </motion.button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-[#f4f4f2] px-3 text-gray-400">{t("Or")}</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoogleLogin}
          className="w-full bg-white/80 backdrop-blur-md border border-white/80 text-gray-800 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-sm transition-all"
        >
          <LogIn size={20} className="text-gray-400" />
          {t("Continue with Google")}
        </motion.button>
      </div>
    </div>
  );
};

const ChevronLeft = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);
