import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function VerifyPin({ onVerify, onCancel, t }: { onVerify: (pin: string) => void, onCancel: () => void, t: (key: string) => string }) {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newValue = [...pin];
    newValue[index] = val;
    setPin(newValue);
    if (val && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (pin[index]) {
        const newValue = [...pin];
        newValue[index] = '';
        setPin(newValue);
      }
    }
  };

  const handleVerify = () => {
    const pinStr = pin.join('');
    if (pinStr.length !== 4) {
      alert(t("Please enter a 4-digit PIN."));
      return;
    }
    onVerify(pinStr);
  };

  return (
    <div className="absolute inset-0 bg-pink-50 z-[60] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">{t("Verify PIN")}</h2>
      <p className="mb-8 text-sm opacity-70">{t("Please enter your 4-digit PIN to deactivate SOS.")}</p>
      
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type={showPin ? "text" : "password"}
            maxLength={1}
            value={pin[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-12 text-center rounded-xl text-pink-500 font-bold text-lg outline-none bg-white border border-pink-200"
          />
        ))}
        <button type="button" onClick={() => setShowPin(!showPin)} className="ml-2 text-pink-300">
          {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="flex gap-4 w-full max-w-xs">
        <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-full font-bold">{t("Cancel")}</button>
        <button onClick={handleVerify} className="flex-1 bg-pink-500 text-white py-3 rounded-full font-bold">{t("Verify")}</button>
      </div>
    </div>
  );
}
