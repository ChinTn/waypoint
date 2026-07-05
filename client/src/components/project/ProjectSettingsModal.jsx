import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Shield, User, ShieldAlert, Trash2, Loader2, ChevronDown } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
import useAuthStore from '../../store/authStore';

const CustomRoleDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const options = ["ADMIN", "MEMBER", "VIEWER"];

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-[90px] bg-transparent text-xs font-sans font-bold text-slate-700 dark:text-neutral-300 outline-none cursor-pointer uppercase relative z-10 hover:text-blue-500 transition-colors"
            >
                {value}
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-3 w-32 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                    >
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${value === option ? 'bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ProjectSettingsModal = ({ projectId, onClose }) => {
    const { projects, members, generateInviteLink, updateMemberRole, removeMember } = useProjectStore();
    const { user } = useAuthStore();
    const currentProject = projects.find(p => p._id === projectId);
    
    const [copied, setCopied] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    const myMembership = members.find(m => m.userId._id === user?._id);
    const myRole = myMembership?.role || currentProject?.myRole;

    const handleCopyInvite = async () => {
        try {
            setLoadingInvite(true);
            const token = await generateInviteLink(projectId, inviteEmail);
            const inviteUrl = `${window.location.origin}/join/${token}`;
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Invite generation failed", error);
        } finally {
            setLoadingInvite(false);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        await updateMemberRole(projectId, memberId, newRole);
    };

    const handleRemove = async (memberId) => {
        if(window.confirm("Are you sure you want to remove this member?")) {
            await removeMember(projectId, memberId);
        }
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'OWNER': return <ShieldAlert size={14} className="text-red-400" />;
            case 'ADMIN': return <Shield size={14} className="text-blue-400" />;
            default: return <User size={14} className="text-neutral-400" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-white/95 dark:bg-neutral-900/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 shadow-2xl rounded-[2.5rem] overflow-y-auto custom-scrollbar max-h-[90vh]"
            >
                <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                    <h2 className="text-2xl font-serif text-neutral-900 dark:text-white">Project Settings</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Invite Section */}
                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl">
                        <h3 className="text-sm font-bold font-sans text-slate-800 dark:text-white mb-2 uppercase tracking-widest">Invite Members</h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-6 leading-relaxed">
                            Generate a secure invite link. Enter an email to send it directly, or just copy the link.
                        </p>
                        
                        <div className="flex space-x-3 mb-4">
                            <input 
                                type="email" 
                                placeholder="Email address (optional)"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="flex-1 bg-white dark:bg-neutral-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-neutral-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-blue-500/50 dark:focus:ring-[#3b82f6]/50 text-sm font-sans transition-all"
                            />
                        </div>

                        <button 
                            onClick={handleCopyInvite}
                            disabled={loadingInvite}
                            className={`w-full py-4 rounded-xl flex items-center justify-center font-bold font-sans text-xs uppercase tracking-widest transition-all ${
                                copied 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-[#3b82f6] text-white hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                            }`}
                        >
                            {loadingInvite ? (
                                <span className="animate-pulse">Generating...</span>
                            ) : copied ? (
                                <><Check size={16} className="mr-2" /> Copied!</>
                            ) : (
                                <><Copy size={16} className="mr-2" /> {inviteEmail ? 'Copy & Send Invite' : 'Copy Invite Link'}</>
                            )}
                        </button>
                    </div>

                    {/* Members List */}
                    <div>
                        <h3 className="text-sm font-bold font-sans text-slate-500 dark:text-neutral-500 mb-4 uppercase tracking-widest">Project Members ({members.length})</h3>
                        <div className="space-y-3 pr-2 pb-24">
                            {members.map(member => (
                                <div key={member._id} className="flex items-center justify-between bg-white dark:bg-neutral-950/40 border border-slate-200 dark:border-white/5 p-4 rounded-2xl">
                                    <div className="flex items-center">
                                        <img src={member.userId.avatar || `https://ui-avatars.com/api/?name=${member.userId.fullName}`} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 mr-4" />
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{member.userId.fullName} {member.userId._id === user?._id && <span className="text-slate-400 dark:text-neutral-500 font-normal">(You)</span>}</p>
                                            <p className="text-xs text-slate-500 dark:text-neutral-500 font-sans">{member.userId.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        {/* Role Selector */}
                                        <div className="flex items-center space-x-2 bg-slate-100/50 hover:bg-slate-200/50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer group relative">
                                            {getRoleIcon(member.role)}
                                            {myRole === 'OWNER' && member.role !== 'OWNER' ? (
                                                <CustomRoleDropdown 
                                                    value={member.role}
                                                    onChange={(newRole) => handleRoleChange(member._id, newRole)}
                                                />
                                            ) : (
                                                <span className="text-xs font-sans font-bold text-slate-500 dark:text-neutral-400 uppercase">{member.role}</span>
                                            )}
                                        </div>

                                        {/* Remove Button */}
                                        {myRole === 'OWNER' && member.role !== 'OWNER' && (
                                            <button 
                                                onClick={() => handleRemove(member._id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                title="Remove member"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default ProjectSettingsModal;
