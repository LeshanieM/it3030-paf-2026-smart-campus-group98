import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, Loader2, ShieldCheck, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const NotificationPreferences = ({ onClose }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState([
    { category: 'BOOKING', label: 'Facility Bookings', emailEnabled: true, inAppEnabled: true },
    { category: 'TICKET', label: 'Support Tickets', emailEnabled: true, inAppEnabled: true },
    { category: 'SYSTEM', label: 'System Alerts', emailEnabled: false, inAppEnabled: true },
  ]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const response = await axiosInstance.get(`/notifications/preferences`);
        if (response.data && response.data.length > 0) {
          setPreferences(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch preferences', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, [user?.id]);

  const togglePreference = (index, field) => {
    const newPrefs = [...preferences];
    newPrefs[index][field] = !newPrefs[index][field];
    setPreferences(newPrefs);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const pref of preferences) {
        await axiosInstance.put(`/notifications/preferences`, null, {
          params: {
            category: pref.category,
            emailEnabled: pref.emailEnabled,
            inAppEnabled: pref.inAppEnabled
          }
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save preferences', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-['Playfair_Display',serif] uppercase tracking-tight">Preferences</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Notification Channels</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Category</div>
            <div className="flex justify-around text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Email</span>
              <span>App</span>
            </div>
          </div>

          {preferences.map((pref, idx) => (
            <div key={pref.category} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors shadow-sm">
                   {pref.category === 'BOOKING' ? <Bell size={16} /> : pref.category === 'TICKET' ? <Smartphone size={16} /> : <Mail size={16} />}
                </div>
                <span className="font-bold text-slate-700 text-sm">{pref.label || pref.category}</span>
              </div>
              <div className="flex items-center gap-8">
                <button 
                  onClick={() => togglePreference(idx, 'emailEnabled')}
                  className={`w-10 h-6 rounded-full transition-all relative ${pref.emailEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pref.emailEnabled ? 'left-5' : 'left-1'}`} />
                </button>
                <button 
                  onClick={() => togglePreference(idx, 'inAppEnabled')}
                  className={`w-10 h-6 rounded-full transition-all relative ${pref.inAppEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pref.inAppEnabled ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
