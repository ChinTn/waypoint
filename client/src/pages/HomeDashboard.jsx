import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, Activity, Clock, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/dashboard/ProjectCard';

const HomeDashboard = () => {
    const { projects = [], fetchProjects, isLoading, updateProject, deleteProject, createProject } = useProjectStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [newProject, setNewProject] = useState({ name: '', description: '', accentColor: '#3b82f6', status: 'ACTIVE', githubLink: '', deployedLink: '' });
    const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleEditProject = (project) => {
        setEditingProjectId(project._id);
        setNewProject({ name: project.name, description: project.description, accentColor: project.accentColor || '#3b82f6', status: project.status, githubLink: project.githubLink || '', deployedLink: project.deployedLink || '' });
        setIsModalOpen(true);
    };

    const handleDeleteProject = (project) => {
        setProjectToDelete(project);
        setIsDeletePromptOpen(true);
    };

    const confirmDelete = async () => {
        if (projectToDelete) {
            await deleteProject(projectToDelete._id);
            setIsDeletePromptOpen(false);
            setProjectToDelete(null);
        }
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        if (editingProjectId) {
            await updateProject(editingProjectId, newProject);
        } else {
            await createProject(newProject);
        }
        setIsModalOpen(false);
        setEditingProjectId(null);
        setNewProject({ name: '', description: '', accentColor: '#3b82f6', status: 'ACTIVE', githubLink: '', deployedLink: '' });
    };

    // Derived Metrics
    const validProjects = (projects || []).filter(p => p !== null && p !== undefined);

    const activeProjects = validProjects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = validProjects.filter(p => p.status === 'COMPLETED').length;
    const planningProjects = validProjects.filter(p => p.status === 'PLANNING').length;

    // Get 3 most recently created/updated projects
    const recentProjects = [...validProjects]
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
                    className="font-serif text-5xl text-neutral-900 dark:text-white tracking-tight mb-2"
                >
                    {getGreeting()}, <span className="text-[#3b82f6]">{user?.fullName?.split(' ')[0] || 'Commander'}</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-500 dark:text-neutral-400 font-sans text-sm tracking-widest uppercase"
                >
                    Here is what's happening in your workspace today.
                </motion.p>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { title: 'Total Projects', value: validProjects.length, icon: FolderKanban, color: 'text-neutral-900 dark:text-white' },
                    { title: 'Active', value: activeProjects, icon: Activity, color: 'text-blue-600 dark:text-[#3b82f6]' },
                    { title: 'Planning', value: planningProjects, icon: Clock, color: 'text-amber-500 dark:text-amber-400' },
                    { title: 'Completed', value: completedProjects, icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-white/20 transition-colors shadow-sm dark:shadow-none"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-slate-500 dark:text-neutral-400 font-sans text-xs uppercase tracking-widest font-bold">{stat.title}</span>
                            <stat.icon className={`w-6 h-6 ${stat.color} opacity-80`} />
                        </div>
                        <span className={`text-5xl font-serif ${stat.color}`}>{stat.value}</span>
                        
                        {/* Glow effect */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors"></div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions & Recent Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Actions */}
                <div className="flex flex-col space-y-6">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-neutral-400 font-sans tracking-[0.2em] uppercase">Quick Actions</h2>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/projects')}
                            className="w-full group relative overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-6 rounded-[1.5rem] flex items-center space-x-5 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-md dark:shadow-lg"
                        >
                            <div className="w-14 h-14 flex-shrink-0 rounded-full bg-blue-50 dark:bg-[#3b82f6]/20 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-[#3b82f6]/30 transition-colors">
                                <FolderKanban className="w-6 h-6 text-blue-600 dark:text-[#3b82f6]" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-sans font-bold tracking-widest uppercase text-sm text-neutral-900 dark:text-white mb-1">Project Board</span>
                                <span className="font-sans text-[10px] text-slate-500 dark:text-neutral-500 uppercase tracking-[0.2em] line-clamp-1">Manage Workspace</span>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6] opacity-0 group-hover:opacity-10 blur-[50px] transition-opacity rounded-full pointer-events-none"></div>
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setEditingProjectId(null);
                                setNewProject({ name: '', description: '', accentColor: '#10b981', status: 'ACTIVE', githubLink: '', deployedLink: '' });
                                setIsModalOpen(true);
                            }}
                            className="w-full group relative overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-6 rounded-[1.5rem] flex items-center space-x-5 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-md dark:shadow-lg"
                        >
                            <div className="w-14 h-14 flex-shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/30 transition-colors">
                                <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-sans font-bold tracking-widest uppercase text-sm text-neutral-900 dark:text-white mb-1">New Project</span>
                                <span className="font-sans text-[10px] text-slate-500 dark:text-neutral-500 uppercase tracking-[0.2em] line-clamp-1">Start fresh</span>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-0 group-hover:opacity-10 blur-[50px] transition-opacity rounded-full pointer-events-none"></div>
                        </motion.button>
                    </div>
                </div>

                {/* Recent Projects */}
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-500 dark:text-neutral-400 font-sans tracking-[0.2em] uppercase">Recent Projects</h2>
                        <button onClick={() => navigate('/projects')} className="text-[10px] font-sans text-blue-600 dark:text-[#3b82f6] uppercase tracking-[0.2em] hover:text-blue-700 dark:hover:text-white transition-colors flex items-center">View All <span className="ml-1">→</span></button>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center border border-slate-200 dark:border-white/5 rounded-[2rem] bg-slate-50 dark:bg-neutral-950/20">
                            <span className="text-slate-500 dark:text-neutral-500 font-sans uppercase tracking-widest text-xs">Loading...</span>
                        </div>
                    ) : validProjects.length > 0 ? (
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
                                        onEdit={handleEditProject} 
                                        onDelete={handleDeleteProject} 
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-slate-50 dark:bg-neutral-950/20 p-10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white dark:bg-neutral-900 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            <FolderKanban className="w-16 h-16 text-slate-300 dark:text-neutral-600 mb-6 relative z-10" />
                            <p className="text-slate-500 dark:text-neutral-400 font-sans uppercase tracking-widest text-sm text-center relative z-10 mb-8">No active projects detected.</p>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setEditingProjectId(null);
                                    setNewProject({ name: '', description: '', accentColor: '#10b981', status: 'ACTIVE', githubLink: '', deployedLink: '' });
                                    setIsModalOpen(true);
                                }}
                                className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-neutral-900 dark:text-white border border-slate-300 dark:border-white/20 px-8 py-3 rounded-full font-sans text-[10px] font-bold uppercase tracking-[0.2em] transition-colors relative z-10 shadow-sm dark:shadow-lg"
                            >
                                Get Started
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CREATE/EDIT PROJECT MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-white/95 dark:bg-neutral-900/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            <h2 className="font-serif text-2xl mb-6 text-neutral-900 dark:text-white">{editingProjectId ? 'Edit Project' : 'Create Project'}</h2>
                            <form onSubmit={handleSaveProject} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Project Name</label>
                                    <input type="text" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-full text-sm text-neutral-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] transition-colors" placeholder="e.g. Website Redesign" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Due Date (Optional)</label>
                                    <input type="date" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-full text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] transition-colors dark:[color-scheme:dark]" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Description (Optional)</label>
                                    <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-[1rem] text-sm text-neutral-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] transition-colors h-16 resize-none custom-scrollbar" placeholder="Brief description..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Accent Color</label>
                                    <div className="flex items-center space-x-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-full">
                                        <input type="color" value={newProject.accentColor} onChange={e => setNewProject({...newProject, accentColor: e.target.value})} className="w-6 h-6 cursor-pointer bg-transparent border-none p-0 rounded-full" />
                                        <span className="text-sm font-sans text-slate-500 dark:text-neutral-400 uppercase">{newProject.accentColor}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="block text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">GitHub Link</label>
                                            <input type="url" value={newProject.githubLink} onChange={e => setNewProject({...newProject, githubLink: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-full text-xs text-neutral-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] transition-colors" placeholder="https://github.com/..." />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Live Link</label>
                                            <input type="url" value={newProject.deployedLink} onChange={e => setNewProject({...newProject, deployedLink: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-full text-xs text-neutral-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] transition-colors" placeholder="https://..." />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-white/10">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-xs font-bold font-sans text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit" disabled={isLoading} className="bg-[#3b82f6] text-white px-6 py-2.5 font-sans text-xs tracking-widest uppercase font-semibold flex items-center transition-colors rounded-full shadow-[0_0_20px_rgba(255,90,0,0.3)] disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {editingProjectId ? 'Save Changes' : 'Create'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            <AnimatePresence>
                {isDeletePromptOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-white/95 dark:bg-neutral-900/90 backdrop-blur-3xl border border-red-500/20 p-8 rounded-[2rem] shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                            </div>
                            <h2 className="font-serif text-2xl mb-2 text-neutral-900 dark:text-white">Delete Project?</h2>
                            <p className="text-sm text-slate-600 dark:text-neutral-400 mb-8 leading-relaxed">
                                Are you absolutely sure you want to permanently delete <span className="text-neutral-900 dark:text-white font-bold">"{projectToDelete?.name}"</span>? All tasks, documents, and flows will be destroyed. This cannot be undone.
                            </p>
                            <div className="flex space-x-3">
                                <button onClick={() => setIsDeletePromptOpen(false)} className="flex-1 px-4 py-3 text-xs font-bold font-sans text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full uppercase tracking-widest transition-colors">Cancel</button>
                                <button onClick={confirmDelete} className="flex-1 px-4 py-3 text-xs font-bold font-sans text-white bg-red-500 hover:bg-red-600 rounded-full uppercase tracking-widest shadow-md dark:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-colors">Destroy</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
};

export default HomeDashboard;
