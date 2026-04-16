import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PinInput = ({ value, onChange, label, showPin }: { value: string[], onChange: (val: string[]) => void, label: string, showPin: boolean }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newValue = [...value];
    newValue[index] = val;
    onChange(newValue);
    if (val && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (value[index]) {
        const newValue = [...value];
        newValue[index] = '';
        onChange(newValue);
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1 text-left">{label}</label>
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type={showPin ? "text" : "password"}
            maxLength={1}
            value={value[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-14 h-14 text-center rounded-2xl text-black font-black text-xl outline-none bg-white/80 backdrop-blur-md border border-white/80 shadow-sm focus:ring-2 focus:ring-black transition-all"
          />
        ))}
      </div>
    </div>
  );
};

export function SafetyPinSetup({ onComplete, setPin: setPinProp, t }: { onComplete: () => void, setPin: (pin: string) => void, t: (key: string) => string }) {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState<string[]>(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSetPin = () => {
    const pinStr = pin.join('');
    const confirmPinStr = confirmPin.join('');
    setError(null);
    if (pinStr.length !== 4) {
      setError(t("Please enter a 4-digit PIN."));
      return;
    }
    if (pinStr !== confirmPinStr) {
      setError(t("PINs do not match."));
      return;
    }
    setPinProp(pinStr);
    onComplete();
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] p-8 items-center justify-center text-gray-900 text-center relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full max-w-xs">
        <h2 className="text-3xl font-black mb-2 tracking-tighter">{t("Create new PIN")}</h2>
        <p className="mb-10 text-xs text-gray-500 font-medium leading-relaxed">{t("Please create a 4-digit PIN that will be used to access your account")}</p>
        
        <div className="space-y-6">
          <PinInput value={pin} onChange={setPin} label={t("Enter PIN")} showPin={showPin} />
          <PinInput value={confirmPin} onChange={setConfirmPin} label={t("Confirm PIN")} showPin={showPin} />
          
          {error && (
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{error}</p>
          )}

          <button type="button" onClick={() => setShowPin(!showPin)} className="flex items-center justify-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest mt-4 mx-auto hover:text-black transition-colors">
            {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPin ? t("Hide PIN") : t("Show PIN")}
          </button>
        </div>

        <button onClick={handleSetPin} className="mt-12 bg-black text-white w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          {t("Create PIN")}
        </button>
      </div>
    </div>
  );
}
