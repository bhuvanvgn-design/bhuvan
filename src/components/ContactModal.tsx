import { useState, useEffect } from 'react';
import { Search, User, Smartphone, Globe, Loader2, Plus } from 'lucide-react';
import axios from 'axios';

export function ContactModal({ onClose, onAdd, googleUser }: { onClose: () => void, onAdd: (contact: { name: string, phone: string, email?: string }) => void, googleUser?: any }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [importMode, setImportMode] = useState<'manual' | 'google' | 'device'>('manual');
  const [contacts, setContacts] = useState<{ name: string, phone: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGoogleContacts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/contacts');
      setContacts(response.data);
      setImportMode('google');
    } catch (error) {
      console.error('Failed to fetch Google contacts:', error);
      alert('Failed to fetch Google contacts. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceContacts = async () => {
    if (!('contacts' in navigator && 'select' in (navigator as any).contacts)) {
      alert('Contact Picker API is not supported in your browser.');
      return;
    }

    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const selectedContacts = await (navigator as any).contacts.select(props, opts);
      
      const formatted = selectedContacts.map((c: any) => ({
        name: c.name?.[0] || 'Unknown',
        phone: c.tel?.[0] || ''
      })).filter((c: any) => c.phone);

      if (formatted.length > 0) {
        setContacts(formatted);
        setImportMode('device');
      }
    } catch (error) {
      console.error('Contact picker error:', error);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Add Guardian</h2>
          <p className="text-sm text-gray-500">Choose how to add your emergency contact</p>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {importMode === 'manual' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={fetchDeviceContacts}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
                >
                  <Smartphone size={24} />
                  <span className="text-xs font-bold">From Device</span>
                </button>
                <button 
                  onClick={fetchGoogleContacts}
                  disabled={loading}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-colors ${!googleUser ? 'bg-gray-50 text-gray-400' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <Globe size={24} />}
                  <span className="text-xs font-bold">From Google</span>
                  {!googleUser && <span className="text-[10px] opacity-70">(Login first)</span>}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or Manual Entry</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" 
                  />
                </div>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" 
                  />
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address (Optional)" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => setImportMode('manual')}
                className="text-sm text-pink-600 font-bold flex items-center gap-1"
              >
                ← Back to Manual
              </button>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search contacts..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" 
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {filteredContacts.map((c, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      onAdd(c);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                  >
                    <div>
                      <p className="font-bold text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone}</p>
                    </div>
                    <Plus size={16} className="text-pink-500" />
                  </button>
                ))}
                {filteredContacts.length === 0 && (
                  <p className="text-center text-gray-500 py-4 text-sm">No contacts found</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white border border-gray-200 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          {importMode === 'manual' && (
            <button 
              onClick={() => { 
                if (name && phone) {
                  onAdd({ name, phone, email }); 
                  onClose(); 
                }
              }} 
              disabled={!name || !phone}
              className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
