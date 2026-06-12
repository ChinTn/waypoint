import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Shield, User, ShieldAlert, Trash2 } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
import useAuthStore from '../../store/authStore';

const ProjectSettingsModal = ({ projectId, onClose }) => {
    const { projects, members, generateInviteLink, updateMemberRole, removeMember } = useProjectStore();
    const { user } = useAuthStore();
    const currentProject = projects.find(p => p._id === projectId);
    
    const [copied, setCopied] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(false);

    const myMembership = members.find(m => m.userId._id === user?._id);
    const myRole = myMembership?.role || currentProject?.myRole;

    const handleCopyInvite = async () => {
        try {
            setLoadingInvite(true);
            const token = await generateInviteLink(projectId);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden"
            >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="text-2xl font-serif text-white">Project Settings</h2>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Invite Section */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                        <h3 className="text-sm font-bold font-mono text-white mb-2 uppercase tracking-widest">Invite Members</h3>
                        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                            Generate a secure invite link. Anyone with this link can join your project as a member.
                        </p>
                        
                        <button 
                            onClick={handleCopyInvite}
                            disabled={loadingInvite}
                            className={`w-full py-4 rounded-xl flex items-center justify-center font-bold font-mono text-xs uppercase tracking-widest transition-all ${
                                copied 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-[#3b82f6] text-white hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                            }`}
                        >
                            {loadingInvite ? (
                                <span className="animate-pulse">Generating...</span>
                            ) : copied ? (
                                <><Check size={16} className="mr-2" /> Copied to Clipboard!</>
                            ) : (
                                <><Copy size={16} className="mr-2" /> Copy Invite Link</>
                            )}
                        </button>
                    </div>

                    {/* Members List */}
                    <div>
                        <h3 className="text-sm font-bold font-mono text-neutral-500 mb-4 uppercase tracking-widest">Project Members ({members.length})</h3>
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                            {members.map(member => (
                                <div key={member._id} className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl">
                                    <div className="flex items-center">
                                        <img src={member.userId.avatar || `https://ui-avatars.com/api/?name=${member.userId.fullName}`} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10 mr-4" />
                                        <div>
                                            <p className="text-sm font-semibold text-white">{member.userId.fullName} {member.userId._id === user?._id && <span className="text-neutral-500 font-normal">(You)</span>}</p>
                                            <p className="text-xs text-neutral-500 font-mono">{member.userId.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        {/* Role Selector */}
                                        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                                            {getRoleIcon(member.role)}
                                            {myRole === 'OWNER' && member.role !== 'OWNER' ? (
                                                <select 
                                                    value={member.role}
                                                    onChange={(e) => handleRoleChange(member._id, e.target.value)}
                                                    className="bg-transparent text-xs font-mono font-bold text-neutral-300 outline-none cursor-pointer appearance-none uppercase"
                                                >
                                                    <option className="bg-black text-white" value="ADMIN">ADMIN</option>
                                                    <option className="bg-black text-white" value="MEMBER">MEMBER</option>
                                                    <option className="bg-black text-white" value="VIEWER">VIEWER</option>
                                                </select>
                                            ) : (
                                                <span className="text-xs font-mono font-bold text-neutral-400 uppercase">{member.role}</span>
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
