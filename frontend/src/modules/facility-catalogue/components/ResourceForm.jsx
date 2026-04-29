import React, { useState, useEffect } from 'react';
import { X, Save, Box, Plus, Trash2, Camera } from 'lucide-react';

const ResourceForm = ({ initialData, onSave, onClose, error, saving = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'LECTURE_HALL',
        capacity: 1,
        location: '',
        description: '',
        availabilityWindows: [],
        amenities: [],
        imageUrl: ''
    });
    const [windowDay, setWindowDay] = useState('MONDAY');
    const [windowStart, setWindowStart] = useState('');
    const [windowEnd, setWindowEnd] = useState('');
    const [amenityInput, setAmenityInput] = useState('');
    const [activeTab, setActiveTab] = useState('basic');
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                type: initialData.type || 'LECTURE_HALL',
                capacity: initialData.capacity || 1,
                location: initialData.location || '',
                description: initialData.description || '',
                availabilityWindows: initialData.availabilityWindows || [],
                amenities: initialData.amenities || [],
                imageUrl: initialData.imageUrl || ''
            });
        } else {
            setFormData({
                name: '',
                type: 'LECTURE_HALL',
                capacity: 1,
                location: '',
                description: '',
                availabilityWindows: [],
                amenities: [],
                imageUrl: ''
            });
        }
        setWindowDay('MONDAY');
        setWindowStart('');
        setWindowEnd('');
        setAmenityInput('');
        setLocalError(null);
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'capacity' ? parseInt(value, 10) : value 
        }));
    };

    const handleAddWindow = () => {
        if (windowDay && windowStart && windowEnd) {
            setFormData(prev => ({
                ...prev,
                availabilityWindows: [...(prev.availabilityWindows || []), { dayOfWeek: windowDay, startTime: windowStart, endTime: windowEnd }]
            }));
            setWindowStart('');
            setWindowEnd('');
            setLocalError(null);
        } else {
            setLocalError('Please select a day and specify both start and end times.');
        }
    };

    const handleRemoveWindow = (index) => {
        setFormData(prev => ({
            ...prev,
            availabilityWindows: prev.availabilityWindows.filter((_, i) => i !== index)
        }));
    };

    const handleAddAmenity = () => {
        if (amenityInput.trim()) {
            setFormData(prev => ({
                ...prev,
                amenities: [...(prev.amenities || []), amenityInput.trim()]
            }));
            setAmenityInput('');
        }
    };

    const handleRemoveAmenity = (index) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.filter((_, i) => i !== index)
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);

        if (!formData.name.trim()) {
            setLocalError('Facility name cannot be empty.');
            return;
        }
        if (formData.capacity <= 0 || isNaN(formData.capacity)) {
            setLocalError('Capacity must be greater than 0.');
            return;
        }
        if (!formData.location.trim()) {
            setLocalError('Location cannot be empty.');
            return;
        }

        await onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4169E1]/10 flex items-center justify-center text-[#4169E1]">
                            <Box size={20} className="stroke-[2.5]" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">
                            {initialData ? 'Edit Facility' : 'New Facility'}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-slate-100 bg-white flex-shrink-0 px-6 pt-2">
                    {['basic', 'availability', 'amenities'].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-[#4169E1] text-[#4169E1]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {(error || localError) && (
                            <div className="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-sm font-bold animate-fade-in mb-4">
                                {localError || error}
                            </div>
                        )}
                        
                        <div className={activeTab === 'basic' ? 'block space-y-6' : 'hidden'}>

                            <div className="flex flex-col items-center">
                                <div className="w-full h-24 relative rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-[#4169E1]/50 transition-all group flex items-center justify-center">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="Facility Preview" className="w-full h-full object-cover shadow-sm" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#4169E1]/10 flex items-center justify-center text-[#4169E1] group-hover:scale-110 transition-transform">
                                            <Camera size={24} strokeWidth={2} />
                                        </div>
                                    )}
                                    <label className="absolute bottom-2 right-2 cursor-pointer bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-[#4169E1] shadow-sm border border-slate-100 hover:bg-[#4169E1] hover:text-white transition-all">
                                        {formData.imageUrl ? 'Change Image' : 'Upload Image'}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Facility Name</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700" placeholder="e.g. Computing Lab 01" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Location</label>
                                    <input required type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700" placeholder="e.g. Block A, Level 3" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Facility Type</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700 appearance-none">
                                        <option value="LECTURE_HALL">Lecture Hall</option>
                                        <option value="AUDITORIUM">Auditorium</option>
                                        <option value="LABORATORY">Laboratory</option>
                                        <option value="SPORTS_COURT">Sports Court</option>
                                        <option value="LIBRARY_MEETING_ROOM">Library Meeting Room</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Capacity</label>
                                    <input required type="number" min="1" name="capacity" value={formData.capacity} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700" placeholder={formData.type === 'SPORTS_COURT' ? "Players" : "People"} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                                <textarea rows="3" name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700 resize-none" placeholder="Details about specific capabilities or conditions..." />
                            </div>
                        </div>

                        <div className={activeTab === 'availability' ? 'block' : 'hidden'}>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Availability Windows</label>
                        <div className="flex gap-2 mb-3">
                            <select 
                                value={windowDay} 
                                onChange={(e) => setWindowDay(e.target.value)}
                                className="w-[30%] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700" 
                            >
                                <option value="MONDAY">Monday</option>
                                <option value="TUESDAY">Tuesday</option>
                                <option value="WEDNESDAY">Wednesday</option>
                                <option value="THURSDAY">Thursday</option>
                                <option value="FRIDAY">Friday</option>
                                <option value="SATURDAY">Saturday</option>
                                <option value="SUNDAY">Sunday</option>
                            </select>
                            <input 
                                type="time" 
                                value={windowStart} 
                                onChange={(e) => setWindowStart(e.target.value)}
                                className="w-[25%] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700" 
                            />
                            <span className="flex items-center text-slate-400 font-bold">-</span>
                            <input 
                                type="time" 
                                value={windowEnd} 
                                onChange={(e) => setWindowEnd(e.target.value)}
                                className="w-[25%] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700" 
                            />
                            <button 
                                type="button" 
                                onClick={handleAddWindow}
                                className="px-3 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-1.5 ml-auto"
                            >
                                <Plus size={16} strokeWidth={2.5} /> Add
                            </button>
                        </div>
                        {formData.availabilityWindows && formData.availabilityWindows.length > 0 && (
                            <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                                {formData.availabilityWindows.map((window, idx) => (
                                    <div key={idx} className="flex justify-between items-center px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg">
                                        <span className="text-sm font-bold text-slate-600 truncate mr-2">
                                            {window.dayOfWeek}: {window.startTime} - {window.endTime}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveWindow(idx)}
                                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all flex-shrink-0"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        </div>

                        <div className={activeTab === 'amenities' ? 'block' : 'hidden'}>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Add Amenities</label>
                                <div className="flex gap-2 mb-4">
                                    <input 
                                        type="text" 
                                        value={amenityInput} 
                                        onChange={(e) => setAmenityInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAmenity(); } }}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-medium text-slate-700" 
                                        placeholder="e.g. Projector, Whiteboard" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddAmenity}
                                        className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-1.5"
                                    >
                                        <Plus size={16} strokeWidth={2.5} /> Add
                                    </button>
                                </div>
                                {formData.amenities && formData.amenities.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.amenities.map((amenity, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-[#4169E1]/10 text-[#4169E1] rounded-lg border border-[#4169E1]/20">
                                                <span className="text-xs font-bold">{amenity}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveAmenity(idx)}
                                                    className="p-0.5 hover:bg-[#4169E1]/20 rounded-full transition-all text-[#4169E1]"
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 font-medium">No amenities added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 flex gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                            Cancel
                        </button>
                    <button type="submit" disabled={saving} className="flex-1 py-3.5 bg-[#4169E1] text-white font-bold rounded-xl shadow-md shadow-[#4169E1]/30 hover:shadow-lg hover:shadow-[#4169E1]/40 flex justify-center items-center gap-2 transition-all disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed">
                            <Save size={18} strokeWidth={2.5} />
                        {saving
                          ? 'Saving...'
                          : initialData
                            ? 'Save Changes'
                            : 'Create Facility'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResourceForm;
