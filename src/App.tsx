/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { useState, ChangeEvent, useEffect, useRef, MutableRefObject, Dispatch, SetStateAction } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Plus, MessageSquare, MapPin, Users, Navigation, Shield, Hospital, Home, Search, User, Mic, Edit2, ChevronRight, ChevronLeft, CheckCircle, Languages, Settings, Palette, PhoneCall, Wifi, HelpCircle, Info, MessageCircle, Upload, Camera, Globe, AlertTriangle, Bell, History, LogOut, Play, Clock, Eye, ExternalLink, Phone } from 'lucide-react';
import { auth, db, storage, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, onSnapshot, query, where, addDoc, updateDoc, Timestamp, serverTimestamp, arrayUnion, collectionGroup } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SafetyPinSetup } from './components/SafetyPinSetup';
import { ChatView } from './components/ChatView';
import { BasicNeedsSetup } from './components/BasicNeedsSetup';
import { VerifyPin } from './components/VerifyPin';
import { VoiceAssistant } from './components/VoiceAssistant';
import { ContactModal } from './components/ContactModal';
import { NearbyPlacesView } from './components/NearbyPlacesView';
import { THEMES } from './constants';

const getSlides = (t: (key: string) => string) => {
  const slides = [
    { title: t("Your Safety, Our Priority."), description: t("Hey there! Welcome to Iris. Empower yourself with tools designed to keep you safe, informed, and connected anytime, anywhere."), image: "https://picsum.photos/seed/anime-safety/400/600" },
    { title: t("Real-time Location"), description: t("Share your location with trusted contacts instantly when you feel unsafe."), image: "https://picsum.photos/seed/anime-location/400/600" },
    { title: t("Emergency Alerts"), description: t("Send SOS alerts to your emergency contacts with a single tap."), image: "https://picsum.photos/seed/anime-emergency/400/600" },
    { title: t("Stay Connected"), description: t("Keep your loved ones updated and stay connected wherever you go."), image: "https://picsum.photos/seed/anime-connected/400/600" },
    { title: t("Extra Powerful Features"), description: t("Voice-trigger SOS, Wearable integration, and AI danger zone alerts."), image: "https://picsum.photos/seed/anime-power/400/600" }
  ];
  return slides;
};

