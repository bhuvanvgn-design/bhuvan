import React, { useState } from 'react';
import { User, Phone, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PersonalDetails {
  name: string;
  phone: string;
  email: string;
}

interface PersonalDetailsSetupProps {
  onComplete: (details: PersonalDetails) => void;
  t: (key: string) => string;
}

export const PersonalDetailsSetup: React.FC<PersonalDetailsSetupProps> = ({ onComplete, t }) => {
  const [details, setDetails] = useState<PersonalDetails>({
    name: '',
    phone: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (details.name && details.phone) {
      onComplete(details);
    } else {
      alert(t("Please fill in your name and phone number."));
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-8">
      <div className="mt-12 mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("Personal Details")}</h2>
        <p className="text-gray-500">{t("Please provide your basic information to get started.")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              placeholder={t("Full Name")}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="tel"
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
              placeholder={t("Phone Number")}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
              placeholder={t("Email Address (Optional)")}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 mt-auto"
        >
          {t("Continue")}
          <ArrowRight size={20} />
        </motion.button>
      </form>
    </div>
  );
};
