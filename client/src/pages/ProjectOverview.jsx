import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ListTodo, Users, Network, ArrowRight, ArrowLeft } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import ProjectSettingsModal from '../components/project/ProjectSettingsModal';

const ProjectOverview = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { projects, members, isLoading, fetchProjectMembers } = useProjectStore();
    
    useEffect(() => {
        if (projectId) {
            fetchProjectMembers(projectId);
        }
    }, [projectId, fetchProjectMembers]);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const project = projects.find(p => p._id === projectId);

    if (isLoading && !project) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-neutral-400 font-mono text-sm uppercase tracking-widest">Loading Project...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center">
                <p className="text-neutral-400 font-mono text-sm uppercase tracking-widest mb-4">Project not found</p>
                <button onClick={() => navigate('/projects')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors">
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 lg:p-12 flex flex-col items-center">
            <div className="w-full max-w-5xl flex flex-col flex-1">
                <header className="mb-12 flex-shrink-0">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <button 
                            onClick={() => navigate('/projects')}
                            className="flex items-center text-xs font-mono font-bold text-neutral-500 hover:text-white uppercase tracking-widest transition-colors mb-6 group"
                        >
                            <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Projects
                        </button>
                        <h1 className="text-4xl lg:text-5xl font-serif text-white mb-4">{project.name}</h1>
                        <p className="text-neutral-400 font-mono max-w-2xl leading-relaxed">{project.description || "Central hub for project tasks, documentation, and team collaboration."}</p>
                    </motion.div>
                </header>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 pb-12 content-start">
                
                {/* DOCUMENTS CARD */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate(`/project/${projectId}/documents`)}
                    className="relative flex flex-col group bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden"
                >
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-6 group-hover:scale-110 transition-transform">
                        <FileText size={24} className="text-orange-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3">Documents</h2>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-8 flex-1">
                        Rich-text documentation for your PRD, TRD, architectural decisions, and meeting notes. Collaborative editing coming soon.
                    </p>
                    <div className="flex items-center h-10 text-orange-400 text-sm font-bold font-mono uppercase tracking-widest group-hover:translate-x-2 transition-transform mt-auto">
                        Open Docs <ArrowRight size={16} className="ml-2" />
                    </div>
                </motion.div>

                {/* TASKS CARD */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => navigate(`/project/${projectId}/board`)}
                    className="relative flex flex-col group bg-gradient-to-br from-[#3b82f6]/10 to-[#8b5cf6]/10 border border-[#3b82f6]/30 rounded-[2rem] p-8 hover:border-[#3b82f6]/50 transition-all cursor-pointer overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.1)] hover:shadow-[0_0_60px_rgba(59,130,246,0.2)]"
                >
                    <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/20 flex items-center justify-center border border-[#3b82f6]/30 mb-6 group-hover:scale-110 transition-transform">
                        <ListTodo size={24} className="text-[#3b82f6]" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3">Tasks & Kanban</h2>
                    <p className="text-sm text-neutral-300 leading-relaxed mb-8 flex-1">
                        Manage your sprint, assign tasks, set priorities, and track progress on the real-time interactive Kanban board.
                    </p>
                    <div className="flex items-center h-10 text-[#3b82f6] text-sm font-bold font-mono uppercase tracking-widest group-hover:translate-x-2 transition-transform mt-auto">
                        Open Board <ArrowRight size={16} className="ml-2" />
                    </div>
                </motion.div>

                {/* MEMBERS CARD */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setIsSettingsOpen(true)}
                    className="relative flex flex-col group bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden"
                >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                        <Users size={24} className="text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3">Project Members</h2>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-8 flex-1">
                        Manage your team, invite new collaborators, and configure role-based access controls for this project.
                    </p>
                    
                    {/* Avatars Preview */}
                    <div className="flex items-center justify-between h-10 mt-auto">
                        <div className="flex -space-x-3">
                            {members.slice(0, 5).map(m => (
                                <img key={m._id} src={m.userId?.avatar || `https://ui-avatars.com/api/?name=${m.userId?.fullName || 'User'}`} alt="" className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] object-cover" />
                            ))}
                            {members.length > 5 && (
                                <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-xs font-bold text-white z-0 relative">
                                    +{members.length - 5}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center text-emerald-400 text-sm font-bold font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                            Manage <ArrowRight size={16} className="ml-2" />
                        </div>
                    </div>
                </motion.div>

                {/* FLOW CARD */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => navigate(`/project/${projectId}/flow`)}
                    className="relative flex flex-col group bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden"
                >
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-6 group-hover:scale-110 transition-transform">
                        <Network size={24} className="text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3">Architecture Flow</h2>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-8 flex-1">
                        An infinite node-based canvas for designing architecture diagrams, user flows, and database schemas visually.
                    </p>
                    <div className="flex items-center h-10 text-purple-400 text-sm font-bold font-mono uppercase tracking-widest group-hover:translate-x-2 transition-transform mt-auto">
                        Open Canvas <ArrowRight size={16} className="ml-2" />
                    </div>
                </motion.div>

            </div>

            <AnimatePresence>
                {isSettingsOpen && (
                    <ProjectSettingsModal 
                        projectId={projectId} 
                        onClose={() => setIsSettingsOpen(false)} 
                    />
                )}
            </AnimatePresence>
            </div>
        </div>
    );
};

export default ProjectOverview;
