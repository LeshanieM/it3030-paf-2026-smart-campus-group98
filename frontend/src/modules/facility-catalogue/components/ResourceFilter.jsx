import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, LayoutGrid, X } from 'lucide-react';

const ResourceFilter = ({ filters, setFilters, onSearch }) => {

    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        if (isClearing) {
            onSearch();
            setIsClearing(false);
        }
    }, [filters, isClearing, onSearch]);

    const handleClear = () => {
        setFilters({ type: '', location: '', minCapacity: '' });
        setIsClearing(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                        <LayoutGrid size={18} strokeWidth={2.5} />
                    </div>
                    <select 
                        name="type" 
                        value={filters.type || ''} 
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all font-bold text-slate-600 appearance-none"
                    >
                        <option value="">All Resource Types</option>
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="AUDITORIUM">Auditorium</option>
                        <option value="LABORATORY">Laboratory</option>
                        <option value="SPORTS_COURT">Sports Court</option>
                        <option value="LIBRARY_MEETING_ROOM">Library Meeting Room</option>
                    </select>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin size={18} strokeWidth={2.5} />
                    </div>
                    <input 
                        type="text" 
                        name="location" 
                        placeholder="Location filter..." 
                        value={filters.location || ''} 
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all text-slate-700 font-medium"
                    />
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                        <Users size={18} strokeWidth={2.5} />
                    </div>
                    <input 
                        type="number" 
                        name="minCapacity" 
                        placeholder="Min capacity" 
                        min="1"
                        value={filters.minCapacity || ''} 
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 focus:border-[#4169E1] transition-all text-slate-700 font-medium"
                    />
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleClear}
                        className="flex-1 flex justify-center items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition-all shadow-sm"
                        title="Clear filters"
                    >
                        <X size={18} strokeWidth={2.5} />
                        Clear
                    </button>
                    <button 
                        onClick={onSearch}
                        className="flex-[2] flex justify-center items-center gap-2 bg-[#4169E1] hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-md shadow-[#4169E1]/30 hover:shadow-lg hover:shadow-[#4169E1]/40"
                    >
                        <Search size={18} strokeWidth={2.5} />
                        Search
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResourceFilter;
