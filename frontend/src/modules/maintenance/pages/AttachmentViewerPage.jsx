import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, X, Download, Paperclip } from 'lucide-react';
import api from '../../../services/api';
import { downloadAttachment } from '../utils/attachmentActions';

const AttachmentViewerPage = () => {
    const [searchParams] = useSearchParams();
    const [blobUrl, setBlobUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const url = searchParams.get('url');
    const name = searchParams.get('name') || 'Attachment';
    const type = searchParams.get('type') || 'application/octet-stream';

    useEffect(() => {
        if (!url) {
            setError('No attachment URL provided.');
            setIsLoading(false);
            return;
        }

        const fetchAttachment = async () => {
            try {
                const response = await api.get(url, { responseType: 'blob' });
                const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type });
                const objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            } catch (err) {
                console.error('Failed to load attachment:', err);
                setError(err?.response?.data?.message || err?.message || 'Failed to load the attachment.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttachment();

        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [url, type]);

    const handleDownload = () => {
        // We can reuse the existing download logic
        downloadAttachment({ downloadUrl: url, fileName: name });
    };

    const isImage = type.startsWith('image/');
    const isPDF = type === 'application/pdf';

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900 text-white animate-fade-in">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-700 bg-slate-900/80 px-6 backdrop-blur-md">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="rounded-lg bg-slate-800 p-2 shrink-0">
                        <Paperclip size={18} className="text-blue-400" />
                    </div>
                    <h1 className="truncate text-sm font-semibold tracking-tight">{name}</h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold hover:bg-slate-700 transition"
                    >
                        <Download size={14} />
                        Download
                    </button>
                    <button 
                        onClick={() => window.close()}
                        className="ml-2 rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition"
                        title="Close Tab"
                    >
                        <X size={20} className="stroke-[2.5]" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 min-h-0">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                        <p className="text-sm font-medium text-slate-400">Loading attachment securely...</p>
                    </div>
                ) : error ? (
                    <div className="flex max-w-md flex-col items-center text-center gap-4 bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                        <div className="rounded-full bg-rose-500/20 p-4">
                            <AlertCircle size={32} className="text-rose-500" />
                        </div>
                        <h2 className="text-xl font-bold">Preview Unavailable</h2>
                        <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-2 rounded-xl bg-slate-700 px-6 py-2 text-sm font-bold hover:bg-slate-600 transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {isImage ? (
                            <img 
                                src={blobUrl} 
                                alt={name} 
                                className="max-h-full max-w-full object-contain rounded shadow-2xl animate-fade-in" 
                            />
                        ) : isPDF ? (
                            <iframe 
                                src={blobUrl} 
                                title={name} 
                                className="h-full w-full max-w-5xl rounded-lg bg-white shadow-2xl border-none"
                            />
                        ) : (
                             <div className="flex flex-col items-center gap-6 p-12 bg-slate-800/50 rounded-3xl border border-slate-700 text-center">
                                <div className="rounded-full bg-blue-500/20 p-6">
                                    <Paperclip size={48} className="text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold">Universal Preview Not Supported</h2>
                                    <p className="text-sm text-slate-400 max-w-xs mx-auto">
                                        This file type ({type}) cannot be previewed natively in this window. 
                                        Please download the file to view it.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                                >
                                    <Download size={16} />
                                    Download to View
                                </button>
                             </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Footer / Status Bar */}
            <div className="h-8 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <div>Type: {type}</div>
                <div>Application: Facility-Flow Attachment Secure Viewer</div>
            </div>
        </div>
    );
};

export default AttachmentViewerPage;
