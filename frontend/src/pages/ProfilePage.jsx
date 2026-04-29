import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  Camera,
  User,
  Mail,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import CONFIG from '../config';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(
    user?.name || user?.email?.split('@')[0] || user?.sub?.split('@')[0] || '',
  );
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(user?.picture || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Name validation error state
  const [nameError, setNameError] = useState('');

  //  Validate name function
  const validateName = (value) => {
    if (!value || value.trim().length === 0) {
      return 'Name cannot be empty';
    }
    if (value.length > 100) {
      return 'Name must be less than 100 characters';
    }
    if (/[<>{}[\]\\|]/.test(value)) {
      return 'Name contains invalid characters';
    }
    return '';
  };

  // Handle name change with validation
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    const validationError = validateName(newName);
    setNameError(validationError);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submission
    const validationError = validateName(name);
    if (validationError) {
      setNameError(validationError);
      setError('Please fix the errors before saving');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('name', name.trim()); // NEW: Trim whitespace
    if (image) {
      formData.append('picture', image);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${CONFIG.API_BASE_URL}/user/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      updateUser({
        name: response.data.name,
        picture: response.data.picture,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: Profile Overview Card */}
          <div className="flex flex-col">
            <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100 shadow-lg shadow-slate-200/30 text-center space-y-8 flex-1 flex flex-col justify-center transition-all duration-500 hover:border-primary/20">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {user?.name || (user?.email || user?.sub)?.split('@')[0]}
                </h2>
                <p className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
                  {user?.role}
                </p>
              </div>

              <div className="relative inline-block group mx-auto">
                {/* Compact Profile Image */}
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-slate-50 p-1.5 border-[8px] border-slate-100 shadow-inner overflow-hidden flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02]">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-5xl font-black text-slate-200 uppercase">
                      {(user?.email || user?.sub)?.[0]}
                    </div>
                  )}
                </div>
                {/* Compact Image Update Badge */}
                <label className="absolute bottom-2 right-2 p-2.5 bg-primary text-white rounded-full shadow-xl cursor-pointer hover:bg-primary-dark hover:scale-110 transition-all border-4 border-white z-20">
                  <Camera size={18} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Account ID</div>
                   <div className="text-slate-900 font-bold font-mono text-sm">#{user?.id?.slice(-6) || '---'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                   <div className="text-emerald-600 font-bold flex items-center justify-center gap-1.5 text-sm">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Active
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Details Form */}
          <div className="flex flex-col">
            <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-lg shadow-slate-200/30 overflow-hidden flex-1 flex flex-col">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   Bio & details
                   <div className="h-2 w-2 bg-primary rounded-full" />
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 flex-1 flex flex-col space-y-8">
                <div className="space-y-6">
                  {/* Personal Name Entry  */}
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      My Identity Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        placeholder="Enter your name"
                        className={`w-full pl-7 pr-4 py-2.5 bg-transparent border-b text-slate-900 font-black text-lg focus:outline-none transition-all placeholder:text-slate-200 ${
                          nameError 
                            ? 'border-rose-500 focus:border-rose-500' 
                            : 'border-slate-200 focus:border-primary'
                        }`}
                      />
                    </div>
                    {/* Name error message display */}
                    {nameError && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-rose-600 text-[10px] font-black uppercase tracking-wider">
                        <AlertCircle size={12} />
                        {nameError}
                      </div>
                    )}
                    <div className="text-[8px] text-slate-400 mt-1 ml-1">
                      {name.length}/100 characters
                    </div>
                  </div>

                  {/* Role Display */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assigned Role</label>
                    <div className="relative">
                      <Shield className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <div className="w-full pl-7 py-2.5 border-b border-slate-200 text-slate-400 font-black text-lg cursor-default uppercase tracking-tight">
                        {user?.role}
                      </div>
                    </div>
                  </div>

                  {/* Email Display */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <div className="w-full pl-7 py-2.5 border-b border-slate-200 text-slate-400 font-black text-lg truncate cursor-not-allowed">
                        {user?.email || user?.sub}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Metadata Visuals */}
                <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-4">
                   <div className="flex-1 min-w-[150px] space-y-2">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Badges</label>
                      <div className="flex gap-1.5">
                         <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20" title="Verified User">
                            <Shield size={16} />
                         </div>
                         <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200" title="Active Status">
                            <CheckCircle2 size={16} />
                         </div>
                      </div>
                   </div>
                   <div className="flex-1 min-w-[150px] space-y-2">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Platform Tags</label>
                      <div className="flex flex-wrap gap-1.5">
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[8px] font-bold uppercase border border-slate-200">#Security</span>
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[8px] font-bold uppercase border border-slate-200">#FacilityFlow</span>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    {error && (
                      <p className="text-rose-600 font-black text-[10px] bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        {error}
                      </p>
                    )}
                    {success && (
                      <p className="text-emerald-600 font-black text-[10px] bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-1.5 animate-bounce-in">
                        <CheckCircle2 size={14} /> Sync Complete
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !!nameError}
                    className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;