function EmergencyHelplineView({ onBack, t }: { onBack: () => void, t: (key: string) => string }) {
  const numbers = [
    { number: "112", label: t("Local Police"), icon: "👮" },
    { number: "181", label: t("Women helpline"), icon: "👩" },
    { number: "108", label: t("Local Ambulance"), icon: "🚑" },
    { number: "101", label: t("Fire & Rescue Services"), icon: "🔥" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-6 text-gray-800 flex items-center gap-4 z-10">
        <button onClick={onBack} className="text-gray-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">←</button>
        <h2 className="text-2xl font-bold text-gray-900">{t("Emergency Helpline")}</h2>
      </div>
      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 overflow-y-auto space-y-4 border-t border-white/50 shadow-2xl z-10">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 px-2">{t("Help line numbers")}</p>
        {numbers.map((item, i) => (
          <motion.a 
            key={i} 
            whileHover={{ scale: 1.02, x: 5 }}
            href={`tel:${item.number}`} 
            className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] shadow-sm flex items-center justify-between cursor-pointer border border-white/80 transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">{item.icon}</div>
              <div>
                <p className="font-black text-xl text-gray-900">{item.number}</p>
                <p className="text-xs text-gray-500 font-bold">{item.label}</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg">
              <PhoneCall size={20} />
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

function RoleSelectionView({ onComplete, t }: { onComplete: (role: string) => void, t: (key: string) => string }) {
  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] p-8 justify-center items-center text-center relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full space-y-8"
      >
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-pink-200 rounded-full blur-2xl opacity-50" />
          <Shield size={80} className="text-black relative z-10 mx-auto" strokeWidth={1.5} />
        </div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">{t("Choose your role")}</h2>
        <div className="space-y-4 w-full">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete("User")} 
            className="w-full bg-black text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl border border-black"
          >
            {t("User")}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete("Guardian")} 
            className="w-full bg-white/60 backdrop-blur-md text-gray-800 py-6 rounded-[2rem] font-black text-xl border border-white/80 shadow-sm"
          >
            {t("Guardian")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function SOSView({ onBack, t }: { onBack: () => void, t: (key: string) => string }) {
  return (
    <div className="flex flex-col h-full bg-[#fef2f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-red-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-red-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-6 z-10">
        <button onClick={onBack} className="text-red-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">← Back</button>
        <h2 className="text-3xl font-black text-red-900 mt-4 tracking-tighter">🚨 SOS Emergency</h2>
      </div>
      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 space-y-6 border-t border-white/50 shadow-2xl z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-sm border border-white/80 space-y-2"
        >
          <p className="text-xs text-red-500 font-black uppercase tracking-widest">Current Status</p>
          <p className="text-lg font-black text-gray-900">Live Location: 12.9716° N, 77.5946° E</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Time of alert: {new Date().toLocaleTimeString()}</p>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="tel:112" 
            className="bg-red-600 text-white p-6 rounded-[2rem] text-center font-black text-sm shadow-xl flex flex-col items-center gap-2"
          >
            <Shield size={24} />
            Call Police
          </motion.a>
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="tel:999" 
            className="bg-black text-white p-6 rounded-[2rem] text-center font-black text-sm shadow-xl flex flex-col items-center gap-2"
          >
            <User size={24} />
            Call User
          </motion.a>
        </div>
        <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100 text-center">
          <p className="text-xs text-red-600 font-bold leading-relaxed">
            Emergency services and your trusted contacts have been notified. Stay where you are if safe.
          </p>
        </div>
      </div>
    </div>
  );
}

function LiveLocationView({ onBack, t }: { onBack: () => void, t: (key: string) => string }) {
  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-pink-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-6 z-10">
        <button onClick={onBack} className="text-gray-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">← Back</button>
        <h2 className="text-3xl font-black text-gray-900 mt-4 tracking-tighter">📍 Live Location</h2>
      </div>
      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 flex flex-col gap-6 border-t border-white/50 shadow-2xl z-10">
        <div className="flex-grow bg-black rounded-[2.5rem] flex items-center justify-center text-white/20 font-black uppercase tracking-widest text-xs shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[url('https://api.dicebear.com/9.x/shapes/svg?seed=map')] bg-cover" />
          <span className="relative z-10">Map View</span>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest px-2">{t("Location History (Last 24h)")}</p>
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] border border-white/80 shadow-sm space-y-3">
            {[
              { time: "10:00 AM", loc: "Home" },
              { time: "12:00 PM", loc: "Work" },
              { time: "02:00 PM", loc: "Park" }
            ].map((h, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold">{h.time}</span>
                <span className="text-gray-900 font-black">{h.loc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartAlertsView({ onBack, t }: { onBack: () => void, t: (key: string) => string }) {
  const alerts = [
    { title: "Low battery", description: "User's phone is below 15%", icon: "🔋", color: "bg-orange-50 text-orange-500" },
    { title: "Phone switched off", description: "User's phone was switched off at 10:00 PM", icon: "📴", color: "bg-red-50 text-red-500" },
    { title: "Internet disconnected", description: "User's internet connection lost", icon: "🌐", color: "bg-blue-50 text-blue-500" },
    { title: "Check-in missed", description: "User missed their 9:00 AM check-in", icon: "⏰", color: "bg-purple-50 text-purple-500" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-6 z-10">
        <button onClick={onBack} className="text-gray-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">← Back</button>
        <h2 className="text-3xl font-black text-gray-900 mt-4 tracking-tighter flex items-center gap-3">
          <Bell className="text-primary" /> Smart Alerts
        </h2>
      </div>
      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 space-y-4 overflow-y-auto border-t border-white/50 shadow-2xl z-10">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 px-2">Recent Notifications</p>
        {alerts.map((alert, i) => (
          <motion.div 
            key={i} 
            whileHover={{ scale: 1.02, x: 5 }}
            className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] flex items-center gap-5 border border-white/80 shadow-sm transition-all"
          >
            <div className={`w-14 h-14 ${alert.color} rounded-2xl flex items-center justify-center text-3xl shadow-inner`}>{alert.icon}</div>
            <div>
              <p className="font-black text-gray-900">{alert.title}</p>
              <p className="text-xs text-gray-500 font-medium">{alert.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TrackMeView({ onBack, t }: { onBack: () => void, t: (key: string) => string }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const handleStartNavigation = () => {
    if (!origin || !destination) {
      alert("Please enter both your current location and destination.");
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-6 text-gray-800 z-10">
        <button onClick={onBack} className="mb-4 text-gray-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">← Back</button>
        <h2 className="text-3xl font-bold text-gray-900">Track Me</h2>
        <p className="text-xs text-gray-500 font-medium mt-1">Track Me ensure your loved ones can monitor your location in real-time.</p>
      </div>
      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 flex flex-col gap-4 relative overflow-hidden border-t border-white/50 shadow-2xl z-10">
        {/* Card with Inputs and Travel Modes */}
        <div className="bg-white/70 backdrop-blur-md p-4 rounded-[2rem] shadow-sm border border-white/80 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
              <MapPin size={18} className="text-blue-500" />
              <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full text-sm outline-none bg-transparent font-medium" placeholder="Enter your current location" />
            </div>
            <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
              <MapPin size={18} className="text-red-500" />
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full text-sm outline-none bg-transparent font-medium" placeholder="Enter destination" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-400 bg-gray-100/50 p-2 rounded-xl">
            <span className="flex items-center gap-1">🚗 2 min</span>
            <span className="flex items-center gap-1">🚶 3 min</span>
            <span className="flex items-center gap-1">🚲 2 min</span>
          </div>
        </div>

        {/* Map Placeholder */}
        <motion.div 
          whileHover={{ scale: 0.98 }}
          className="flex-grow bg-black rounded-[2.5rem] flex flex-col items-center justify-center text-gray-500 relative cursor-pointer overflow-hidden shadow-2xl" 
          onClick={handleStartNavigation}
        >
          <div className="absolute inset-0 opacity-40 bg-[url('https://api.dicebear.com/9.x/shapes/svg?seed=map')] bg-cover" />
          <p className="relative z-10 font-bold text-white/50 uppercase tracking-widest text-xs">Map View (Click to Navigate)</p>
          <div className="absolute top-6 left-6 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg z-10">3 MIN</div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="mt-6 bg-white text-black px-8 py-3 rounded-full font-black text-xs shadow-2xl relative z-10"
          >
            START NAVIGATION
          </motion.button>
        </motion.div>

        {/* Bottom Nav + SOS Button */}
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-[2rem] flex justify-between items-center border border-white/80 shadow-sm">
          <Home size={20} className="text-gray-400" />
          <MapPin size={20} className="text-primary" />
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="bg-red-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center font-black text-[10px]"
          >
            SOS
          </motion.div>
          <Users size={20} className="text-gray-400" />
          <User size={20} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function ProfileView({ onBack, language, setLanguage, t, onHelpLineClick, contacts, setContacts, theme, setTheme, setShowContactModal, personalDetails, googleUser, onGoogleLogin, onGoogleLogout }: { onBack: () => void, language: string, setLanguage: (l: string) => void, t: (key: string) => string, onHelpLineClick: () => void, contacts: { name: string, phone: string }[], setContacts: (contacts: { name: string, phone: string }[]) => void, theme: { name: string, primary: string }, setTheme: (theme: { name: string, primary: string }) => void, setShowContactModal: (show: boolean) => void, personalDetails: { name: string, phone: string, email: string } | null, googleUser: any, onGoogleLogin: () => void, onGoogleLogout: () => void }) {
  const [showLanguages, setShowLanguages] = useState(false);
  const [showManageFriends, setShowManageFriends] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showAiPhotosRemover, setShowAiPhotosRemover] = useState(false);
  const [showLocationScanner, setShowLocationScanner] = useState(false);
  const [locationScanning, setLocationScanning] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentAiStep, setCurrentAiStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'none' | 'clean' | 'detected'>('none');
  const [foundLinks, setFoundLinks] = useState<string[]>([]);
  const languages = ["English", "Hindi", "Kannada", "Marathi", "Tamil", "Telugu"];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setCurrentAiStep(1);
      setScanning(true);
      setScanResult('none');
      setFoundLinks([]);
      // Simulate scan
      setTimeout(() => {
        setScanning(false);
        // Consistently 'detected' for prototype to show all steps
        setScanResult('detected');
        setFoundLinks([
          "https://www.google.com/search?q=similar+images+found+online",
          "https://www.bing.com/visualsearch",
          "https://yandex.com/images/search"
        ]);
      }, 3000);
    }
  };

  const handleFindMyLocation = () => {
    setShowLocationScanner(true);
    setLocationScanning(true);
    setCurrentLocation(null);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError(t("Geolocation is not supported by this browser."));
      setLocationScanning(false);
      return;
    }

    const successCallback = (position: GeolocationPosition) => {
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setTimeout(() => setLocationScanning(false), 300);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error.code, error.message);
      
      if (error.code === 3) { // Timeout
        navigator.geolocation.getCurrentPosition(
          successCallback,
          (finalErr) => {
            setLocationScanning(false);
            setLocationError(t("Location request timed out. Please check your GPS settings."));
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocationScanning(false);
        setLocationError(t("Location permission denied or unavailable."));
      }
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const resetAiRemover = () => {
    setShowAiPhotosRemover(false);
    setCurrentAiStep(0);
    setFile(null);
    setPreviewUrl(null);
    setScanning(false);
    setScanResult('none');
    setFoundLinks([]);
  };

  const handleResetSystem = () => {
    if (confirm(t("Are you sure you want to reset the whole system? This will clear all data and sign you out."))) {
      localStorage.clear();
      onGoogleLogout();
      window.location.reload();
    }
  };

  const menuItems = [
    { icon: Users, label: t("Manage Friends"), action: () => setShowManageFriends(true) },
    { icon: Languages, label: t("Change language"), action: () => setShowLanguages(true) },
    { icon: Palette, label: t("Customise / Themes"), action: () => setShowThemes(true) },
    { icon: AlertTriangle, label: t("Reset whole system"), action: handleResetSystem },
  ];
  const moreItems = [
    { icon: PhoneCall, label: t("Help Line numbers"), action: onHelpLineClick },
    { icon: MapPin, label: t("Find my location"), action: handleFindMyLocation },
    { icon: Wifi, label: t("AI Photos Remover"), action: () => setShowAiPhotosRemover(true) },
    { icon: HelpCircle, label: t("Help & support"), action: () => setShowHelpSupport(true) },
    { icon: Info, label: t("About us"), action: () => setShowAboutUs(true) },
  ];

  if (showLocationScanner) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6 bg-white shadow-sm border-b border-gray-100">
          <button onClick={() => setShowLocationScanner(false)} className="mb-4 text-primary font-bold flex items-center gap-1">← {t("Back")}</button>
          <h2 className="text-3xl font-bold">{t("Find my location")}</h2>
        </div>
        <div className="flex-grow p-6 flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-48 mb-8">
            {/* Radar/Scanning Animation */}
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
            <div className="absolute inset-4 bg-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin size={64} className="text-primary" />
            </div>
            {locationScanning && (
              <motion.div 
                className="absolute inset-0 border-2 border-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
          
          <h3 className="text-xl font-bold mb-2">
            {locationScanning ? t("Scanning location...") : locationError ? t("Error") : t("Location found")}
          </h3>
          
          {locationError && !locationScanning && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 p-6 rounded-2xl border border-red-100 w-full"
            >
              <p className="text-red-600 mb-6">{locationError}</p>
              <button 
                onClick={handleFindMyLocation}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2"
              >
                <History size={18} />
                {t("Try Again")}
              </button>
            </motion.div>
          )}
          
          {!locationScanning && currentLocation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">{t("Latitude")}</span>
                  <span className="font-mono font-bold text-primary">{currentLocation.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t("Longitude")}</span>
                  <span className="font-mono font-bold text-primary">{currentLocation.lng.toFixed(6)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={handleFindMyLocation}
                  className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <History size={18} />
                  {t("Refresh")}
                </button>
                <button 
                  onClick={() => {
                    const text = `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`;
                    navigator.clipboard.writeText(text);
                    alert(t("Coordinates copied!"));
                  }}
                  className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <Plus size={18} />
                  {t("Copy")}
                </button>
              </div>
              
              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`, '_blank')}
                className="w-full mt-3 bg-primary text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
              >
                <ExternalLink size={18} />
                {t("View on Map")}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (showManageFriends) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6 bg-white shadow-sm border-b border-gray-100">
          <button onClick={() => setShowManageFriends(false)} className="mb-4 text-primary font-bold flex items-center gap-1">← {t("Back")}</button>
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-bold">{t("Manage Friends")}</h2>
            <span className="text-sm text-gray-400 font-medium pb-1">{contacts.length} {t("Friends")}</span>
          </div>
        </div>
        <div className="flex-grow p-6 space-y-4 overflow-y-auto">
          {contacts.map((c, i) => (
            <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center font-bold text-primary text-xl">
                  {c.name[0]}
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a 
                  href={`tel:${c.phone}`}
                  className="text-primary font-bold bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-full text-sm transition-colors"
                >
                  {t("Call")}
                </a>
                <button 
                  onClick={() => setContacts(contacts.filter((_, index) => index !== i))} 
                  className="text-red-500 font-bold bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-full text-sm transition-colors"
                >
                  {t("Delete")}
                </button>
              </div>
            </div>
          ))}
          <button 
            onClick={() => setShowContactModal(true)}
            className="w-full mt-6 bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-md hover:bg-primary/90 transition-all active:scale-95"
          >
            {t("Add Friend +")}
          </button>
        </div>
      </div>
    );
  }

  if (showHelpSupport) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6 bg-white shadow-sm border-b border-gray-100">
          <button onClick={() => setShowHelpSupport(false)} className="mb-4 text-primary font-bold flex items-center gap-1">← {t("Back")}</button>
          <h2 className="text-3xl font-bold">{t("Help & support")}</h2>
        </div>
        <div className="flex-grow p-6 space-y-4 overflow-y-auto">
          <p className="text-gray-600">{t("If you need any help, please contact our support team at support@example.com or call us at 1800-123-4567.")}</p>
        </div>
      </div>
    );
  }

  if (showAboutUs) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6 bg-white shadow-sm border-b border-gray-100">
          <button onClick={() => setShowAboutUs(false)} className="mb-4 text-primary font-bold flex items-center gap-1">← {t("Back")}</button>
          <h2 className="text-3xl font-bold">{t("About us")}</h2>
        </div>
        <div className="flex-grow p-6 space-y-4 overflow-y-auto">
          <h3 className="font-bold text-lg">About Us</h3>
          <p className="text-gray-600">At Women Safety, our mission is simple yet powerful — to create a safer world for women through technology. We believe that every woman deserves to feel secure, confident, and supported wherever she goes.</p>
          <p className="text-gray-600">Our app is designed to provide quick and reliable assistance during emergencies. With features like real-time location sharing, instant SOS alerts, and emergency contact notifications, we aim to ensure help is always just a tap away.</p>
          <p className="text-gray-600">We understand that safety is not just about reacting to danger, but also about prevention and awareness. That’s why we continuously work on improving our platform with smart features, user-friendly design, and reliable performance.</p>
          <p className="text-gray-600">Our team is passionate about using innovation to empower women and strengthen communities. We are committed to protecting user privacy and ensuring that all personal data is handled securely and responsibly.</p>
          <p className="text-gray-600">Together, we can build a safer and more supportive environment for everyone.</p>
          <p className="font-bold">Stay Safe. Stay Strong.</p>
        </div>
      </div>
    );
  }

  if (showAiPhotosRemover) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={resetAiRemover} className="text-primary font-bold">←</button>
            <h2 className="text-xl font-bold">{t("AI Photos Remover")}</h2>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((s) => (
              <div key={s} className={`w-2 h-2 rounded-full ${currentAiStep >= s ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="flex-grow p-6 flex flex-col overflow-y-auto">
          {/* Constant Preview after upload */}
          {previewUrl && (
            <div className="mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
              {file?.type.startsWith('video') ? (
                <video src={previewUrl} className="w-full h-40 object-cover rounded-xl" controls />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl" referrerPolicy="no-referrer" />
              )}
              <p className="text-xs text-gray-500 mt-2 text-center truncate px-2">{file?.name}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentAiStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg mb-4">{t("Step 1: Upload Image or Video")}</h3>
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 font-semibold">{t("Click to upload or drag and drop")}</p>
                        <p className="text-xs text-gray-400">{t("Supports gallery or camera input")}</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                    </label>
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                      <Shield className="w-5 h-5" />
                      <p className="text-sm font-medium">{t("Your data is सुरक्षित (secure) and not stored without consent")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentAiStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center flex-grow"
              >
                <div className="relative w-full aspect-square max-w-sm bg-black rounded-3xl overflow-hidden shadow-2xl mb-8">
                  {previewUrl && (
                    <img src={previewUrl} alt="Scanning" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                  )}
                  {/* Google Lens style scanning overlay */}
                  <motion.div 
                    className="absolute inset-x-0 h-1 bg-primary/80 shadow-[0_0_15px_rgba(255,105,180,0.8)] z-10"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-white rounded-full shadow-lg"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{t("Analyzing Visual Patterns")}</h3>
                <p className="text-gray-500 text-center px-6 mb-8">{t("Identifying objects, metadata, and potential manipulations...")}</p>
                
                {!scanning && (
                  <button
                    onClick={() => setCurrentAiStep(2)}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    {t("View Results & Take Action")}
                  </button>
                )}
              </motion.div>
            )}

            {currentAiStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pb-12"
              >
                {/* AI Safety Banner */}
                <div className={`p-4 rounded-2xl shadow-sm border flex items-center gap-4 ${scanResult === 'clean' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${scanResult === 'clean' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {scanResult === 'clean' ? <Shield className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-sm ${scanResult === 'clean' ? 'text-green-700' : 'text-red-700'}`}>
                      {scanResult === 'clean' ? t("Safe Content") : t("Deepfake Detected")}
                    </p>
                    <p className="text-xs text-gray-500">{t("Analysis complete")}</p>
                  </div>
                </div>

                {scanResult === 'detected' && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      {t("Report & Remove Content")}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {t("Take immediate action to protect your privacy. Use the official government portal to report and request removal.")}
                    </p>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <a 
                          href="https://cybercrime.gov.in/" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-full bg-red-600 text-white py-4 px-4 rounded-2xl font-bold text-center block hover:bg-red-700 shadow-lg transition-all"
                        >
                          {t("Report Cyber Crime / Deepfake")}
                        </a>
                        
                        <a 
                          href="tel:1930" 
                          className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl hover:border-red-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <PhoneCall className="w-6 h-6 text-red-600" />
                            <div className="text-left">
                              <p className="font-bold text-sm text-red-700">{t("Call 1930")}</p>
                              <p className="text-xs text-red-600/70">{t("Cyber Crime Helpline")}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-red-400" />
                        </a>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <a 
                          href="https://stopncii.org/" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-primary transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-primary" />
                            <div className="text-left">
                              <p className="font-bold text-sm">StopNCII.org</p>
                              <p className="text-xs text-gray-500">{t("Prevent Non-Consensual Image Sharing")}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={resetAiRemover}
                  className="w-full bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-lg"
                >
                  {t("Finish Process")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (showThemes) {
    return (
      <div className="flex flex-col h-full bg-white p-6">
        <button onClick={() => setShowThemes(false)} className="mb-4 text-primary font-bold">← {t("Back")}</button>
        <h2 className="text-2xl font-bold mb-6">{t("Customise / Themes")}</h2>
        <div className="grid grid-cols-2 gap-4">
          {THEMES.map((tItem, i) => (
            <button key={i} onClick={() => setTheme(tItem)} className={`p-4 rounded-xl flex items-center gap-3 border-2 ${theme.name === tItem.name ? 'border-primary' : 'border-transparent'} bg-gray-50`}>
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tItem.primary }} />
              <span className="font-bold">{tItem.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (showLanguages) {
    return (
      <div className="flex flex-col h-full bg-white p-6">
        <button onClick={() => setShowLanguages(false)} className="mb-4 text-primary font-bold">← {t("Back")}</button>
        <h2 className="text-2xl font-bold mb-6">{t("Select Language")}</h2>
        {languages.map(lang => (
          <div key={lang} className="flex justify-between items-center py-4 border-b border-gray-100 cursor-pointer" onClick={() => { setLanguage(lang); setShowLanguages(false); alert(`Language changed to ${lang}`); }}>
            <span className={language === lang ? "font-bold text-primary" : ""}>{lang}</span>
            {language === lang && <div className="w-4 h-4 bg-primary rounded-full" />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-6 text-gray-800 flex flex-col items-center gap-4 z-10">
        <div className="flex justify-between w-full items-center">
          <button onClick={onBack} className="text-gray-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">Back</button>
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-white/50">
            <Edit2 size={20} className="text-primary" />
          </motion.div>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-primary font-bold text-4xl shadow-xl border-4 border-white/50"
        >
          {personalDetails?.name ? personalDetails.name[0] : 'L'}
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{personalDetails?.name || t("Lucy")}</h2>
          {personalDetails?.phone && <p className="text-xs text-gray-500 font-mono mt-1">{personalDetails.phone}</p>}
        </div>
      </div>
      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 overflow-y-auto space-y-6 border-t border-white/50 shadow-2xl z-10">
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 px-2">{t("Preferences")}</p>
          <div className="space-y-2">
            {menuItems.map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.8)' }}
                className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 cursor-pointer transition-all" 
                onClick={item.action}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-primary">
                    <item.icon size={20} />
                  </div>
                  <span className="font-bold text-gray-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.label === t("Change language") && <span className="text-xs text-gray-500 font-bold">{language}</span>}
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 px-2">{t("More")}</p>
          <div className="space-y-2">
            {moreItems.map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.8)' }}
                className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 cursor-pointer transition-all" 
                onClick={item.action}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                    <item.icon size={20} />
                  </div>
                  <span className="font-bold text-gray-800">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareLocationView({ onBack, t, googleUser }: { onBack: () => void, t: (key: string) => string, googleUser: any }) {
  const [mode, setMode] = useState<'options' | 'time-selection' | 'live-sharing'>('options');

  useEffect(() => {
    if (mode === 'live-sharing' && googleUser?.uid) {
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            await setDoc(doc(db, 'users', googleUser.uid, 'location', 'current'), {
              userId: googleUser.uid,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              updatedAt: serverTimestamp(),
              isSharing: true
            });
          } catch (error) {
            console.error("Location sync error:", error);
          }
        });
      }, 10000); // Update every 10 seconds

      return () => {
        clearInterval(interval);
        // Stop sharing on cleanup
        setDoc(doc(db, 'users', googleUser.uid, 'location', 'current'), {
          isSharing: false,
          updatedAt: serverTimestamp()
        }, { merge: true });
      };
    }
  }, [mode, googleUser]);

  if (mode === 'live-sharing') {
    return (
      <div className="flex flex-col h-full bg-primary">
        <div className="p-6 text-white">
          <button onClick={() => setMode('options')} className="mb-2 text-sm opacity-80">← Back</button>
          <h2 className="text-3xl font-bold">{t("Live Sharing")}</h2>
        </div>
        <div className="flex-grow bg-gray-50 rounded-t-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500">
            <MapPin size={40} />
          </div>
          <h3 className="text-xl font-bold">{t("Live location sharing active")}</h3>
          <p className="text-gray-600">{t("Your trusted contacts can see your live location.")}</p>
          <button onClick={onBack} className="bg-primary text-white px-8 py-3 rounded-full font-bold">{t("Stop sharing")}</button>
        </div>
      </div>
    );
  }

  if (mode === 'time-selection') {
    return (
      <div className="flex flex-col h-full bg-primary">
        <div className="p-6 text-white">
          <button onClick={() => setMode('options')} className="mb-2 text-sm opacity-80">← Back</button>
          <h2 className="text-3xl font-bold">{t("Set Duration")}</h2>
        </div>
        <div className="flex-grow bg-gray-50 rounded-t-[2rem] p-6 space-y-4">
          {[15, 30, 60, 120].map(d => (
            <button key={d} onClick={() => setMode('live-sharing')} className="w-full bg-white p-6 rounded-2xl shadow-sm text-left font-bold text-primary border-2 border-primary">
              {d} {t("minutes")}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-primary">
      <div className="p-6 text-white">
        <button onClick={onBack} className="mb-2 text-sm opacity-80">← Back</button>
        <h2 className="text-3xl font-bold">{t("Share Location")}</h2>
        <p className="text-sm opacity-90">{t("Choose how you want to share your location.")}</p>
      </div>
      <div className="flex-grow bg-gray-50 rounded-t-[2rem] p-6 space-y-4">
        <button onClick={() => setMode('time-selection')} className="w-full bg-white p-6 rounded-2xl shadow-sm text-left font-bold text-primary border-2 border-primary">{t("Time-based sharing")}</button>
        <button onClick={() => setMode('live-sharing')} className="w-full bg-white p-6 rounded-2xl shadow-sm text-left font-bold text-primary border-2 border-primary">{t("Live sharing")}</button>
      </div>
    </div>
  );
}

function CommunityView({ onBack, t }: { onBack: () => void, t: (key: string) => string }) {
  const [stories, setStories] = useState<{ id: number, image: string, title: string, description: string }[]>([
    { id: 1, image: "https://picsum.photos/seed/jhanvi/100/100", title: t("Rising from the Ashes: The Story of Jhanvi Singh"), description: t("Jhanvi Singh was once a vibrant young woman whose dreams were shattered after surviving a traumatic assault, leaving her struggling with fear and self-doubt. Determined not to let her pain define her, she sought therapy and began volunteering to support other survivors, finding strength in their shared resilience. Inspired by these stories, Jhanvi launched a tech startup, Phoenix Enterprises, creating innovative safety tools for women. See more") }
  ]);
  const [newStoryDescription, setNewStoryDescription] = useState("");

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newStory = {
          id: Date.now(),
          image: reader.result as string,
          title: t("My Story"),
          description: newStoryDescription || t("A new story uploaded by me.")
        };
        setStories([newStory, ...stories]);
        setNewStoryDescription("");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-6 text-gray-800 z-10">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="text-gray-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">←</button>
          <div className="flex gap-3">
            <input type="file" id="story-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
            <motion.label whileHover={{ scale: 1.1 }} htmlFor="story-upload" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-white/50 cursor-pointer text-primary">
              <Plus size={20} />
            </motion.label>
            <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-white/50 cursor-pointer text-gray-600">
              <Navigation size={20} />
            </motion.div>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">{t("My community")}</h2>
        <p className="text-xs text-gray-500 font-medium mt-1">{t("Our community is a safe, supportive, and empowering.")}</p>
      </div>
      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 space-y-6 overflow-y-auto border-t border-white/50 shadow-2xl z-10">
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-full flex items-center gap-3 shadow-sm border border-white/80">
          <Search size={20} className="text-gray-400" />
          <input type="text" placeholder={t("Search Legal women rights")} className="w-full text-sm outline-none bg-transparent font-medium" />
        </div>
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-full flex items-center gap-3 shadow-sm border border-white/80">
          <Edit2 size={20} className="text-primary" />
          <input type="text" placeholder={t("Write about your photo...")} value={newStoryDescription} onChange={(e) => setNewStoryDescription(e.target.value)} className="w-full text-sm outline-none bg-transparent font-medium" />
        </div>
        
        {stories.map(story => (
          <motion.div 
            key={story.id} 
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-md p-5 rounded-[2.5rem] shadow-sm border border-white/80 space-y-5 hover:shadow-xl transition-all"
          >
            <div className="flex gap-5">
              <img src={story.image} alt={story.title} className="rounded-[2rem] w-24 h-24 object-cover border-2 border-white/50 shadow-sm" referrerPolicy="no-referrer" />
              <div className="flex-1">
                <h3 className="font-bold text-lg leading-tight text-gray-900">{story.title}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Verified Story</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {story.description}
            </p>
            <div className="flex justify-between text-gray-400 pt-4 border-t border-gray-100">
              <motion.div whileHover={{ scale: 1.2, color: '#ec4899' }} className="cursor-pointer"><Users size={20} /></motion.div>
              <motion.div whileHover={{ scale: 1.2, color: '#ec4899' }} className="cursor-pointer"><MessageSquare size={20} /></motion.div>
              <motion.div whileHover={{ scale: 1.2, color: '#ec4899' }} className="cursor-pointer"><Navigation size={20} /></motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ChatBot({ onClose, onVoiceClick, t }: { onClose: () => void, onVoiceClick: () => void, t: (key: string) => string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: t("Hello! I'm your Legal Assistant. How can I support you today?") }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [chat] = useState(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }).chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: t("You are a knowledgeable legal assistant specializing in domestic violence laws and women's rights. Provide supportive, accurate, and empathetic legal information. Keep your answers concise and short. Always advise the user to seek professional legal counsel for their specific situation."),
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  }));

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: input });
      setMessages(prev => [...prev, { role: 'model', text: response.text || t("I'm sorry, I couldn't process that.") }]);
    } catch (error) {
      console.error("Gemini API error:", error);
      setMessages(prev => [...prev, { role: 'model', text: t("Sorry, I'm having trouble connecting to the service right now. Please try again later.") }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 bg-pink-500 text-white flex items-center gap-3 shadow-md">
        <button onClick={onClose} className="p-1"><ChevronRight className="rotate-180" /></button>
        <img src="https://picsum.photos/seed/lawyer/40/40" alt="Lawyer" className="w-10 h-10 rounded-full border-2 border-white" referrerPolicy="no-referrer" />
        <div>
          <h3 className="font-bold">{t("Legal Assistant")}</h3>
          <p className="text-xs opacity-80">{t("Online")}</p>
        </div>
        <button onClick={onVoiceClick} className="ml-auto p-2 bg-pink-600 rounded-full"><Mic size={20} /></button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl text-sm max-w-[80%] w-fit ${m.role === 'user' ? 'bg-pink-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl shadow-sm flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-white flex gap-2">
        <button onClick={toggleListening} className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          <Mic size={20} />
        </button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} className="flex-grow border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder={t("Type your question...")} />
        <button onClick={sendMessage} className="bg-pink-500 text-white rounded-full p-2">
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

function TrustedContactsChat({ onClose, t, contacts }: { onClose: () => void, t: (key: string) => string, contacts: { name: string, phone: string }[] }) {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<Record<string, { text: string, sender: 'user' | 'other' }[]>>({});
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const sendMessage = () => {
    if (!input.trim() || !selectedContact) return;
    setMessages(prev => ({
      ...prev,
      [selectedContact.name]: [...(prev[selectedContact.name] || []), { text: input, sender: 'user' }]
    }));
    setInput('');
  };

  if (selectedContact) {
    return (
      <div className="absolute inset-0 bg-white z-50 flex flex-col">
        <div className="p-4 bg-pink-500 text-white flex items-center gap-3">
          <button onClick={() => setSelectedContact(null)}><ChevronRight className="rotate-180" /></button>
          <h3 className="font-bold">{selectedContact.name}</h3>
        </div>
        <div className="flex-grow p-4 bg-gray-100 overflow-y-auto space-y-2">
          {(messages[selectedContact.name] || []).map((m, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm max-w-[80%] w-fit ${m.sender === 'user' ? 'bg-pink-500 text-white self-end ml-auto' : 'bg-pink-100 text-gray-800 self-start'}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} className="flex-grow border rounded-full px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder={t("Message...")} />
          <button onClick={sendMessage} className="bg-pink-500 text-white rounded-full p-2"><ArrowRight size={20} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 bg-pink-500 text-white font-bold flex justify-between items-center">
        <span>{t("Chats")}</span>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="p-2 bg-gray-100">
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full border rounded-full px-4 py-2 text-sm" placeholder={t("Search contacts...")} />
      </div>
      <div className="flex-grow">
        {filteredContacts.map((c, i) => (
          <div key={i} className="p-4 border-b flex items-center gap-3 cursor-pointer hover:bg-pink-50" onClick={() => setSelectedContact(c)}>
            <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center font-bold text-pink-700">{c.name[0]}</div>
            <div>
              <p className="font-bold">{c.name}</p>
              <p className="text-sm text-gray-500">{c.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuardianDashboard({ t, onSOSClick, onLiveLocationClick, onSmartAlertsClick, onExtraFeaturesClick, aiChatInput, setAiChatInput, setShowAIChat, sosRecordings, personalDetails, onChatClick, onWeeklySafetyCheck, firebaseUser }: { t: (key: string) => string, onSOSClick: () => void, onLiveLocationClick: () => void, onSmartAlertsClick: () => void, onExtraFeaturesClick: () => void, aiChatInput: string, setAiChatInput: (val: string) => void, setShowAIChat: (show: boolean) => void, sosRecordings: any[], personalDetails: { name: string, phone: string, email: string } | null, onChatClick: (userId: string) => void, onWeeklySafetyCheck: (userId: string) => void, firebaseUser: any }) {
  // ... (rest of the component)
  // Inside the selected user view:
  // Add Chat button:
  // <button onClick={() => onChatClick(selectedUser.id)} className="bg-primary text-white p-4 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20">{t("Chat")}</button>
  // Add Weekly Safety Check button:
  // <button onClick={() => onWeeklySafetyCheck(selectedUser.id)} className="bg-blue-500 text-white p-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200">{t("Weekly Safety Check")}</button>
  const [guardingUsers, setGuardingUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [userSosEvents, setUserSosEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!firebaseUser) return;

    // Fetch the current guardian's phone number
    const fetchGuardianPhone = async () => {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const guardianPhone = userDoc.data().phone;
        console.log("Guardian phone:", guardianPhone);
        if (!guardianPhone) {
          console.log("Guardian phone is missing in user document");
          return;
        }

        const cleanPhone = guardianPhone.replace(/\s+/g, '');
        const matchPhone = cleanPhone.slice(-10);
        console.log("Clean guardian phone:", cleanPhone, "Match phone:", matchPhone);

        // Find users who have added this guardian's phone number as a trusted contact
        // The guardian enters the user's phone number in their dashboard to find them
        const q = query(collection(db, 'users'), where('phone', '==', matchPhone));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log("Query results count:", snapshot.size);
          const users: any[] = [];
          snapshot.forEach((docSnap) => {
            console.log("Found user doc:", docSnap.data());
            users.push({ id: docSnap.id, ...docSnap.data() });
          });
          setGuardingUsers(users);
        }, (error) => {
          console.error("Firestore query error:", error);
          handleFirestoreError(error, OperationType.LIST, 'users_collection');
        });

        return () => unsubscribe();
      }
    };
    
    fetchGuardianPhone();
  }, [firebaseUser]);

  useEffect(() => {
    if (!selectedUser) {
      setUserLocation(null);
      setUserSosEvents([]);
      return;
    }

    const locUnsub = onSnapshot(doc(db, 'users', selectedUser.id, 'location', 'current'), (docSnap) => {
      if (docSnap.exists()) {
        setUserLocation(docSnap.data());
      }
    });

    const sosUnsub = onSnapshot(collection(db, 'users', selectedUser.id, 'sos_events'), (snapshot) => {
      const events: any[] = [];
      snapshot.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
      setUserSosEvents(events.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()));
    });

    return () => {
      locUnsub();
      sosUnsub();
    };
  }, [selectedUser]);

  const filteredUsers = guardingUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.phone.includes(searchQuery)
  );

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] relative overflow-hidden font-sans">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-orange-100/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-50/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-8 pb-4 z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-4xl font-serif font-black text-gray-900 tracking-tight mb-1">{t("Hello")}</h2>
            <p className="text-2xl font-serif italic text-gray-500">{personalDetails?.name || "Guardian"}</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100"
          >
            <Bell size={24} className="text-gray-400" />
          </motion.button>
        </div>

        {!selectedUser && (
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder={t("Search users...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-[2rem] py-4 pl-12 pr-6 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex-grow p-8 pt-0 space-y-8 overflow-y-auto z-10">
        {!selectedUser ? (
          <>
            {/* Analytics Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4">
                <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{t("See your Analytics")}</h3>
              <p className="text-sm text-gray-500 mb-4">{t("Check how's your performance")}</p>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "70%" }}
                  className="h-full bg-gradient-to-r from-primary to-pink-400"
                />
              </div>
            </motion.div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 px-2">{t("Your users")}</h3>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-[3rem] border border-dashed border-gray-200">
                  <Users className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 font-medium">{t("No users found")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredUsers.map((u, i) => (
                    <motion.button 
                      key={u.id} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedUser(u)}
                      className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-start text-left gap-4 hover:shadow-xl transition-all"
                    >
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400 font-bold text-xl">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight mb-1">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{u.phone}</p>
                      </div>
                      <div className="mt-auto pt-2 w-full flex justify-between items-center">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Active</span>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 px-2">{t("Recent done tests")}</h3>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-400">
                    <Shield size={20} />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-sm text-gray-900">Weekly Safety Check</p>
                    <p className="text-[10px] text-gray-400">16 May, 2025</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <motion.button 
              whileHover={{ x: -5 }}
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-2 text-gray-500 font-bold bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm"
            >
              <ChevronLeft size={20} />
              {t("Back")}
            </motion.button>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-8"
            >
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-orange-400 text-4xl font-bold shadow-inner">
                  {selectedUser.name[0]}
                </div>
                <div className="flex-grow">
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500 font-mono tracking-wider">{selectedUser.phone}</p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChatClick(selectedUser.id)}
                    className="bg-primary text-white p-4 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20"
                  >
                    {t("Chat")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onWeeklySafetyCheck(selectedUser.id)}
                    className="bg-blue-500 text-white p-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200"
                  >
                    {t("Safety Check")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      // Activate SOS for the selected user
                      await addDoc(collection(db, 'users', selectedUser.id, 'sos_events'), {
                        timestamp: serverTimestamp(),
                        status: 'active',
                        location: 'Remote Activation',
                        type: 'guardian_triggered'
                      });
                      alert(t("SOS activated for user"));
                    }}
                    className="bg-red-500 text-white p-4 rounded-2xl font-bold text-sm shadow-lg shadow-red-200"
                  >
                    {t("Activate SOS")}
                  </motion.button>
                </div>
              </div>

              {userLocation && userLocation.isSharing ? (
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="bg-green-50 p-6 rounded-[2.5rem] border border-green-100 flex items-center gap-5"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-green-500 animate-pulse shadow-sm">
                    <MapPin size={32} />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-green-700 text-lg">{t("Live Location Active")}</p>
                    <p className="text-xs text-green-600/70 font-medium mb-3">
                      {t("Last updated")}: {userLocation.updatedAt?.toDate().toLocaleTimeString()}
                    </p>
                    <motion.a 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block bg-green-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg shadow-green-200"
                    >
                      {t("View on Google Maps")}
                    </motion.a>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-300">
                    <MapPin size={32} />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">{t("Location sharing is currently inactive")}</p>
                </div>
              )}
            </motion.div>

            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3 px-2">
                <History size={24} className="text-primary" />
                {t("SOS History")}
              </h4>
              {userSosEvents.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] text-center border border-gray-100 shadow-sm">
                  <p className="text-gray-400 italic font-medium">{t("No SOS events recorded.")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userSosEvents.map((event, i) => (
                    <motion.div 
                      key={event.id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4 hover:shadow-xl transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                            <AlertTriangle size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{event.timestamp?.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{event.location}</p>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${event.status === 'active' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-green-500 text-white shadow-lg shadow-green-100'}`}>
                          {event.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {event.videoUrl && (
                        <motion.a 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={event.videoUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full bg-gray-900 text-white p-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-xl"
                        >
                          <Play size={18} />
                          {t("Play Video/Audio")}
                        </motion.a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="p-6 pt-2 z-10 bg-white/80 backdrop-blur-xl border-t border-gray-100">
        <div className="flex justify-around items-center">
          <motion.button whileTap={{ scale: 0.9 }} className="text-gray-900"><Home size={24} /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className="text-gray-300"><MessageSquare size={24} /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className="text-gray-300"><CheckCircle size={24} /></motion.button>
          <motion.div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 shadow-inner" />
        </div>
      </div>
    </div>
  );
}
function Dashboard({ onProfileClick, onTrackMeClick, onShareLocationClick, onCommunityClick, onExtraFeaturesClick, onNearbyPlacesClick, t, pin, contacts, handleAddContact, showContactModal, setShowContactModal, personalDetails, sosRecordings, setSosRecordings, mediaRecorderRef, googleUser }: { onProfileClick: () => void, onTrackMeClick: () => void, onShareLocationClick: () => void, onCommunityClick: () => void, onExtraFeaturesClick: () => void, onNearbyPlacesClick: (type: 'police' | 'hospital' | 'pharmacy') => void, t: (key: string) => string, pin: string, contacts: { name: string, phone: string }[], handleAddContact: (contact: { name: string, phone: string }) => void, showContactModal: boolean, setShowContactModal: (show: boolean) => void, personalDetails: { name: string, phone: string, email: string } | null, sosRecordings: { id: number; date: string; location: string; blob: Blob }[], setSosRecordings: Dispatch<SetStateAction<{ id: number; date: string; location: string; blob: Blob }[]>>, mediaRecorderRef: MutableRefObject<MediaRecorder | null>, googleUser: any }) {
  const [showChat, setShowChat] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showTrustedChat, setShowTrustedChat] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [showVerifyPin, setShowVerifyPin] = useState(false);

  const handleSOS = async () => {
    setIsSOS(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const recordingId = Date.now();
        const dateStr = new Date().toLocaleString();
        
        setSosRecordings(prev => [...prev, { id: recordingId, date: dateStr, location: "Current Location", blob }]);
        
        // Upload to Firebase if logged in
        if (googleUser?.uid) {
          try {
            const storageRef = ref(storage, `sos_recordings/${googleUser.uid}/${recordingId}.webm`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            
            await addDoc(collection(db, 'users', googleUser.uid, 'sos_events'), {
              id: recordingId.toString(),
              userId: googleUser.uid,
              timestamp: serverTimestamp(),
              location: "Current Location",
              videoUrl: downloadURL,
              audioUrl: downloadURL, // Same file contains both
              status: "active"
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${googleUser.uid}/sos_events`);
          }
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const handleCancelSOS = () => {
    setShowVerifyPin(true);
  };

  const handleVerifyPin = (enteredPin: string) => {
    if (enteredPin === pin) {
      setIsSOS(false);
      setShowVerifyPin(false);
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } else {
      alert(t("Incorrect PIN."));
    }
  };

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;
    let interval: NodeJS.Timeout | null = null;

    if (isSOS) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        oscillator = audioCtx!.createOscillator();
        gainNode = audioCtx!.createGain();
        
        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx!.destination);
        gainNode.gain.setValueAtTime(1, audioCtx!.currentTime);
        
        oscillator.start();
        
        // Simple siren loop
        interval = setInterval(() => {
          oscillator!.frequency.setValueAtTime(440, audioCtx!.currentTime);
          oscillator!.frequency.exponentialRampToValueAtTime(880, audioCtx!.currentTime + 0.5);
        }, 1000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (oscillator) oscillator.stop();
      if (audioCtx) audioCtx.close();
    };
  }, [isSOS]);

  const handleFindPlace = (placeType: string) => {
    onNearbyPlacesClick(placeType as any);
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[30%] h-[30%] bg-yellow-100/20 rounded-full blur-[80px] pointer-events-none" />

      {isSOS && (
        <div className="absolute inset-0 bg-pink-50 z-50 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-bold mb-8">{t("SOS Activated!")}</h2>
          <div className="text-8xl mb-8">🚨</div>
          <p className="text-xl font-semibold mb-2">{t("Connecting to command control centre")}</p>
          <p className="text-sm text-gray-600 mb-12">{t("Help is on the way, stay calm and stay safe.")}</p>
          <button onClick={handleCancelSOS} className="bg-primary text-white px-12 py-4 rounded-full text-xl font-bold shadow-lg">{t("Cancel")}</button>
        </div>
      )}
      {showVerifyPin && (
        <VerifyPin onVerify={handleVerifyPin} onCancel={() => setShowVerifyPin(false)} t={t} />
      )}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} onAdd={handleAddContact} googleUser={googleUser} />
      )}
      {/* Header */}
      <div className="p-6 text-gray-800 flex justify-between items-center cursor-pointer z-10" onClick={onProfileClick}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary font-bold shadow-sm border border-white/50">
            {personalDetails?.name ? personalDetails.name[0] : 'L'}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{t("Hey there,")}</p>
            <p className="font-bold text-lg text-gray-900">{personalDetails?.name || t("Lucy")}</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shadow-lg">
          <Mic size={20} />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 space-y-6 overflow-y-auto border-t border-white/50 shadow-2xl z-10">
        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }} 
            className="bg-white/60 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-white/80 flex flex-col items-center gap-3 cursor-pointer transition-all hover:shadow-xl hover:bg-white/80" 
            onClick={onExtraFeaturesClick}
          >
            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
              <History size={28} />
            </div>
            <span className="text-sm font-bold text-gray-800">{t("SOS History")}</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }} 
            className="bg-white/60 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-white/80 flex flex-col items-center gap-3 cursor-pointer transition-all hover:shadow-xl hover:bg-white/80" 
            onClick={onShareLocationClick}
          >
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
              <MapPin size={28} />
            </div>
            <span className="text-sm font-bold text-gray-800">{t("Share live location")}</span>
          </motion.div>
        </div>

        {/* Add Guardian Section */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white/70 backdrop-blur-md p-5 rounded-[2.5rem] shadow-sm border border-white/80 flex justify-between items-center hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
              <Shield size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">{t("Add Guardian")}</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{t("Import from Google or device")}</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold shadow-xl" 
            onClick={() => setShowContactModal(true)}
          >
            {t("Add +")}
          </motion.button>
        </motion.div>
        
        {/* Contacts List */}
        {contacts.length > 0 && (
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/60 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
                    {c.name[0]}
                  </div>
                  <span className="font-semibold text-gray-800">{c.name}</span>
                </div>
                <a 
                  href={`tel:${c.phone}`}
                  className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                >
                  <Phone size={16} />
                </a>
              </motion.div>
            ))}
          </div>
        )}

        {/* Start a Journey */}
        <motion.div 
          whileHover={{ scale: 1.02, x: 5 }} 
          className="bg-white/80 backdrop-blur-md p-5 rounded-[2.5rem] shadow-sm border border-white/80 flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all" 
          onClick={onTrackMeClick}
        >
          <div className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-200">
            <Navigation size={28} />
          </div>
          <div className="flex-grow">
            <p className="font-bold text-gray-900">{t("Start a journey")}</p>
            <p className="text-[10px] text-gray-500 font-medium leading-tight">{t("Enter your destination, and the app will track your route in real-time.")}</p>
          </div>
          <div className="relative">
            <img src="https://picsum.photos/seed/map/60/60" alt="Journey" className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          </div>
        </motion.div>

        {/* List Items */}
        <div className="space-y-3">
          {[
            { icon: Shield, label: t("Police station near me"), action: () => handleFindPlace("police"), color: "text-blue-500", bg: "bg-blue-50" },
            { icon: Hospital, label: t("Hospital Near me"), action: () => handleFindPlace("hospital"), color: "text-red-500", bg: "bg-red-50" },
            { icon: "💊", label: t("Pharmacy Near Me"), action: () => handleFindPlace("pharmacy"), color: "text-green-500", bg: "bg-green-50" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02, x: 5 }} 
              className="bg-white/60 backdrop-blur-sm p-4 rounded-[1.5rem] shadow-sm border border-white/80 flex justify-between items-center cursor-pointer hover:bg-white/90 transition-all" 
              onClick={item.action}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${item.bg || 'bg-gray-50'} rounded-xl flex items-center justify-center ${item.color || 'text-gray-600'}`}>
                  {typeof item.icon === 'string' ? <span className="text-xl">{item.icon}</span> : <item.icon size={20} />}
                </div>
                <span className="font-bold text-gray-800">{item.label}</span>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <ArrowRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonial Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-black p-6 rounded-[3rem] shadow-2xl flex flex-col gap-5 relative overflow-hidden"
        >
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="flex gap-5 items-center">
            <img src="https://picsum.photos/seed/jhanvi/100/100" alt="Jhanvi" className="rounded-[2rem] w-20 h-20 object-cover border-2 border-white/20" referrerPolicy="no-referrer" />
            <div className="flex-1">
              <p className="text-xs text-gray-300 leading-relaxed italic">
                {t("\"I turned my pain into power. Today, as a CEO, I stand as proof that no matter your past, you can rise and thrive.\"")}
              </p>
              <p className="font-bold text-white mt-2 text-sm">- {t("Jhanvi Singh")}</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-black py-3 rounded-2xl text-xs font-bold shadow-lg" 
            onClick={onCommunityClick}
          >
            {t("Read More →")}
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Nav & SOS */}
      <div className="bg-white/80 backdrop-blur-xl p-4 flex justify-around items-center relative border-t border-white/50 z-20">
        <motion.div whileHover={{ y: -3 }} className="p-2 cursor-pointer"><Home size={24} className="text-gray-900" /></motion.div>
        <motion.div whileHover={{ y: -3 }} className="p-2 cursor-pointer" onClick={() => setShowTrustedChat(true)}><MessageCircle size={24} className="text-gray-400" /></motion.div>
        
        <div className="relative">
          <motion.div 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white w-16 h-16 rounded-full shadow-[0_10px_30px_rgba(220,38,38,0.4)] border-4 border-white flex items-center justify-center cursor-pointer z-30" 
            onClick={handleSOS}
          >
            <span className="font-black text-sm tracking-tighter">SOS</span>
          </motion.div>
        </div>

        <div className="absolute -top-10 right-6 cursor-pointer z-30" onClick={() => setShowChat(!showChat)}>
          <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="relative">
            <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=lawyer" alt="Lawyer" className="w-12 h-12 rounded-2xl border-2 border-white shadow-xl bg-blue-50" referrerPolicy="no-referrer" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </motion.div>
        </div>

        <motion.div whileHover={{ y: -3 }} className="p-2 cursor-pointer" onClick={onCommunityClick}><Users size={24} className="text-gray-400" /></motion.div>
        <motion.div whileHover={{ y: -3 }} className="p-2 cursor-pointer" onClick={onProfileClick}><User size={24} className="text-gray-400" /></motion.div>
      </div>
      {showChat && <ChatBot onClose={() => setShowChat(false)} onVoiceClick={() => { setShowChat(false); setShowVoiceAssistant(true); }} t={t} />}
      {showVoiceAssistant && <VoiceAssistant onClose={() => setShowVoiceAssistant(false)} t={t} />}
      {showTrustedChat && <TrustedContactsChat onClose={() => setShowTrustedChat(false)} t={t} contacts={contacts} />}
    </div>
  );
}

const translations: Record<string, Record<string, string>> = {
  English: {
    "Your Safety, Our Priority.": "Your Safety, Our Priority.",
    "Hey there! Welcome to Iris. Empower yourself with tools designed to keep you safe, informed, and connected anytime, anywhere.": "Hey there! Welcome to Iris. Empower yourself with tools designed to keep you safe, informed, and connected anytime, anywhere.",
    "SOS": "SOS",
    "Connecting to command control centre": "Connecting to command control centre",
    "Help is on the way, stay calm and stay safe.": "Help is on the way, stay calm and stay safe.",
    "Cancel": "Cancel",
    "Hey there,": "Hey there,",
    "Lucy": "Lucy",
    "Fake message": "Fake message",
    "Share live location": "Share live location",
    "Add Close people": "Add Close people",
    "Add close people and friends for sos": "Add close people and friends for sos",
    "Add friends +": "Add friends +",
    "Start a journey": "Start a journey",
    "Enter your destination, and the app will track your route in real-time.": "Enter your destination, and the app will track your route in real-time.",
    "Police station near me": "Police station near me",
    "Hospital Near me": "Hospital Near me",
    "Pharmacy Near Me": "Pharmacy Near Me",
    "Read More →": "Read More →",
    "Preferences": "Preferences",
    "Manage Friends": "Manage Friends",
    "Change language": "Change language",
    "Customise / Themes": "Customise / Themes",
    "More": "More",
    "Help Line numbers": "Help Line numbers",
    "Connectivity settings": "Connectivity settings",
    "Help & support": "Help & support",
    "About us": "About us",
    "Select Language": "Select Language",
    "Legal Assistant": "Legal Assistant",
    "Online": "Online",
    "Type your question...": "Type your question...",
    "Mom": "Mom",
    "Best Friend": "Best Friend",
    "Are you safe?": "Are you safe?",
    "Call me!": "Call me!",
    "Hi! Are you safe?": "Hi! Are you safe?",
    "Message...": "Message...",
    "Chats": "Chats",
    "Search contacts...": "Search contacts...",
    "Live Sharing": "Live Sharing",
    "Live location sharing active": "Live location sharing active",
    "Your trusted contacts can see your live location.": "Your trusted contacts can see your live location.",
    "Stop sharing": "Stop sharing",
    "Set Duration": "Set Duration",
    "minutes": "minutes",
    "Share Location": "Share Location",
    "Choose how you want to share your location.": "Choose how you want to share your location.",
    "Time-based sharing": "Time-based sharing",
    "Live sharing": "Live sharing",
    "Rising from the Ashes: The Story of Jhanvi Singh": "Rising from the Ashes: The Story of Jhanvi Singh",
    "Jhanvi Singh was once a vibrant young woman whose dreams were shattered after surviving a traumatic assault, leaving her struggling with fear and self-doubt. Determined not to let her pain define her, she sought therapy and began volunteering to support other survivors, finding strength in their shared resilience. Inspired by these stories, Jhanvi launched a tech startup, Phoenix Enterprises, creating innovative safety tools for women. See more": "Jhanvi Singh was once a vibrant young woman whose dreams were shattered after surviving a traumatic assault, leaving her struggling with fear and self-doubt. Determined not to let her pain define her, she sought therapy and began volunteering to support other survivors, finding strength in their shared resilience. Inspired by these stories, Jhanvi launched a tech startup, Phoenix Enterprises, creating innovative safety tools for women. See more",
    "My Story": "My Story",
    "A new story uploaded by me.": "A new story uploaded by me.",
    "My community": "My community",
    "Our community is a safe, supportive, and empowering.": "Our community is a safe, supportive, and empowering.",
    "Search Legal women rights": "Search Legal women rights",
    "Write about your photo...": "Write about your photo...",
    "SOS Activated!": "SOS Activated!",
    "I'm sorry, I couldn't process that.": "I'm sorry, I couldn't process that.",
    "Personal Details": "Personal Details",
    "Emergency Details": "Emergency Details",
    "Guardian Contacts": "Guardian Contacts",
    "Location & Safety": "Location & Safety",
    "SOS Settings": "SOS Settings",
    "Privacy & Permissions": "Privacy & Permissions",
    "App Preferences": "App Preferences",
    "Setup Iris": "Setup Iris",
    "Finish Setup": "Finish Setup",
    "Or": "Or",
    "Continue with Google": "Continue with Google",
    "Female": "Female",
    "Male": "Male",
    "Other": "Other",
    "Guardian Name": "Guardian Name",
    "Guardian Phone": "Guardian Phone",
    "Live Location Tracking": "Live Location Tracking",
    "Enable for real-time guardian updates": "Enable for real-time guardian updates",
    "Power Button 3x": "Power Button 3x",
    "Voice Trigger": "Voice Trigger",
    "Shake Device": "Shake Device",
    "I accept the Privacy Policy and Terms of Service": "I accept the Privacy Policy and Terms of Service",
    "We value your privacy. Your data is encrypted and only shared with your chosen guardians during emergencies.": "We value your privacy. Your data is encrypted and only shared with your chosen guardians during emergencies.",
    "Add critical information for first responders.": "Add critical information for first responders.",
    "Medical conditions, allergies, etc.": "Medical conditions, allergies, etc.",
    "Please fill in your name.": "Please fill in your name.",
    "Please fill in guardian details.": "Please fill in guardian details.",
    "Please accept the privacy policy.": "Please accept the privacy policy.",
    "Please provide your basic information to get started.": "Please provide your basic information to get started.",
    "Full Name": "Full Name",
    "Phone Number": "Phone Number",
    "Email Address (Optional)": "Email Address (Optional)",
    "Please fill in your name and phone number.": "Please fill in your name and phone number.",
    "Continue": "Continue",
    "You are a knowledgeable legal assistant specializing in domestic violence laws and women's rights. Provide supportive, accurate, and empathetic legal information. Keep your answers concise and short. Always advise the user to seek professional legal counsel for their specific situation.": "You are a knowledgeable legal assistant specializing in domestic violence laws and women's rights. Provide supportive, accurate, and empathetic legal information. Keep your answers concise and short. Always advise the user to seek professional legal counsel for their specific situation.",
    "Police Stations Near Me": "Police Stations Near Me",
    "Hospitals Near Me": "Hospitals Near Me",
    "Pharmacies Near Me": "Pharmacies Near Me",
    "Unnamed police": "Unnamed Police Station",
    "Unnamed hospital": "Unnamed Hospital",
    "Unnamed pharmacy": "Unnamed Pharmacy",
    "Searching nearby...": "Searching nearby...",
    "Failed to find nearby places. Please try again later.": "Failed to find nearby places. Please try again later.",
    "Location permission denied or unavailable.": "Location permission denied or unavailable.",
    "No results found in your area.": "No results found in your area.",
    "Try Again": "Try Again",
    "away": "away",
    "Directions": "Directions",
    "You are here": "You are here",
    "Navigate to Nearest": "Navigate to Nearest",
    "Open in Google Maps": "Open in Google Maps",
    "Find my location": "Find my location",
    "Scanning location...": "Scanning location...",
    "Location found": "Location found",
    "Latitude": "Latitude",
    "Longitude": "Longitude",
    "View on Map": "View on Map",
    "Refresh": "Refresh",
    "Copy": "Copy",
    "Coordinates copied!": "Coordinates copied!",
    "Error": "Error",
    "Location request timed out. Please check your GPS settings.": "Location request timed out. Please check your GPS settings.",
    "Verification": "Verification",
    "Enter User Phone Number": "Enter User Phone Number",
    "Phone numbers do not match. Access to dashboard denied.": "Phone numbers do not match. Access to dashboard denied.",
    "The system verifies the phone number entered by the user against the guardian’s phone number. If both numbers match, access to the dashboard is granted.": "The system verifies the phone number entered by the user against the guardian’s phone number. If both numbers match, access to the dashboard is granted.",
  },
  Hindi: {
    "Your Safety, Our Priority.": "आपकी सुरक्षा, हमारी प्राथमिकता।",
    "Hey there! Welcome to Iris. Empower yourself with tools designed to keep you safe, informed, and connected anytime, anywhere.": "नमस्ते! आइरिस में आपका स्वागत है। खुद को उन उपकरणों के साथ सशक्त बनाएं जो आपको सुरक्षित, सूचित और कहीं भी, कभी भी जुड़े रहने के लिए डिज़ाइन किए गए हैं।",
    "SOS": "एसओएस",
    "Connecting to command control centre": "कमांड कंट्रोल सेंटर से जुड़ रहे हैं",
    "Help is on the way, stay calm and stay safe.": "मदद रास्ते में है, शांत रहें और सुरक्षित रहें।",
    "Cancel": "रद्द करें",
    "Hey there,": "नमस्ते,",
    "Lucy": "लुसी",
    "Fake message": "फर्जी संदेश",
    "Share live location": "लाइव लोकेशन साझा करें",
    "Add Close people": "करीबी लोगों को जोड़ें",
    "Add close people and friends for sos": "एसओएस के लिए करीबी लोगों और दोस्तों को जोड़ें",
    "Add friends +": "दोस्तों को जोड़ें +",
    "Start a journey": "यात्रा शुरू करें",
    "Enter your destination, and the app will track your route in real-time.": "अपनी मंजिल दर्ज करें, और ऐप वास्तविक समय में आपके मार्ग को ट्रैक करेगा।",
    "Police station near me": "मेरे पास पुलिस स्टेशन",
    "Hospital Near me": "मेरे पास अस्पताल",
    "Pharmacy Near Me": "मेरे पास फार्मेसी",
    "Read More →": "और पढ़ें →",
    "Preferences": "प्राथमिकताएं",
    "Manage Friends": "दोस्तों को प्रबंधित करें",
    "Change language": "भाषा बदलें",
    "Customise / Themes": "कस्टमाइज़ / थीम",
    "More": "अधिक",
    "Help Line numbers": "हेल्पलाइन नंबर",
    "Connectivity settings": "कनेक्टिविटी सेटिंग्स",
    "Help & support": "मदद और समर्थन",
    "About us": "हमारे बारे में",
    "Select Language": "भाषा चुनें",
    "Legal Assistant": "कानूनी सहायक",
    "Online": "ऑनलाइन",
    "Type your question...": "अपना प्रश्न टाइप करें...",
    "Mom": "माँ",
    "Best Friend": "सबसे अच्छा दोस्त",
    "Are you safe?": "क्या आप सुरक्षित हैं?",
    "Call me!": "मुझे कॉल करें!",
    "Hi! Are you safe?": "नमस्ते! क्या आप सुरक्षित हैं?",
    "Message...": "संदेश...",
    "Chats": "चैट",
    "Search contacts...": "संपर्क खोजें...",
    "Live Sharing": "लाइव साझाकरण",
    "Live location sharing active": "लाइव लोकेशन साझाकरण सक्रिय है",
    "Your trusted contacts can see your live location.": "आपके विश्वसनीय संपर्क आपकी लाइव लोकेशन देख सकते हैं।",
    "Stop sharing": "साझा करना बंद करें",
    "Set Duration": "अवधि सेट करें",
    "minutes": "मिनट",
    "Share Location": "स्थान साझा करें",
    "Choose how you want to share your location.": "चुनें कि आप अपना स्थान कैसे साझा करना चाहते हैं।",
    "Time-based sharing": "समय-आधारित साझाकरण",
    "Live sharing": "लाइव साझाकरण",
    "Rising from the Ashes: The Story of Jhanvi Singh": "राख से उठना: जानवी सिंह की कहानी",
    "Jhanvi Singh was once a vibrant young woman whose dreams were shattered after surviving a traumatic assault, leaving her struggling with fear and self-doubt. Determined not to let her pain define her, she sought therapy and began volunteering to support other survivors, finding strength in their shared resilience. Inspired by these stories, Jhanvi launched a tech startup, Phoenix Enterprises, creating innovative safety tools for women. See more": "जानवी सिंह कभी एक जीवंत युवा महिला थीं, जिनके सपने एक दर्दनाक हमले से बचने के बाद टूट गए थे, जिससे वह डर और आत्म-संदेह से जूझ रही थीं। अपने दर्द को खुद को परिभाषित न करने देने के लिए दृढ़ संकल्पित, उन्होंने चिकित्सा की मांग की और अन्य बचे लोगों का समर्थन करने के लिए स्वेच्छा से काम करना शुरू किया, उनकी साझा लचीलेपन में ताकत पाई। इन कहानियों से प्रेरित होकर, जानवी ने एक टेक स्टार्टअप, फीनिक्स एंटरप्राइजेज लॉन्च किया, जो महिलाओं के लिए अभिनव सुरक्षा उपकरण बना रहा है। और देखें",
    "My Story": "मेरी कहानी",
    "A new story uploaded by me.": "मेरे द्वारा अपलोड की गई एक नई कहानी।",
    "My community": "मेरा समुदाय",
    "Our community is a safe, supportive, and empowering.": "हमारा समुदाय सुरक्षित, सहायक और सशक्त बनाने वाला है।",
    "Search Legal women rights": "कानूनी महिला अधिकारों की खोज करें",
    "Write about your photo...": "अपनी फोटो के बारे में लिखें...",
    "SOS Activated!": "एसओएस सक्रिय!",
    "I'm sorry, I couldn't process that.": "मुझे खेद है, मैं इसे संसाधित नहीं कर सका।",
    "Personal Details": "व्यक्तिगत विवरण",
    "Emergency Details": "आपातकालीन विवरण",
    "Guardian Contacts": "अभिभावक संपर्क",
    "Location & Safety": "स्थान और सुरक्षा",
    "SOS Settings": "एसओएस सेटिंग्स",
    "Privacy & Permissions": "गोपनीयता और अनुमतियाँ",
    "App Preferences": "ऐप प्राथमिकताएं",
    "Setup Iris": "आइरिस सेटअप करें",
    "Finish Setup": "सेटअप पूरा करें",
    "Or": "या",
    "Continue with Google": "गूगल के साथ जारी रखें",
    "Female": "महिला",
    "Male": "पुरुष",
    "Other": "अन्य",
    "Guardian Name": "अभिभावक का नाम",
    "Guardian Phone": "अभिभावक का फोन",
    "Live Location Tracking": "लाइव लोकेशन ट्रैकिंग",
    "Enable for real-time guardian updates": "वास्तविक समय के अभिभावक अपडेट के लिए सक्षम करें",
    "Power Button 3x": "पावर बटन 3x",
    "Voice Trigger": "वॉयस ट्रिगर",
    "Shake Device": "डिवाइस हिलाएं",
    "I accept the Privacy Policy and Terms of Service": "मैं गोपनीयता नीति और सेवा की शर्तों को स्वीकार करता हूँ",
    "We value your privacy. Your data is encrypted and only shared with your chosen guardians during emergencies.": "हम आपकी गोपनीयता को महत्व देते हैं। आपका डेटा एन्क्रिप्ट किया गया है और केवल आपात स्थिति के दौरान आपके चुने हुए अभिभावकों के साथ साझा किया जाता है।",
    "Add critical information for first responders.": "प्रथम उत्तरदाताओं के लिए महत्वपूर्ण जानकारी जोड़ें।",
    "Medical conditions, allergies, etc.": "चिकित्सा स्थितियां, एलर्जी, आदि।",
    "Please fill in your name.": "कृपया अपना नाम भरें।",
    "Please fill in guardian details.": "कृपया अभिभावक का विवरण भरें।",
    "Please accept the privacy policy.": "कृपया गोपनीयता नीति स्वीकार करें।",
    "Please provide your basic information to get started.": "शुरू करने के लिए कृपया अपनी बुनियादी जानकारी प्रदान करें।",
    "Full Name": "पूरा नाम",
    "Phone Number": "फ़ोन नंबर",
    "Email Address (Optional)": "ईमेल पता (वैकल्पिक)",
    "Please fill in your name and phone number.": "कृपया अपना नाम और फ़ोन नंबर भरें।",
    "Continue": "जारी रखें",
    "You are a knowledgeable legal assistant specializing in domestic violence laws and women's rights. Provide supportive, accurate, and empathetic legal information. Keep your answers concise and short. Always advise the user to seek professional legal counsel for their specific situation.": "आप घरेलू हिंसा कानूनों और महिलाओं के अधिकारों में विशेषज्ञ एक जानकार कानूनी सहायक हैं। सहायक, सटीक और सहानुभूतिपूर्ण कानूनी जानकारी प्रदान करें। अपने उत्तर संक्षिप्त और छोटे रखें। हमेशा उपयोगकर्ता को अपनी विशिष्ट स्थिति के लिए पेशेवर कानूनी सलाह लेने की सलाह दें।",
    "Police Stations Near Me": "मेरे पास के पुलिस स्टेशन",
    "Hospitals Near Me": "मेरे पास के अस्पताल",
    "Pharmacies Near Me": "मेरे पास की फार्मेसी",
    "Unnamed police": "अज्ञात पुलिस स्टेशन",
    "Unnamed hospital": "अज्ञात अस्पताल",
    "Unnamed pharmacy": "अज्ञात फार्मेसी",
    "Searching nearby...": "पास में खोज रहे हैं...",
    "Failed to find nearby places. Please try again later.": "पास के स्थान खोजने में विफल। कृपया बाद में पुनः प्रयास करें।",
    "Location permission denied or unavailable.": "स्थान अनुमति अस्वीकृत या अनुपलब्ध।",
    "No results found in your area.": "आपके क्षेत्र में कोई परिणाम नहीं मिला।",
    "Try Again": "पुनः प्रयास करें",
    "away": "दूर",
    "Directions": "दिशा-निर्देश",
    "You are here": "आप यहाँ हैं",
    "Navigate to Nearest": "निकटतम पर नेविगेट करें",
    "Open in Google Maps": "गूगल मैप्स में खोलें",
    "Find my location": "मेरा स्थान खोजें",
    "Scanning location...": "स्थान स्कैन किया जा रहा है...",
    "Location found": "स्थान मिल गया",
    "Latitude": "अक्षांश",
    "Longitude": "देशांतर",
    "View on Map": "नक्शे पर देखें",
    "Refresh": "ताज़ा करें",
    "Copy": "कॉपी करें",
    "Coordinates copied!": "निर्देशांक कॉपी किए गए!",
    "Error": "त्रुटि",
    "Location request timed out. Please check your GPS settings.": "स्थान अनुरोध का समय समाप्त हो गया। कृपया अपनी जीपीएस सेटिंग्स जांचें।",
    "Verification": "सत्यापन",
    "Enter User Phone Number": "उपयोगकर्ता फोन नंबर दर्ज करें",
    "Phone numbers do not match. Access to dashboard denied.": "फोन नंबर मेल नहीं खाते। डैशबोर्ड तक पहुंच से इनकार किया गया।",
    "The system verifies the phone number entered by the user against the guardian’s phone number. If both numbers match, access to the dashboard is granted.": "प्रणाली उपयोगकर्ता द्वारा दर्ज किए गए फोन नंबर को अभिभावक के फोन नंबर के विरुद्ध सत्यापित करती है। यदि दोनों नंबर मेल खाते हैं, तो डैशबोर्ड तक पहुंच प्रदान की जाती है।",
  },
  Kannada: {
    "Your Safety, Our Priority.": "ನಿಮ್ಮ ಸುರಕ್ಷತೆ, ನಮ್ಮ ಆದ್ಯತೆ.",
    "Hey there! Welcome to Iris. Empower yourself with tools designed to keep you safe, informed, and connected anytime, anywhere.": "ನಮಸ್ಕಾರ! ಐರಿಸ್‌ಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸಲು, ಮಾಹಿತಿ ನೀಡಲು ಮತ್ತು ಯಾವಾಗಲಾದರೂ, ಎಲ್ಲಿಯಾದರೂ ಸಂಪರ್ಕದಲ್ಲಿರಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ಸಾಧನಗಳೊಂದಿಗೆ ನಿಮ್ಮನ್ನು ಸಬಲೀಕರಣಗೊಳಿಸಿಕೊಳ್ಳಿ.",
    "SOS": "SOS",
    "Connecting to command control centre": "ಕಮಾಂಡ್ ಕಂಟ್ರೋಲ್ ಸೆಂಟರ್‌ಗೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ",
    "Help is on the way, stay calm and stay safe.": "ಸಹಾಯ ಬರುತ್ತಿದೆ, ಶಾಂತವಾಗಿರಿ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿರಿ.",
    "Cancel": "ರದ್ದುಗೊಳಿಸಿ",
    "Hey there,": "ನಮಸ್ಕಾರ,",
    "Lucy": "ಲೂಸಿ",
    "Fake message": "ನಕಲಿ ಸಂದೇಶ",
    "Share live location": "ಲೈವ್ ಸ್ಥಳವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ",
    "Add Close people": "ಆಪ್ತರನ್ನು ಸೇರಿಸಿ",
    "Add close people and friends for sos": "SOS ಗಾಗಿ ಆಪ್ತರು ಮತ್ತು ಸ್ನೇಹಿತರನ್ನು ಸೇರಿಸಿ",
    "Add friends +": "ಸ್ನೇಹಿತರನ್ನು ಸೇರಿಸಿ +",
    "Start a journey": "ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ",
    "Enter your destination, and the app will track your route in real-time.": "ನಿಮ್ಮ ಗಮ್ಯಸ್ಥಾನವನ್ನು ನಮೂದಿಸಿ, ಮತ್ತು ಅಪ್ಲಿಕೇಶನ್ ನಿಮ್ಮ ಮಾರ್ಗವನ್ನು ನೈಜ ಸಮಯದಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡುತ್ತದೆ.",
    "Police station near me": "ನನ್ನ ಹತ್ತಿರದ ಪೊಲೀಸ್ ಠಾಣೆ",
    "Hospital Near me": "ನನ್ನ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ",
    "Pharmacy Near Me": "ನನ್ನ ಹತ್ತಿರದ ಫಾರ್ಮಸಿ",
    "Read More →": "ಇನ್ನಷ್ಟು ಓದಿ →",
    "Preferences": "ಆದ್ಯತೆಗಳು",
    "Manage Friends": "ಸ್ನೇಹಿತರನ್ನು ನಿರ್ವಹಿಸಿ",
    "Change language": "ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ",
    "Customise / Themes": "ಕಸ್ಟಮೈಸ್ / ಥೀಮ್‌ಗಳು",
    "More": "ಹೆಚ್ಚು",
    "Help Line numbers": "ಹೆಲ್ಪ್‌ಲೈನ್ ಸಂಖ್ಯೆಗಳು",
    "Connectivity settings": "ಸಂಪರ್ಕ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "Help & support": "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ",
    "About us": "ನಮ್ಮ ಬಗ್ಗೆ",
    "Select Language": "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "Legal Assistant": "ಕಾನೂನು ಸಹಾಯಕ",
    "Online": "ಆನ್‌ಲೈನ್",
    "Type your question...": "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    "Mom": "ಅಮ್ಮ",
    "Best Friend": "ಅತ್ಯುತ್ತಮ ಸ್ನೇಹಿತ",
    "Are you safe?": "ನೀವು ಸುರಕ್ಷಿತವಾಗಿದ್ದೀರಾ?",
    "Call me!": "ನನಗೆ ಕರೆ ಮಾಡಿ!",
    "Hi! Are you safe?": "ನಮಸ್ಕಾರ! ನೀವು ಸುರಕ್ಷಿತವಾಗಿದ್ದೀರಾ?",
    "Message...": "ಸಂದೇಶ...",
    "Chats": "ಚಾಟ್‌ಗಳು",
    "Search contacts...": "ಸಂಪರ್ಕಗಳನ್ನು ಹುಡುಕಿ...",
    "Live Sharing": "ಲೈವ್ ಹಂಚಿಕೆ",
    "Live location sharing active": "ಲೈವ್ ಸ್ಥಳ ಹಂಚಿಕೆ ಸಕ್ರಿಯವಾಗಿದೆ",
    "Your trusted contacts can see your live location.": "ನಿಮ್ಮ ವಿಶ್ವಾಸಾರ್ಹ ಸಂಪರ್ಕಗಳು ನಿಮ್ಮ ಲೈವ್ ಸ್ಥಳವನ್ನು ನೋಡಬಹುದು.",
    "Stop sharing": "ಹಂಚಿಕೆಯನ್ನು ನಿಲ್ಲಿಸಿ",
    "Set Duration": "ಅವಧಿಯನ್ನು ಹೊಂದಿಸಿ",
    "minutes": "ನಿಮಿಷಗಳು",
    "Share Location": "ಸ್ಥಳವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ",
    "Choose how you want to share your location.": "ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹೇಗೆ ಹಂಚಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    "Time-based sharing": "ಸಮಯ-ಆಧಾರಿತ ಹಂಚಿಕೆ",
    "Live sharing": "ಲೈವ್ ಹಂಚಿಕೆ",
    "Rising from the Ashes: The Story of Jhanvi Singh": "ಬೂದಿಯಿಂದ ಏಳುವುದು: ಜಾನ್ವಿ ಸಿಂಗ್ ಅವರ ಕಥೆ",
    "Jhanvi Singh was once a vibrant young woman whose dreams were shattered after surviving a traumatic assault, leaving her struggling with fear and self-doubt. Determined not to let her pain define her, she sought therapy and began volunteering to support other survivors, finding strength in their shared resilience. Inspired by these stories, Jhanvi launched a tech startup, Phoenix Enterprises, creating innovative safety tools for women. See more": "ಜಾನ್ವಿ ಸಿಂಗ್ ಒಮ್ಮೆ ರೋಮಾಂಚಕ ಯುವತಿಯಾಗಿದ್ದಳು, ಆಕೆಯ ಕನಸುಗಳು ಆಘಾತಕಾರಿ ಹಲ್ಲೆಯಿಂದ ಬದುಕುಳಿದ ನಂತರ ಚೂರುಚೂರಾದವು, ಅವಳು ಭಯ ಮತ್ತು ಆತ್ಮ-ಸಂದೇಹದಿಂದ ಹೋರಾಡುತ್ತಿದ್ದಳು. ತನ್ನ ನೋವು ತನ್ನನ್ನು ವ್ಯಾಖ್ಯಾನಿಸಲು ಬಿಡಬಾರದೆಂದು ದೃಢನಿಶ್ಚಯದಿಂದ, ಅವಳು ಚಿಕಿತ್ಸೆಯನ್ನು ಪಡೆದಳು ಮತ್ತು ಇತರ ಬದುಕುಳಿದವರಿಗೆ ಬೆಂಬಲ ನೀಡಲು ಸ್ವಯಂಸೇವಕಳಾಗಿ ಕೆಲಸ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿದಳು, ಅವರ ಹಂಚಿಕೆಯ ಸ್ಥಿತಿಸ್ಥಾಪಕತ್ವದಲ್ಲಿ ಶಕ್ತಿಯನ್ನು ಕಂಡುಕೊಂಡಳು. ಈ ಕಥೆಗಳಿಂದ ಪ್ರೇರಿತರಾಗಿ, ಜಾನ್ವಿ ಫೀನಿಕ್ಸ್ ಎಂಟರ್‌ಪ್ರೈಸಸ್ ಎಂಬ ಟೆಕ್ ಸ್ಟಾರ್ಟ್‌ಅಪ್ ಅನ್ನು ಪ್ರಾರಂಭಿಸಿದಳು, ಮಹಿಳೆಯರಿಗಾಗಿ ನವೀನ ಸುರಕ್ಷತಾ ಸಾಧನಗಳನ್ನು ರಚಿಸಿದಳು. ಇನ್ನಷ್ಟು ನೋಡಿ",
    "My Story": "ನನ್ನ ಕಥೆ",
    "A new story uploaded by me.": "ನನ್ನಿಂದ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾದ ಹೊಸ ಕಥೆ.",
    "My community": "ನನ್ನ ಸಮುದಾಯ",
    "Our community is a safe, supportive, and empowering.": "ನಮ್ಮ ಸಮುದಾಯ ಸುರಕ್ಷಿತ, ಬೆಂಬಲಿತ ಮತ್ತು ಸಬಲೀಕರಣವಾಗಿದೆ.",
    "Search Legal women rights": "ಕಾನೂನು ಮಹಿಳಾ ಹಕ್ಕುಗಳನ್ನು ಹುಡುಕಿ",
    "Write about your photo...": "ನಿಮ್ಮ ಫೋಟೋದ ಬಗ್ಗೆ ಬರೆಯಿರಿ...",
    "SOS Activated!": "SOS ಸಕ್ರಿಯಗೊಂಡಿದೆ!",
    "I'm sorry, I couldn't process that.": "ಕ್ಷಮಿಸಿ, ಅದನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    "Personal Details": "ವೈಯಕ್ತಿಕ ವಿವರಗಳು",
    "Please provide your basic information to get started.": "ಪ್ರಾರಂಭಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೂಲ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಿ.",
    "Full Name": "ಪೂರ್ಣ ಹೆಸರು",
    "Phone Number": "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    "Email Address (Optional)": "ಇಮೇಲ್ ವಿಳಾಸ (ಐಚ್ಛಿಕ)",
    "Please fill in your name and phone number.": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    "Continue": "ಮುಂದುವರಿಸಿ",
    "You are a knowledgeable legal assistant specializing in domestic violence laws and women's rights. Provide supportive, accurate, and empathetic legal information. Keep your answers concise and short. Always advise the user to seek professional legal counsel for their specific situation.": "ನೀವು ಕೌಟುಂಬಿಕ ದೌರ್ಜನ್ಯ ಕಾನೂನುಗಳು ಮತ್ತು ಮಹಿಳಾ ಹಕ್ಕುಗಳಲ್ಲಿ ಪರಿಣತಿ ಹೊಂದಿರುವ ಜ್ಞಾನವುಳ್ಳ ಕಾನೂನು ಸಹಾಯಕರು. ಬೆಂಬಲಿತ, ನಿಖರ ಮತ್ತು ಸಹಾನುಭೂತಿಯ ಕಾನೂನು ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಿ. ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಮತ್ತು ಚಿಕ್ಕದಾಗಿ ಇರಿಸಿ. ಬಳಕೆದಾರರಿಗೆ ಅವರ ನಿರ್ದಿಷ್ಟ ಪರಿಸ್ಥಿತಿಗಾಗಿ ವೃತ್ತಿಪರ ಕಾನೂನು ಸಲಹೆಯನ್ನು ಪಡೆಯಲು ಯಾವಾಗಲೂ ಸಲಹೆ ನೀಡಿ.",
    "\"I turned my pain into power. Today, as a CEO, I stand as proof that no matter your past, you can rise and thrive.\"": "\"ನಾನು ನನ್ನ ನೋವನ್ನು ಶಕ್ತಿಯಾಗಿ ಪರಿವರ್ತಿಸಿದೆ. ಇಂದು, ಸಿಇಒ ಆಗಿ, ನಿಮ್ಮ ಹಿಂದಿನದು ಏನೇ ಇರಲಿ, ನೀವು ಏಳಬಹುದು ಮತ್ತು ಅಭಿವೃದ್ಧಿ ಹೊಂದಬಹುದು ಎಂಬುದಕ್ಕೆ ನಾನು ಸಾಕ್ಷಿಯಾಗಿದ್ದೇನೆ.\"",
    "Jhanvi Singh": "ಜಾನ್ವಿ ಸಿಂಗ್",
    "Police Stations Near Me": "ನನ್ನ ಹತ್ತಿರದ ಪೊಲೀಸ್ ಠಾಣೆಗಳು",
    "Hospitals Near Me": "ನನ್ನ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು",
    "Pharmacies Near Me": "ನನ್ನ ಹತ್ತಿರದ ಫಾರ್ಮಸಿಗಳು",
    "Unnamed police": "ಅನಾಮಧೇಯ ಪೊಲೀಸ್ ಠಾಣೆ",
    "Unnamed hospital": "ಅನಾಮಧೇಯ ಆಸ್ಪತ್ರೆ",
    "Unnamed pharmacy": "ಅನಾಮಧೇಯ ಫಾರ್ಮಸಿ",
    "Searching nearby...": "ಹತ್ತಿರದಲ್ಲಿ ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
    "Failed to find nearby places. Please try again later.": "ಹತ್ತಿರದ ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.",
    "Location permission denied or unavailable.": "ಸ್ಥಳದ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ ಅಥವಾ ಲಭ್ಯವಿಲ್ಲ.",
    "No results found in your area.": "ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಯಾವುದೇ ಫಲಿತಾಂಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    "Try Again": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    "away": "ದೂರ",
    "Directions": "ದಿಕ್ಕುಗಳು",
    "You are here": "ನೀವು ಇಲ್ಲಿದ್ದೀರಿ",
    "Navigate to Nearest": "ಹತ್ತಿರದಕ್ಕೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಿ",
    "Open in Google Maps": "ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ",
    "Find my location": "ನನ್ನ ಸ್ಥಳವನ್ನು ಹುಡುಕಿ",
    "Scanning location...": "ಸ್ಥಳವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "Location found": "ಸ್ಥಳ ಕಂಡುಬಂದಿದೆ",
    "Latitude": "ಅಕ್ಷಾಂಶ",
    "Longitude": "ರೇಖಾಂಶ",
    "View on Map": "ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ",
    "Refresh": "ಮತ್ತೊಮ್ಮೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    "Copy": "ನಕಲಿಸಿ",
    "Coordinates copied!": "ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ನಕಲಿಸಲಾಗಿದೆ!",
    "Error": "ದೋಷ",
    "Location request timed out. Please check your GPS settings.": "ಸ್ಥಳ ವಿನಂತಿಯ ಸಮಯ ಮೀರಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಜಿಪಿಎಸ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "Verification": "ಪರಿಶೀಲನೆ",
    "Enter User Phone Number": "ಬಳಕೆದಾರರ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
    "Phone numbers do not match. Access to dashboard denied.": "ಫೋನ್ ಸಂಖ್ಯೆಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶವನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ.",
    "The system verifies the phone number entered by the user against the guardian’s phone number. If both numbers match, access to the dashboard is granted.": "ಬಳಕೆದಾರರು ನಮೂದಿಸಿದ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಸಿಸ್ಟಮ್ ಪಾಲಕರ ಫೋನ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸುತ್ತದೆ. ಎರಡೂ ಸಂಖ್ಯೆಗಳು ಹೊಂದಿಕೆಯಾದರೆ, ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಪ್ರವೇಶವನ್ನು ನೀಡಲಾಗುತ್ತದೆ.",
  },
  Tamil: {
    "Your Safety, Our Priority.": "உங்கள் பாதுகாப்பு, எங்கள் முன்னுரிமை.",
    "Hey there! Welcome to Iris. Empower yourself with tools designed to keep you safe, informed, and connected anytime, anywhere.": "வணக்கம்! ஐரிஸிற்கு வரவேற்கிறோம். நீங்கள் பாதுகாப்பாகவும், தகவலறிந்தவராகவும், எப்போது வேண்டுமானாலும், எங்கும் இணைந்திருக்கவும் வடிவமைக்கப்பட்ட கருவிகளுடன் உங்களை மேம்படுத்திக் கொள்ளுங்கள்.",
    "SOS": "SOS",
    "Connecting to command control centre": "கமாண்ட் கண்ட்ரோல் சென்டருடன் இணைக்கிறோம்",
    "Help is on the way, stay calm and stay safe.": "உதவி வந்து கொண்டிருக்கிறது, அமைதியாக இருங்கள் மற்றும் பாதுகாப்பாக இருங்கள்.",
    "Cancel": "ரத்து",
    "Hey there,": "வணக்கம்,",
    "Lucy": "லூசி",
    "Fake message": "போலி செய்தி",
    "Share live location": "நேரடி இருப்பிடத்தைப் பகிரவும்",
    "Add Close people": "நெருங்கிய நபர்களைச் சேர்க்கவும்",
    "Add close people and friends for sos": "SOS-க்காக நெருங்கிய நபர்கள் மற்றும் நண்பர்களைச் சேர்க்கவும்",
    "Add friends +": "நண்பர்களைச் சேர்க்கவும் +",
    "Start a journey": "பயணத்தைத் தொடங்குங்கள்",
    "Enter your destination, and the app will track your route in real-time.": "உங்கள் இலக்கை உள்ளிடவும், ஆப்ஸ் உங்கள் பாதையை நிகழ்நேரத்தில் கண்காணிக்கும்.",
    "Police station near me": "எனக்கு அருகிலுள்ள காவல் நிலையம்",
    "Hospital Near me": "எனக்கு அருகிலுள்ள மருத்துவமனை",
    "Pharmacy Near Me": "எனக்கு அருகிலுள்ள மருந்தகம்",
    "Read More →": "மேலும் படிக்க →",
    "Preferences": "விருப்பத்தேர்வுகள்",
    "Manage Friends": "நண்பர்களை நிர்வகிக்கவும்",
    "Change language": "மொழியை மாற்றவும்",
    "Customise / Themes": "தனிப்பயனாக்கு / தீம்கள்",
    "More": "மேலும்",
    "Help Line numbers": "ஹெல்ப்லைன் எண்கள்",
    "Connectivity settings": "இணைப்பு அமைப்புகள்",
    "Help & support": "உதவி மற்றும் ஆதரவு",
    "About us": "எங்களைப் பற்றி",
    "Select Language": "மொழியைத் தேர்ந்தெடுக்கவும்",
    "Legal Assistant": "சட்ட உதவியாளர்",
    "Online": "ஆன்லைன்",
    "Type your question...": "உங்கள் கேள்வியைத் தட்டச்சு செய்யவும்...",
    "Mom": "அம்மா",
    "Best Friend": "சிறந்த நண்பர்",
    "Are you safe?": "நீங்கள் பாதுகாப்பாக இருக்கிறீர்களா?",
    "Call me!": "என்னை அழையுங்கள்!",
    "Hi! Are you safe?": "வணக்கம்! நீங்கள் பாதுகாப்பாக இருக்கிறீர்களா?",
    "Message...": "செய்தி...",
    "Chats": "அரட்டைகள்",
    "Search contacts...": "தொடர்புகளைத் தேடுங்கள்...",
    "Live Sharing": "நேரடி பகிர்வு",
    "Live location sharing active": "நேரடி இருப்பிடப் பகிர்வு செயலில் உள்ளது",
    "Your trusted contacts can see your live location.": "உங்கள் நம்பகமான தொடர்புகள் உங்கள் நேரடி இருப்பிடத்தைப் பார்க்கலாம்.",
    "Stop sharing": "பகிர்வதை நிறுத்து",
    "Set Duration": "கால அளவை அமைக்கவும்",
    "minutes": "நிமிடங்கள்",
    "Share Location": "இருப்பிடத்தைப் பகிரவும்",
    "Choose how you want to share your location.": "உங்கள் இருப்பிடத்தை எப்படிப் பகிர விரும்புகிறீர்கள் என்பதைத் தேர்வு செய்யவும்.",
    "Time-based sharing": "நேரம் சார்ந்த பகிர்வு",
    "Live sharing": "நேரடி பகிர்வு",
    "Rising from the Ashes: The Story of Jhanvi Singh": "சாம்பலில் இருந்து எழுதல்: ஜான்வி சிங்கின் கதை",
    "Jhanvi Singh was once a vibrant young woman whose dreams were shattered after surviving a traumatic assault, leaving her struggling with fear and self-doubt. Determined not to let her pain define her, she sought therapy and began volunteering to support other survivors, finding strength in their shared resilience. Inspired by these stories, Jhanvi launched a tech startup, Phoenix Enterprises, creating innovative safety tools for women. See more": "ஜான்வி சிங் ஒரு காலத்தில் துடிப்பான இளம் பெண்ணாக இருந்தார், அவரது கனவுகள் ஒரு அதிர்ச்சிகரமான தாக்குதலில் இருந்து தப்பிய பிறகு சிதைந்தன, அவர் பயம் மற்றும் சுய சந்தேகத்துடன் போராடினார். தனது வலி தன்னை வரையறுக்க விடக்கூடாது என்று உறுதியுடன், அவர் சிகிச்சையை நாடினார் மற்றும் பிற உயிர் பிழைத்தவர்களுக்கு ஆதரவளிக்க தன்னார்வத் தொண்டு செய்யத் தொடங்கினார், அவர்களின் பகிரப்பட்ட மீள்தன்மையில் வலிமையைக் கண்டார். இந்தக் கதைகளால் ஈர்க்கப்பட்டு, ஜான்வி பீனிக்ஸ் என்டர்பிரைசஸ் என்ற தொழில்நுட்ப ஸ்டார்ட்அப்பைத் தொடங்கினார், இது பெண்களுக்கான புதுமையான பாதுகாப்பு கருவிகளை உருவாக்குகிறது. மேலும் பார்க்க",
    "My Story": "எனது கதை",
    "A new story uploaded by me.": "என்னால் பதிவேற்றப்பட்ட புதிய கதை.",
    "My community": "எனது சமூகம்",
    "Our community is a safe, supportive, and empowering.": "எங்கள் சமூகம் பாதுகாப்பான, ஆதரவான மற்றும் அதிகாரமளிக்கும்.",
    "Search Legal women rights": "சட்டரீதியான பெண்கள் உரிமைகளைத் தேடுங்கள்",
    "Write about your photo...": "உங்கள் புகைப்படத்தைப் பற்றி எழுதுங்கள்...",
    "SOS Activated!": "SOS செயல்படுத்தப்பட்டது!",
    "I'm sorry, I couldn't process that.": "மன்னிக்கவும், அதை என்னால் செயலாக்க முடியவில்லை.",
    "Personal Details": "தனிப்பட்ட விவரங்கள்",
    "Please provide your basic information to get started.": "தொடங்குவதற்கு உங்கள் அடிப்படைத் தகவலை வழங்கவும்.",
    "Full Name": "முழு பெயர்",
    "Phone Number": "தொலைபேசி எண்",
    "Email Address (Optional)": "மின்னஞ்சல் முகவரி (விருப்பமானது)",
    "Please fill in your name and phone number.": "உங்கள் பெயர் மற்றும் தொலைபேசி எண்ணை நிரப்பவும்.",
    "Continue": "தொடரவும்",
    "You are a knowledgeable legal assistant specializing in domestic violence laws and women's rights. Provide supportive, accurate, and empathetic legal information. Keep your answers concise and short. Always advise the user to seek professional legal counsel for their specific situation.": "நீங்கள் வீட்டு வன்முறைச் சட்டங்கள் மற்றும் பெண்கள் உரிமைகளில் நிபுணத்துவம் பெற்ற ஒரு அறிவுள்ள சட்ட உதவியாளர். ஆதரவான, துல்லியமான மற்றும் அனுதாபமான சட்டத் தகவல்களை வழங்கவும். உங்கள் பதில்களை சுருக்கமாகவும் சுருக்கமாகவும் வைத்திருங்கள். பயனரின் குறிப்பிட்ட சூழ்நிலைக்கு தொழில்முறை சட்ட ஆலோசனையைப் பெற எப்போதும் அறிவுறுத்துங்கள்.",
    "\"I turned my pain into power. Today, as a CEO, I stand as proof that no matter your past, you can rise and thrive.\"": "\"நான் என் வலியை சக்தியாக மாற்றினேன். இன்று, ஒரு சிஇஓவாக, உங்கள் கடந்த காலம் எதுவாக இருந்தாலும், நீங்கள் எழுந்து முன்னேற முடியும் என்பதற்கு நான் சான்றாக நிற்கிறேன்.\"",
    "Jhanvi Singh": "ஜான்வி சிங்",
    "Police Stations Near Me": "எனக்கு அருகிலுள்ள காவல் நிலையங்கள்",
    "Hospitals Near Me": "எனக்கு அருகிலுள்ள மருத்துவமனைகள்",
    "Pharmacies Near Me": "எனக்கு அருகிலுள்ள மருந்தகங்கள்",
    "Unnamed police": "பெயரிடப்படாத காவல் நிலையம்",
    "Unnamed hospital": "பெயரிடப்படாத மருத்துவமனை",
    "Unnamed pharmacy": "பெயரிடப்படாத மருந்தகம்",
    "Searching nearby...": "அருகிலுள்ள இடங்களைத் தேடுகிறது...",
    "Failed to find nearby places. Please try again later.": "அருகிலுள்ள இடங்களைக் கண்டறிய முடியவில்லை. பிறகு முயற்சிக்கவும்.",
    "Location permission denied or unavailable.": "இருப்பிட அனுமதி மறுக்கப்பட்டது அல்லது கிடைக்கவில்லை.",
    "No results found in your area.": "உங்கள் பகுதியில் முடிவுகள் எதுவும் கிடைக்கவில்லை.",
    "Try Again": "மீண்டும் முயற்சி செய்",
    "away": "தொலைவில்",
    "Directions": "திசைகள்",
    "You are here": "நீங்கள் இங்கே இருக்கிறீர்கள்",
    "Navigate to Nearest": "அருகிலுள்ள இடத்திற்குச் செல்லவும்",
    "Open in Google Maps": "கூகுள் மேப்ஸில் திறக்கவும்",
    "Find my location": "எனது இருப்பிடத்தைக் கண்டறியவும்",
    "Scanning location...": "இருப்பிடத்தை ஸ்கேன் செய்கிறது...",
    "Location found": "இருப்பிடம் கண்டறியப்பட்டது",
    "Latitude": "அட்சரேகை",
    "Longitude": "தீர்க்கரேகை",
    "View on Map": "வரைபடத்தில் காண்க",
    "Refresh": "புதுப்பிக்கவும்",
    "Copy": "நகலெடு",
    "Coordinates copied!": "அட்சரேகைகள் நகலெடுக்கப்பட்டன!",
    "Error": "பிழை",
    "Location request timed out. Please check your GPS settings.": "இருப்பிடக் கோரிக்கை காலாவதியானது. உங்கள் ஜிபிஎஸ் அமைப்புகளைச் சரிபார்க்கவும்.",
    "Verification": "சரிபார்ப்பு",
    "Enter User Phone Number": "பயனர் தொலைபேசி எண்ணை உள்ளிடவும்",
    "Phone numbers do not match. Access to dashboard denied.": "தொலைபேசி எண்கள் பொருந்தவில்லை. டாஷ்போர்டுக்கான அணுகல் மறுக்கப்பட்டது.",
    "The system verifies the phone number entered by the user against the guardian’s phone number. If both numbers match, access to the dashboard is granted.": "பயனர் உள்ளிட்ட தொலைபேசி எண்ணை பாதுகாவலரின் தொலைபேசி எண்ணுடன் கணினி சரிபார்க்கிறது. இரண்டு எண்களும் பொருந்தினால், டாஷ்போர்டுக்கான அணுகல் வழங்கப்படும்.",
  },
  Telugu: {
    "Your Safety, Our Priority.": "మీ భద్రత, మా ప్రాధాన్యత.",
    "Hey there! Welcome to Iris. Empower yourself with tools designed to keep you safe, informed, and connected anytime, anywhere.": "నమస్కారం! ఐరిస్‌కు స్వాగతం. మిమ్మల్ని సురక్షితంగా ఉంచడానికి, సమాచారం అందించడానికి మరియు ఎప్పుడైనా, ఎక్కడైనా కనెక్ట్ అయి ఉండటానికి రూపొందించబడిన సాధనాలతో మిమ్మల్ని మీరు శక్తివంతం చేసుకోండి.",
    "SOS": "SOS",
    "Connecting to command control centre": "కమాండ్ కంట్రోల్ సెంటర్‌కు కనెక్ట్ అవుతోంది",
    "Help is on the way, stay calm and stay safe.": "సహాయం వస్తోంది, ప్రశాంతంగా ఉండండి మరియు సురక్షితంగా ఉండండి.",
    "Cancel": "రద్దు చేయి",
    "Hey there,": "నమస్కారం,",
    "Lucy": "లూసీ",
    "Fake message": "నకిలీ సందేశం",
    "Share live location": "లైవ్ లొకేషన్‌ను షేర్ చేయండి",
    "Add Close people": "సన్నిహితులను జోడించండి",
    "Add close people and friends for sos": "SOS కోసం సన్నిహితులు మరియు స్నేహితులను జోడించండి",
    "Add friends +": "స్నేహితులను జోడించండి +",
    "Start a journey": "ప్రయాణాన్ని ప్రారంభించండి",
    "Enter your destination, and the app will track your route in real-time.": "మీ గమ్యాన్ని నమోదు చేయండి, మరియు యాప్ మీ మార్గాన్ని నిజ సమయంలో ట్రాక్ చేస్తుంది.",
    "Police station near me": "నా దగ్గర ఉన్న పోలీస్ స్టేషన్",
    "Hospital Near me": "నా దగ్గర ఉన్న ఆసుపత్రి",
    "Pharmacy Near Me": "నా దగ్గర ఉన్న ఫార్మసీ",
    "Read More →": "మరింత చదవండి →",
    "Preferences": "ప్రాధాన్యతలు",
    "Manage Friends": "స్నేహితులను నిర్వహించండి",
    "Change language": "భాషను మార్చండి",
    "Customise / Themes": "కస్టమైజ్ / థీమ్‌లు",
    "More": "మరిన్ని",
    "Help Line numbers": "హెల్ప్‌లైన్ నంబర్లు",
    "Connectivity settings": "కనెక్టివిటీ సెట్టింగ్‌లు",
    "Help & support": "సహాయం మరియు మద్దతు",
    "About us": "మా గురించి",
    "Select Language": "భాషను ఎంచుకోండి",
    "Legal Assistant": "లీగల్ అసిస్టెంట్",
    "Online": "ఆన్‌లైన్",
    "Type your question...": "మీ ప్రశ్నను టైప్ చేయండి...",
    "Mom": "అమ్మ",
    "Best Friend": "ఉత్తమ స్నేహితుడు",
    "Are you safe?": "మీరు సురక్షితంగా ఉన్నారా?",
    "Call me!": "నాకు కాల్ చేయండి!",
    "Hi! Are you safe?": "నమస్కారం! మీరు సురక్షితంగా ఉన్నారా?",
    "Message...": "సందేశం...",
    "Chats": "చాట్‌లు",
    "Search contacts...": "కాంటాక్ట్‌లను శోధించండి...",
    "Live Sharing": "లైవ్ షేరింగ్",
    "Live location sharing active": "లైవ్ లొకేషన్ షేరింగ్ యాక్టివ్‌గా ఉంది",
    "Your trusted contacts can see your live location.": "మీ నమ్మకమైన కాంటాక్ట్‌లు మీ లైవ్ లొకేషన్‌ను చూడగలరు.",
    "Stop sharing": "షేరింగ్‌ను ఆపివేయండి",
    "Set Duration": "వ్యవధిని సెట్ చేయండి",
    "minutes": "నిమిషాలు",
    "Share Location": "లొకేషన్‌ను షేర్ చేయండి",
    "Choose how you want to share your location.": "మీ లొకేషన్‌ను ఎలా షేర్ చేయాలనుకుంటున్నారో ఎంచుకోండి.",
    "Time-based sharing": "సమయం ఆధారిత షేరింగ్",
    "Live sharing": "లైవ్ షేరింగ్",
    "Rising from the Ashes: The Story of Jhanvi Singh": "బూడిద నుండి లేవడం: జానువి సింగ్ కథ",
    "Jhanvi Singh was once a vibrant young woman whose dreams were shattered after surviving a traumatic assault, leaving her struggling with fear and self-doubt. Determined not to let her pain define her, she sought therapy and began volunteering to support other survivors, finding strength in their shared resilience. Inspired by these stories, Jhanvi launched a tech startup, Phoenix Enterprises, creating innovative safety tools for women. See more": "జానువి సింగ్ ఒకప్పుడు ఉత్సాహవంతురాలైన యువతి, ఒక బాధాకరమైన దాడి నుండి బయటపడిన తర్వాత ఆమె కలలు చెదిరిపోయాయి, ఆమె భయం మరియు ఆత్మ-సందేహంతో పోరాడుతోంది. తన బాధ తనను నిర్వచించకూడదని నిర్ణయించుకుని, ఆమె థెరపీని ఆశ్రయించింది మరియు ఇతర బాధితులకు మద్దతు ఇవ్వడానికి స్వచ్ఛందంగా పనిచేయడం ప్రారంభించింది, వారి భాగస్వామ్య స్థితిస్థాపకతలో బలాన్ని కనుగొంది. ఈ కథల నుండి ప్రేరణ పొంది, జానువి ఫీనిక్స్ ఎంటర్‌ప్రైజెస్ అనే టెక్ స్టార్టప్‌ను ప్రారంభించింది, ఇది మహిళల కోసం వినూత్న భద్రతా సాధనాలను సృష్టిస్తోంది. మరిన్ని చూడండి",
    "My Story": "నా కథ",
    "A new story uploaded by me.": "నా ద్వారా అప్‌లోడ్ చేయబడిన కొత్త కథ.",
    "My community": "నా కమ్యూనిటీ",
    "Our community is a safe, supportive, and empowering.": "మా కమ్యూనిటీ సురక్షితమైనది, మద్దతు ఇచ్చేది మరియు శక్తివంతం చేసేది.",
    "Search Legal women rights": "చట్టపరమైన మహిళా హక్కులను శోధించండి",
    "Write about your photo...": "మీ ఫోటో గురించి రాయండి...",
    "SOS Activated!": "SOS యాక్టివేట్ చేయబడింది!",
    "I'm sorry, I couldn't process that.": "క్షమించండి, నేను దానిని ప్రాసెస్ చేయలేకపోయాను.",
    "Personal Details": "వ్యక్తిగత వివరాలు",
    "Please provide your basic information to get started.": "ప్రారంభించడానికి దయచేసి మీ ప్రాథమిక సమాచారాన్ని అందించండి.",
    "Full Name": "పూర్తి పేరు",
    "Phone Number": "ఫోన్ నంబర్",
    "Email Address (Optional)": "ఇమెయిల్ చిరునామా (ఐచ్ఛికం)",
    "Please fill in your name and phone number.": "దయచేసి మీ పేరు మరియు ఫోన్ నంబర్‌ను పూరించండి.",
    "Continue": "కొనసాగించు",
    "You are a knowledgeable legal assistant specializing in domestic violence laws and women's rights. Provide supportive, accurate, and empathetic legal information. Keep your answers concise and short. Always advise the user to seek professional legal counsel for their specific situation.": "మీరు గృహ హింస చట్టాలు మరియు మహిళా హక్కులలో ప్రత్యేకత కలిగిన పరిజ్ఞానం ఉన్న లీగల్ అసిస్టెంట్. మద్దతు ఇచ్చే, ఖచ్చితమైన మరియు సానుభూతితో కూడిన చట్టపరమైన సమాచారాన్ని అందించండి. మీ సమాధానాలను క్లుప్తంగా మరియు చిన్నవిగా ఉంచండి. వినియోగదారు వారి నిర్దిష్ట పరిస్థితి కోసం వృత్తిపరమైన చట్టపరమైన సలహాను పొందాలని ఎల్లప్పుడూ సలహా ఇవ్వండి.",
    "\"I turned my pain into power. Today, as a CEO, I stand as proof that no matter your past, you can rise and thrive.\"": "\"నేను నా బాధను శక్తిగా మార్చుకున్నాను. ఈరోజు, సీఈఓగా, మీ గతం ఏమైనా సరే, మీరు ఎదగగలరని మరియు అభివృద్ధి చెందగలరని నేను నిరూపిస్తున్నాను.\"",
    "Jhanvi Singh": "జానువి సింగ్",
    "Police Stations Near Me": "నా దగ్గర ఉన్న పోలీస్ స్టేషన్లు",
    "Hospitals Near Me": "నా దగ్గర ఉన్న ఆసుపత్రులు",
    "Pharmacies Near Me": "నా దగ్గర ఉన్న ఫార్మసీలు",
    "Unnamed police": "పేరు లేని పోలీస్ స్టేషన్",
    "Unnamed hospital": "పేరు లేని ఆసుపత్రి",
    "Unnamed pharmacy": "పేరు లేని ఫార్మసీ",
    "Searching nearby...": "దగ్గరలో వెతుకుతోంది...",
    "Failed to find nearby places. Please try again later.": "దగ్గరలోని ప్రదేశాలను కనుగొనడంలో విఫలమైంది. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.",
    "Location permission denied or unavailable.": "లొకేషన్ అనుమతి నిరాకరించబడింది లేదా అందుబాటులో లేదు.",
    "No results found in your area.": "మీ ప్రాంతంలో ఎటువంటి ఫలితాలు కనుగొనబడలేదు.",
    "Try Again": "మళ్ళీ ప్రయత్నించండి",
    "away": "దూరంలో",
    "Directions": "దిశలు",
    "You are here": "మీరు ఇక్కడ ఉన్నారు",
    "Navigate to Nearest": "దగ్గరలోని దానికి నావిగేట్ చేయండి",
    "Open in Google Maps": "గూగుల్ మ్యాప్స్‌లో తెరవండి",
    "Find my location": "నా స్థానాన్ని కనుగొనండి",
    "Scanning location...": "స్థానాన్ని స్కాన్ చేస్తోంది...",
    "Location found": "స్థానం కనుగొనబడింది",
    "Latitude": "అక్షాంశం",
    "Longitude": "రేఖాంశం",
    "View on Map": "మ్యాప్‌లో చూడండి",
    "Refresh": "రిఫ్రెష్ చేయండి",
    "Copy": "కాపీ చేయండి",
    "Coordinates copied!": "కోఆర్డినేట్లు కాపీ చేయబడ్డాయి!",
    "Error": "లోపం",
    "Location request timed out. Please check your GPS settings.": "స్థాన అభ్యర్థన గడువు ముగిసింది. దయచేసి మీ GPS సెట్టింగ్‌లను తనిఖీ చేయండి.",
    "Verification": "ధృవీకరణ",
    "Enter User Phone Number": "వినియోగదారు ఫోన్ నంబర్‌ను నమోదు చేయండి",
    "Phone numbers do not match. Access to dashboard denied.": "ఫోన్ నంబర్లు సరిపోలలేదు. డ్యాష్‌బోర్డ్ యాక్సెస్ నిరాకరించబడింది.",
    "The system verifies the phone number entered by the user against the guardian’s phone number. If both numbers match, access to the dashboard is granted.": "వినియోగదారు నమోదు చేసిన ఫోన్ నంబర్‌ను గార్డియన్ ఫోన్ నంబర్‌తో సిస్టమ్ ధృవీకరిస్తుంది. రెండు నంబర్లు సరిపోలితే, డ్యాష్‌బోర్డ్ యాక్సెస్ మంజూరు చేయబడుతుంది.",
  },
  Marathi: {
    "Your Safety, Our Priority.": "तुमची सुरक्षा, आमची प्राथमिकता.",
    "Hey there! Welcome to Iris. Empower yourself with tools designed to keep you safe, informed, and connected anytime, anywhere.": "नमस्कार! आयरीसमध्ये तुमचे स्वागत आहे. तुम्हाला सुरक्षित, माहितीपूर्ण आणि कधीही, कुठेही कनेक्ट राहण्यासाठी डिझाइन केलेल्या साधनांसह स्वतःला सक्षम करा.",
    "SOS": "SOS",
    "Connecting to command control centre": "कमांड कंट्रोल सेंटरशी कनेक्ट करत आहे",
    "Help is on the way, stay calm and stay safe.": "मदत येत आहे, शांत राहा आणि सुरक्षित राहा.",
    "Cancel": "रद्द करा",
    "Hey there,": "नमस्कार,",
    "Lucy": "लुसी",
    "Fake message": "खोटा संदेश",
    "Share live location": "थेट स्थान शेअर करा",
    "Add Close people": "जवळच्या लोकांना जोडा",
    "Add close people and friends for sos": "SOS साठी जवळच्या लोकांना आणि मित्रांना जोडा",
    "Add friends +": "मित्रांना जोडा +",
    "Start a journey": "प्रवास सुरू करा",
    "Enter your destination, and the app will track your route in real-time.": "तुमचे गंतव्यस्थान प्रविष्ट करा आणि ॲप तुमच्या मार्गाचा रिअल-टाइममध्ये मागोवा घेईल.",
    "Police station near me": "माझ्या जवळचे पोलीस स्टेशन",
    "Hospital Near me": "माझ्या जवळचे रुग्णालय",
    "Pharmacy Near Me": "माझ्या जवळचे फार्मसी",
    "Read More →": "आणखी वाचा →",
    "Preferences": "प्राधान्ये",
    "Manage Friends": "मित्रांचे व्यवस्थापन करा",
    "Change language": "भाषा बदला",
    "Customise / Themes": "कस्टमाइझ / थीम्स",
    "More": "अधिक",
    "Help Line numbers": "हेल्पलाइन नंबर",
    "Connectivity settings": "कनेक्टिव्हिटी सेटिंग्ज",
    "Help & support": "मदत आणि समर्थन",
    "About us": "आमच्याबद्दल",
    "Select Language": "भाषा निवडा",
    "Legal Assistant": "कायदेशीर सहाय्यक",
    "Online": "ऑनलाइन",
    "Type your question...": "तुमचा प्रश्न टाईप करा...",
    "Mom": "आई",
    "Best Friend": "सर्वोत्तम मित्र",
    "Are you safe?": "तुम्ही सुरक्षित आहात का?",
    "Call me!": "मला कॉल करा!",
    "Hi! Are you safe?": "नमस्कार! तुम्ही सुरक्षित आहात का?",
    "Message...": "संदेश...",
    "Chats": "चॅट्स",
    "Search contacts...": "संपर्क शोधा...",
    "Live Sharing": "थेट शेअरिंग",
    "Live location sharing active": "थेट स्थान शेअरिंग सक्रिय आहे",
    "Your trusted contacts can see your live location.": "तुमचे विश्वसनीय संपर्क तुमचे थेट स्थान पाहू शकतात.",
    "Stop sharing": "शेअरिंग थांबवा",
    "Set Duration": "कालावधी सेट करा",
    "minutes": "मिनिटे",
    "Share Location": "स्थान शेअर करा",
    "Choose how you want to share your location.": "तुम्हाला तुमचे स्थान कसे शेअर करायचे आहे ते निवडा.",
    "Time-based sharing": "वेळेवर आधारित शेअरिंग",
    "Live sharing": "थेट शेअरिंग",
    "Rising from the Ashes: The Story of Jhanvi Singh": "राखेतून भरारी: जानवी सिंगची गोष्ट",
    "Jhanvi Singh was once a vibrant young woman whose dreams were shattered after surviving a traumatic assault, leaving her struggling with fear and self-doubt. Determined not to let her pain define her, she sought therapy and began volunteering to support other survivors, finding strength in their shared resilience. Inspired by these stories, Jhanvi launched a tech startup, Phoenix Enterprises, creating innovative safety tools for women. See more": "जानवी सिंग एकेकाळी एक उत्साही तरुण स्त्री होती, जिची स्वप्ने एका आघातकारक हल्ल्यातून वाचल्यानंतर उद्ध्वस्त झाली होती, ज्यामुळे ती भीती आणि आत्म-शंकांशी झुंजत होती. आपल्या वेदनांना स्वतःला परिभाषित करू न देण्याचा निर्धार करून, तिने थेरपी घेतली आणि इतर वाचलेल्यांना मदत करण्यासाठी स्वयंसेवा करण्यास सुरुवात केली, त्यांच्या सामायिक लवचिकतेमध्ये शक्ती शोधली. या कथांपासून प्रेरित होऊन, जानवीने फीनिक्स एंटरप्राइजेस नावाचा टेक स्टार्टअप सुरू केला, जो महिलांसाठी नाविन्यपूर्ण सुरक्षा साधने तयार करत आहे. अधिक पहा",
    "My Story": "माझी गोष्ट",
    "A new story uploaded by me.": "माझ्याद्वारे अपलोड केलेली एक नवीन गोष्ट.",
    "My community": "माझा समुदाय",
    "Our community is a safe, supportive, and empowering.": "आमचा समुदाय सुरक्षित, आश्वासक आणि सक्षम करणारा आहे.",
    "Search Legal women rights": "कायदेशीर महिला हक्क शोधा",
    "Write about your photo...": "तुमच्या फोटोबद्दल लिहा...",
    "SOS Activated!": "SOS सक्रिय झाले!",
    "I'm sorry, I couldn't process that.": "क्षमस्व, मी ते प्रक्रिया करू शकलो नाही.",
    "Personal Details": "वैयक्तिक तपशील",
    "Emergency Details": "आणीबाणीचे तपशील",
    "Guardian Contacts": "पालक संपर्क",
    "Location & Safety": "स्थान आणि सुरक्षा",
    "SOS Settings": "SOS सेटिंग्ज",
    "Privacy & Permissions": "गोपनीयता आणि परवानग्या",
    "App Preferences": "अॅप प्राधान्ये",
    "Setup Iris": "आयरीस सेटअप करा",
    "Finish Setup": "सेटअप पूर्ण करा",
    "Or": "किंवा",
    "Continue with Google": "Google सह सुरू ठेवा",
    "Female": "स्त्री",
    "Male": "पुरुष",
    "Other": "इतर",
    "Guardian Name": "पालकाचे नाव",
    "Guardian Phone": "पालकाचा फोन",
    "Live Location Tracking": "थेट स्थान ट्रॅकिंग",
    "Enable for real-time guardian updates": "रिअल-टाइम पालक अपडेटसाठी सक्षम करा",
    "Power Button 3x": "पॉवर बटण 3x",
    "Voice Trigger": "व्हॉइस ट्रिगर",
    "Shake Device": "डिव्हाइस हलवा",
    "I accept the Privacy Policy and Terms of Service": "मी गोपनीयता धोरण आणि सेवा अटी स्वीकारतो",
    "We value your privacy. Your data is encrypted and only shared with your chosen guardians during emergencies.": "आम्ही तुमच्या गोपनीयतेची कदर करतो. तुमचा डेटा एन्क्रिप्ट केलेला आहे आणि केवळ आणीबाणीच्या वेळी तुमच्या निवडलेल्या पालकांसोबत शेअर केला जातो.",
    "Add critical information for first responders.": "प्रथम प्रतिसादकर्त्यांसाठी महत्त्वपूर्ण माहिती जोडा.",
    "Medical conditions, allergies, etc.": "वैद्यकीय परिस्थिती, ॲलर्जी इ.",
    "Please fill in your name.": "कृपया तुमचे नाव भरा.",
    "Please fill in guardian details.": "कृपया पालकांचे तपशील भरा.",
    "Please accept the privacy policy.": "कृपया गोपनीयता धोरण स्वीकारा.",
    "Please provide your basic information to get started.": "सुरू करण्यासाठी कृपया तुमची मूलभूत माहिती प्रदान करा.",
    "Full Name": "पूर्ण नाव",
    "Phone Number": "फोन नंबर",
    "Email Address (Optional)": "ईमेल पत्ता (पर्यायी)",
    "Please fill in your name and phone number.": "कृपया तुमचे नाव आणि फोन नंबर भरा.",
    "Continue": "सुरू ठेवा",
    "You are a knowledgeable legal assistant specializing in domestic violence laws and women's rights. Provide supportive, accurate, and empathetic legal information. Keep your answers concise and short. Always advise the user to seek professional legal counsel for their specific situation.": "तुम्ही घरगुती हिंसाचार कायदे आणि महिला हक्क यामध्ये तज्ञ असलेले एक जाणकार कायदेशीर सहाय्यक आहात. आश्वासक, अचूक आणि सहानुभूतीपूर्ण कायदेशीर माहिती प्रदान करा. तुमची उत्तरे संक्षिप्त आणि लहान ठेवा. वापरकर्त्याला त्यांच्या विशिष्ट परिस्थितीसाठी व्यावसायिक कायदेशीर सल्ला घेण्याचा सल्ला नेहमी द्या.",
    "\"I turned my pain into power. Today, as a CEO, I stand as proof that no matter your past, you can rise and thrive.\"": "\"मी माझ्या वेदनांचे शक्तीमध्ये रूपांतर केले. आज, सीईओ म्हणून, मी याचा पुरावा आहे की तुमचा भूतकाळ काहीही असो, तुम्ही उठू शकता आणि प्रगती करू शकता.\"",
    "Jhanvi Singh": "जानवी सिंग",
    "Police Stations Near Me": "माझ्या जवळचे पोलीस स्टेशन",
    "Hospitals Near Me": "माझ्या जवळची रुग्णालये",
    "Pharmacies Near Me": "माझ्या जवळची फार्मसी",
    "Unnamed police": "अनामित पोलीस स्टेशन",
    "Unnamed hospital": "अनामित रुग्णालय",
    "Unnamed pharmacy": "अनामित फार्मसी",
    "Searching nearby...": "जवळपास शोधत आहे...",
    "Failed to find nearby places. Please try again later.": "जवळपासची ठिकाणे शोधण्यात अयशस्वी. कृपया नंतर पुन्हा प्रयत्न करा.",
    "Location permission denied or unavailable.": "स्थान परवानगी नाकारली किंवा अनुपलब्ध.",
    "No results found in your area.": "तुमच्या भागात कोणतेही निकाल आढळले नाहीत.",
    "Try Again": "पुन्हा प्रयत्न करा",
    "away": "लांब",
    "Directions": "दिशा-निर्देश",
    "You are here": "तुम्ही इथे आहात",
    "Navigate to Nearest": "जवळच्या ठिकाणी नेव्हिगेट करा",
    "Open in Google Maps": "गूगल मॅप्समध्ये उघडा",
    "Find my location": "माझे स्थान शोधा",
    "Scanning location...": "स्थान स्कॅन करत आहे...",
    "Location found": "स्थान सापडले",
    "Latitude": "अक्षांश",
    "Longitude": "रेखांश",
    "View on Map": "नकाशावर पहा",
    "Refresh": "रिफ्रेश करा",
    "Copy": "कॉपी करा",
    "Coordinates copied!": "कोऑर्डिनेट्स कॉपी केले!",
    "Error": "त्रुटी",
    "Location request timed out. Please check your GPS settings.": "स्थान विनंतीची वेळ संपली. कृपया तुमची GPS सेटिंग्ज तपासा.",
    "Verification": "सत्यापन",
    "Enter User Phone Number": "वापरकर्ता फोन नंबर प्रविष्ट करा",
    "Phone numbers do not match. Access to dashboard denied.": "फोन नंबर जुळत नाहीत. डॅशबोर्डवर प्रवेश नाकारला.",
    "The system verifies the phone number entered by the user against the guardian’s phone number. If both numbers match, access to the dashboard is granted.": "प्रणाली वापरकर्त्याने प्रविष्ट केलेल्या फोन नंबरची पालकांच्या फोन नंबरशी पडताळणी करते. दोन्ही नंबर जुळल्यास, डॅशबोर्डवर प्रवेश दिला जातो.",
  },
};

export default function App() {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState({ name: "Rose", primary: "#f43f5e" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setGoogleUser({
          name: user.displayName,
          email: user.email,
          picture: user.photoURL,
          uid: user.uid
        });
        
        // Sync user profile to Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      } else {
        setGoogleUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log('Login cancelled by user');
        return;
      }
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const [contacts, setContacts] = useState<{ name: string, phone: string }[]>(() => {
    const saved = localStorage.getItem('contacts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', theme.primary);
  }, [theme]);

  const handleAddContact = async (contact: { name: string, phone: string, email?: string }) => {
    const cleanPhone = contact.phone.replace(/\s+/g, '');
    const savePhone = cleanPhone.slice(-10);
    const cleanContact = { ...contact, phone: savePhone };
    setContacts(prev => [...prev, cleanContact]);
    
    if (firebaseUser) {
      await addDoc(collection(db, 'users', firebaseUser.uid, 'guardians'), cleanContact);
    }
  };

  const t = (key: string) => (translations[language] && translations[language][key]) || key;
  const slides = getSlides(t);
  const [role, setRole] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pin, setPin] = useState("");
  const [isPinSet, setIsPinSet] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showBasicNeedsSetup, setShowBasicNeedsSetup] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [personalDetails, setPersonalDetails] = useState<{ name: string, phone: string, email: string } | null>(null);
  const [emergencyDetails, setEmergencyDetails] = useState<string>("");
  const [sosTrigger, setSosTrigger] = useState<string>("Power Button 3x");
  const [locationEnabled, setLocationEnabled] = useState<boolean>(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTrackMe, setShowTrackMe] = useState(false);
  const [showShareLocation, setShowShareLocation] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showEmergencyHelpline, setShowEmergencyHelpline] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showLiveLocation, setShowLiveLocation] = useState(false);
  const [showSmartAlerts, setShowSmartAlerts] = useState(false);
  const [showExtraFeatures, setShowExtraFeatures] = useState(false);
  const [showSOSConfig, setShowSOSConfig] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatUserId, setChatUserId] = useState("");
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);

  const handleWeeklySafetyCheck = async (userId: string) => {
    try {
      await addDoc(collection(db, 'users', userId, 'safety_checks'), {
        timestamp: serverTimestamp(),
        type: 'weekly_check'
      });
      alert(t("Safety check recorded!"));
    } catch (error) {
      console.error("Safety check error:", error);
    }
  };
  const [nearbyPlacesType, setNearbyPlacesType] = useState<'police' | 'hospital' | 'pharmacy'>('police');
  const [aiChatInput, setAiChatInput] = useState("");
  const [sosRecordings, setSosRecordings] = useState<{ id: number; date: string; location: string; blob: Blob }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // SOS Configuration
  const [voiceTriggerWord, setVoiceTriggerWord] = useState("sos");
  const [shakeThreshold, setShakeThreshold] = useState(30);

  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      await navigator.geolocation.getCurrentPosition(() => {});
      alert(t("Permissions granted!"));
    } catch (err) {
      alert(t("Permissions denied. Please enable them in settings."));
    }
  };

  const triggerSOS = async () => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, 'users', firebaseUser.uid, 'sos_events'), {
        timestamp: serverTimestamp(),
        status: 'active',
        location: 'Automatic Activation',
        type: 'automatic_triggered'
      });
      alert(t("SOS activated!"));
    } catch (error) {
      console.error("SOS trigger error:", error);
    }
  };

  // Shake SOS
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    const handleMotion = (event: DeviceMotionEvent) => {
      const { acceleration } = event;
      if (!acceleration) return;
      const { x, y, z } = acceleration;
      if (x && y && z) {
        const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
        if (delta > shakeThreshold) {
          triggerSOS();
        }
        lastX = x; lastY = y; lastZ = z;
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [firebaseUser, shakeThreshold]);

  // Voice SOS
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        if (transcript.includes(voiceTriggerWord.toLowerCase())) {
          triggerSOS();
        }
      };
      recognition.start();
      return () => recognition.stop();
    }
  }, [firebaseUser, voiceTriggerWord]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowRoleSelection(true);
    }
  };

  if (showRoleSelection) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <RoleSelectionView 
          onComplete={(selectedRole) => { 
            setRole(selectedRole); 
            setShowRoleSelection(false); 
            handleGoogleLogin().then(() => {
              setShowBasicNeedsSetup(true);
            });
          }} 
          t={t} 
        />
      </div>
    </div>
  );

  if (showBasicNeedsSetup) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <BasicNeedsSetup 
          onComplete={async (data, setError) => { 
            setPersonalDetails({ name: data.name, phone: data.phone, email: '' }); 
            setEmergencyDetails(data.emergencyDetails || "");
            setSosTrigger(data.sosTrigger);
            setLocationEnabled(data.locationEnabled);
            if (data.emergencyContact && data.emergencyPhone) {
              handleAddContact({ name: data.emergencyContact, phone: data.emergencyPhone });
            }
            // Save user's own phone number to their document for guardian matching
            if (firebaseUser) {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                phone: data.phone.replace(/\s+/g, ''),
                name: data.name,
                role: role
              }, { merge: true });
            }
            setShowBasicNeedsSetup(false); 
            if (role === 'Guardian') {
              setShowDashboard(true);
            } else {
              setShowPinSetup(true); // Show PIN setup only for Users
            }
          }} 
          onGoogleLogin={handleGoogleLogin}
          t={t} 
          language={language}
          setLanguage={setLanguage}
          role={role}
        />
      </div>
    </div>
  );

  if (showPinSetup) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <SafetyPinSetup 
          onComplete={() => {
            setIsPinSet(true);
            setShowPinSetup(false);
            setShowDashboard(true);
          }}
          setPin={setPin}
          t={t}
        />
      </div>
    </div>
  );

  if (showTrackMe) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <TrackMeView onBack={() => setShowTrackMe(false)} t={t} />
      </div>
    </div>
  );

  if (showSOS) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <SOSView onBack={() => setShowSOS(false)} t={t} />
      </div>
    </div>
  );

  if (showLiveLocation) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <LiveLocationView onBack={() => setShowLiveLocation(false)} t={t} />
      </div>
    </div>
  );

  if (showSmartAlerts) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <SmartAlertsView onBack={() => setShowSmartAlerts(false)} t={t} />
      </div>
    </div>
  );

  if (showSOSConfig) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{t("SOS Configuration")}</h2>
        
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h3 className="font-bold text-blue-900">{t("How Voice SOS works")}</h3>
            <p className="text-sm text-blue-700">{t("Set a secret word. When you say this word, SOS will be activated automatically.")}</p>
            <label className="block text-sm font-medium mt-2">{t("Voice Trigger Word")}</label>
            <input value={voiceTriggerWord} onChange={(e) => setVoiceTriggerWord(e.target.value)} className="w-full border p-2 rounded mt-1" />
          </div>

          <div className="p-4 bg-pink-50 rounded-xl">
            <h3 className="font-bold text-pink-900">{t("How Shake SOS works")}</h3>
            <p className="text-sm text-pink-700">{t("Shake your phone vigorously to activate SOS. Adjust sensitivity below.")}</p>
            <label className="block text-sm font-medium mt-2">{t("Shake Sensitivity (10-100)")}</label>
            <input type="number" value={shakeThreshold} onChange={(e) => setShakeThreshold(Number(e.target.value))} className="w-full border p-2 rounded mt-1" />
          </div>

          <button onClick={() => setShowPermissionModal(true)} className="w-full bg-primary text-white py-3 rounded-xl font-bold">{t("Manage Permissions")}</button>
          <button onClick={() => setShowSOSConfig(false)} className="w-full bg-gray-200 py-3 rounded-xl font-bold">{t("Save & Back")}</button>
        </div>
      </div>

      {showPermissionModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-xs">
            <h3 className="text-xl font-bold mb-4">{t("Permissions Required")}</h3>
            <p className="text-sm mb-6">{t("To enable Voice and Shake SOS, we need access to your microphone, camera, and location.")}</p>
            <div className="space-y-3">
              <button onClick={() => { requestPermissions(); setShowPermissionModal(false); }} className="w-full bg-primary text-white py-3 rounded-xl font-bold">{t("Allow All")}</button>
              <button onClick={() => setShowPermissionModal(false)} className="w-full bg-gray-200 py-3 rounded-xl font-bold">{t("Cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (showExtraFeatures) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <SOSHistoryView onBack={() => setShowExtraFeatures(false)} t={t} sosRecordings={sosRecordings} />
      </div>
    </div>
  );

  if (showAIChat) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <AIChatView onBack={() => { setShowAIChat(false); setAiChatInput(""); }} t={t} initialQuery={aiChatInput} />
      </div>
    </div>
  );

  if (showChat) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <ChatView userId={chatUserId} onBack={() => setShowChat(false)} t={t} />
      </div>
    </div>
  );

  function AIChatView({ onBack, t, initialQuery }: { onBack: () => void, t: (key: string) => string, initialQuery: string }) {
    const [messages, setMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([
      { sender: 'user', text: initialQuery },
      { sender: 'ai', text: "I'm analyzing your situation. Please stay calm. If you are in immediate danger, please press the SOS button." }
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
      if (input.trim()) {
        setMessages([...messages, { sender: 'user', text: input }]);
        setInput("");
        // Simulate AI response
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'ai', text: "I understand. Please continue to stay safe and follow the instructions." }]);
        }, 1000);
      }
    };

    return (
      <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
        {/* Background Lighting Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-pink-100/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-6 z-10">
          <button onClick={onBack} className="mb-4 text-gray-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">← {t("Back")}</button>
          <h2 className="text-2xl font-bold text-gray-900">{t("AI Safety Assistant")}</h2>
        </div>
        <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 flex flex-col border-t border-white/50 shadow-2xl z-10 overflow-hidden">
          <div className="flex-grow space-y-4 overflow-y-auto mb-4 pr-2">
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <span className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm font-medium shadow-sm border ${msg.sender === 'user' ? 'bg-black text-white border-black' : 'bg-white/80 text-gray-800 border-white/80 backdrop-blur-sm'}`}>
                  {msg.text}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="flex gap-2 bg-white/60 backdrop-blur-md p-2 rounded-full border border-white/80 shadow-sm">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-grow px-4 py-2 text-sm outline-none bg-transparent font-medium"
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend} 
              className="bg-black text-white px-6 py-2 rounded-full font-bold text-xs"
            >
              Send
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  function SOSHistoryView({ onBack, t, sosRecordings }: { onBack: () => void, t: (key: string) => string, sosRecordings: { id: number; date: string; location: string; blob: Blob }[] }) {
    return (
      <div className="flex flex-col h-full bg-[#f4f4f2] relative overflow-hidden">
        {/* Background Lighting Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-6 z-10">
          <button onClick={onBack} className="mb-4 text-gray-900 font-bold bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/80 shadow-sm">← {t("Back")}</button>
          <h2 className="text-2xl font-bold text-gray-900">{t("SOS History")}</h2>
        </div>
        <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-6 space-y-6 overflow-y-auto border-t border-white/50 shadow-2xl z-10">
          {sosRecordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <History size={48} className="mb-4 opacity-20" />
              <p className="font-medium italic">{t("No recordings yet")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sosRecordings.map((item) => (
                <motion.div 
                  key={item.id} 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] border border-white/80 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-900 text-sm">{item.date}</p>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                    <MapPin size={10} /> {item.location}
                  </p>
                  <div className="relative rounded-2xl overflow-hidden shadow-inner bg-black">
                    <video src={URL.createObjectURL(item.blob)} controls className="w-full aspect-video object-cover" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showEmergencyHelpline) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <EmergencyHelplineView onBack={() => setShowEmergencyHelpline(false)} t={t} />
      </div>
    </div>
  );

  if (showProfile) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <ProfileView 
          onBack={() => setShowProfile(false)} 
          language={language} 
          setLanguage={setLanguage} 
          t={t} 
          onHelpLineClick={() => { setShowProfile(false); setShowEmergencyHelpline(true); }} 
          contacts={contacts} 
          setContacts={setContacts} 
          theme={theme} 
          setTheme={setTheme} 
          setShowContactModal={setShowContactModal} 
          personalDetails={personalDetails}
          googleUser={googleUser}
          onGoogleLogin={handleGoogleLogin}
          onGoogleLogout={handleGoogleLogout}
        />
      </div>
    </div>
  );

  if (showCommunity) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <CommunityView onBack={() => setShowCommunity(false)} t={t} />
      </div>
    </div>
  );

  if (showShareLocation) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <ShareLocationView onBack={() => setShowShareLocation(false)} t={t} googleUser={googleUser} />
      </div>
    </div>
  );

  if (showNearbyPlaces) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        <NearbyPlacesView type={nearbyPlacesType} onClose={() => setShowNearbyPlaces(false)} t={t} />
      </div>
    </div>
  );

  if (showDashboard) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden">
        {role === 'Guardian' ? (
          <GuardianDashboard t={t} onSOSClick={() => setShowSOS(true)} onLiveLocationClick={() => setShowLiveLocation(true)} onSmartAlertsClick={() => setShowSmartAlerts(true)} onExtraFeaturesClick={() => setShowExtraFeatures(true)} aiChatInput={aiChatInput} setAiChatInput={setAiChatInput} setShowAIChat={setShowAIChat} sosRecordings={sosRecordings} personalDetails={personalDetails} onChatClick={(userId) => { setChatUserId(userId); setShowChat(true); }} onWeeklySafetyCheck={handleWeeklySafetyCheck} firebaseUser={firebaseUser} />
        ) : (
          <Dashboard 
            onProfileClick={() => setShowProfile(true)} 
            onTrackMeClick={() => setShowTrackMe(true)} 
            onShareLocationClick={() => setShowShareLocation(true)} 
            onCommunityClick={() => setShowCommunity(true)} 
            onExtraFeaturesClick={() => setShowExtraFeatures(true)} 
            onNearbyPlacesClick={(type) => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${type}+near+me`, '_blank');
            }}
            t={t} 
            pin={pin} 
            contacts={contacts} 
            handleAddContact={handleAddContact} 
            showContactModal={showContactModal} 
            setShowContactModal={setShowContactModal} 
            personalDetails={personalDetails} 
            sosRecordings={sosRecordings} 
            setSosRecordings={setSosRecordings} 
            mediaRecorderRef={mediaRecorderRef} 
            googleUser={googleUser}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-[9/19] bg-[#f4f4f2] rounded-[3rem] shadow-2xl border-8 border-black relative overflow-hidden flex flex-col">
        {/* Background Lighting Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-8 flex justify-between items-center z-10">
          <h1 className="text-3xl font-serif font-black text-black tracking-tighter">iris</h1>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-white/50">
            <Globe size={20} className="text-gray-400" />
          </div>
        </div>
        <div className="flex-grow relative overflow-hidden z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              className="absolute inset-0 p-8 flex flex-col items-center text-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-pink-200/20 rounded-full blur-3xl" />
                <img src={slides[currentSlide].image} alt={slides[currentSlide].title} className="w-64 h-64 object-contain relative z-10" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-3xl font-black mb-4 text-gray-900 leading-tight">{slides[currentSlide].title}</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">{slides[currentSlide].description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="p-8 flex justify-between items-center z-10 bg-white/40 backdrop-blur-xl border-t border-white/50">
          <motion.button whileHover={{ x: 5 }} className="text-gray-400 font-black text-xs uppercase tracking-widest" onClick={() => setShowRoleSelection(true)}>Skip</motion.button>
          <div className="flex gap-1.5">
            {slides.map((_, index) => (
              <motion.div 
                key={index} 
                animate={{ width: index === currentSlide ? 24 : 6 }}
                className={`h-1.5 rounded-full ${index === currentSlide ? 'bg-black' : 'bg-gray-300'}`} 
              />
            ))}
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSlide}
            className="bg-black text-white p-4 rounded-2xl shadow-2xl"
          >
            <ArrowRight size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
