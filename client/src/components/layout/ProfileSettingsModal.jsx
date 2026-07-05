import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const ProfileSettingsModal = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuthStore();
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=random`);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const formData = new FormData();
            formData.append('fullName', fullName);
            if (avatarFile) formData.append('avatar', avatarFile);

            await updateProfile(formData);
            onClose();
        } catch (err) {
            const errData = err.response?.data;
            const errMsg = errData?.errors?.length > 0 ? errData.errors[0] : errData?.message;
            setError(errMsg || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-sm bg-white/95 dark:bg-neutral-900/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar relative"
                    >
                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 className="font-serif text-2xl mb-6 text-neutral-900 dark:text-white">Profile Settings</h2>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-sans uppercase tracking-widest text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500 bg-slate-100 dark:bg-white/5">
                                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-widest text-center leading-tight">Change<br/>Photo</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setAvatarFile(file);
                                                setAvatarPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Full Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={fullName} 
                                    onChange={e => setFullName(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-full text-sm text-neutral-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] transition-colors" 
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold font-sans text-xs uppercase tracking-widest py-3 rounded-full transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 flex items-center justify-center"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileSettingsModal;
