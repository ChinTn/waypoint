import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Activity, Clock, CheckCircle2 } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/dashboard/ProjectCard';

const HomeDashboard = () => {
    const { projects, fetchProjects, isLoading } = useProjectStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    // Derived Metrics
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const planningProjects = projects.filter(p => p.status === 'PLANNING').length;

    // Get 3 most recently created/updated projects
    const recentProjects = [...projects]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 3);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <main className="flex-1 overflow-auto pt-10 px-10 pb-10 flex flex-col relative custom-scrollbar w-full h-full">
            {/* Header / Greeting */}
            <header className="mb-12">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-serif text-5xl text-white tracking-tight mb-2"
                >
                    {getGreeting()}, <span className="text-[#3b82f6]">{user?.fullName?.split(' ')[0] || 'Commander'}</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-neutral-400 font-mono text-sm tracking-widest uppercase"
                >
                    Here is what's happening in your workspace today.
                </motion.p>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { title: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-white' },
                    { title: 'Active', value: activeProjects, icon: Activity, color: 'text-[#3b82f6]' },
                    { title: 'Planning', value: planningProjects, icon: Clock, color: 'text-amber-400' },
                    { title: 'Completed', value: completedProjects, icon: CheckCircle2, color: 'text-emerald-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-neutral-400 font-mono text-xs uppercase tracking-widest font-bold">{stat.title}</span>
                            <stat.icon className={`w-6 h-6 ${stat.color} opacity-80`} />
                        </div>
                        <span className={`text-5xl font-serif ${stat.color}`}>{stat.value}</span>
                        
                        {/* Glow effect */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors"></div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions & Recent Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1">
                {/* Actions */}
                <div className="flex flex-col space-y-6">
                    <h2 className="text-sm font-bold text-neutral-400 font-mono tracking-[0.2em] uppercase">Quick Actions</h2>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/projects')}
                            className="w-full group relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 rounded-[1.5rem] flex items-center space-x-5 hover:border-white/20 transition-all shadow-lg"
                        >
                            <div className="w-14 h-14 flex-shrink-0 rounded-full bg-[#3b82f6]/20 flex items-center justify-center group-hover:bg-[#3b82f6]/30 transition-colors">
                                <FolderKanban className="w-6 h-6 text-[#3b82f6]" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-sans font-bold tracking-widest uppercase text-sm text-white mb-1">Project Board</span>
                                <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-[0.2em] line-clamp-1">Manage Workspace</span>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6] opacity-0 group-hover:opacity-10 blur-[50px] transition-opacity rounded-full pointer-events-none"></div>
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/projects')}
                            className="w-full group relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 rounded-[1.5rem] flex items-center space-x-5 hover:border-white/20 transition-all shadow-lg"
                        >
                            <div className="w-14 h-14 flex-shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                                <Plus className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-sans font-bold tracking-widest uppercase text-sm text-white mb-1">New Project</span>
                                <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-[0.2em] line-clamp-1">Start fresh</span>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-0 group-hover:opacity-10 blur-[50px] transition-opacity rounded-full pointer-events-none"></div>
                        </motion.button>
                    </div>
                </div>

                {/* Recent Projects */}
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-neutral-400 font-mono tracking-[0.2em] uppercase">Recent Projects</h2>
                        <button onClick={() => navigate('/projects')} className="text-[10px] font-mono text-[#3b82f6] uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center">View All <span className="ml-1">→</span></button>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center border border-white/5 rounded-[2rem] bg-black/20">
                            <span className="text-neutral-500 font-mono uppercase tracking-widest text-xs">Loading...</span>
                        </div>
                    ) : recentProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {recentProjects.map((project, i) => (
                                <motion.div 
                                    key={project._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    whileHover={{ y: -5 }}
                                    className="h-full"
                                >
                                    <ProjectCard 
                                        project={project} 
                                        isDragging={false} 
                                        onEdit={() => navigate('/projects')} 
                                        onDelete={() => navigate('/projects')} 
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2rem] bg-black/20 p-10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            <FolderKanban className="w-16 h-16 text-neutral-600 mb-6 relative z-10" />
                            <p className="text-neutral-400 font-mono uppercase tracking-widest text-sm text-center relative z-10 mb-8">No active projects detected.</p>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/projects')}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10 shadow-lg"
                            >
                                Get Started
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default HomeDashboard;
