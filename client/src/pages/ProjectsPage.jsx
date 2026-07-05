import React, { useEffect, useState } from 'react';
import { Plus, Search, RefreshCw, Loader2 } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectCard from '../components/dashboard/ProjectCard';

const ProjectsPage = () => {
    const { projects, fetchProjects, createProject, updateProject, deleteProject, isLoading } = useProjectStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [newProject, setNewProject] = useState({ name: '', description: '', accentColor: '#3b82f6', endDate: '', githubLink: '', deployedLink: '', status: 'ACTIVE' });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSaveProject = async (e) => {
        e.preventDefault();
        if (editingProjectId) {
            await updateProject(editingProjectId, newProject);
        } else {
            await createProject(newProject);
        }
        setIsModalOpen(false);
        setEditingProjectId(null);
        setNewProject({ name: '', description: '', accentColor: '#3b82f6', endDate: '', githubLink: '', deployedLink: '' });
    };

    const handleEditProject = (project) => {
        setEditingProjectId(project._id);
        setNewProject({
            name: project.name,
            description: project.description || '',
            accentColor: project.accentColor || '#3b82f6',
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
            githubLink: project.githubLink || '',
            deployedLink: project.deployedLink || '',
            status: project.status || 'ACTIVE'
        });
        setIsModalOpen(true);
    };

    const handleDeleteProject = async (project) => {
        if (window.confirm(`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`)) {
            await deleteProject(project._id);
        }
    };

    const openCreateModal = () => {
        setEditingProjectId(null);
        setNewProject({ name: '', description: '', accentColor: '#3b82f6', endDate: '', githubLink: '', deployedLink: '' });
        setIsModalOpen(true);
    };

    // Stats
    const totalProjects = projects.length;
    const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
    const completedProjectsCount = projects.filter(p => p.status === 'COMPLETED').length;
    const onHoldProjectsCount = projects.filter(p => p.status === 'ON_HOLD').length;

    // Filter projects
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'ALL' || p.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <main className="flex-1 overflow-auto custom-scrollbar bg-slate-50 dark:bg-transparent">
            <div className="max-w-[1200px] mx-auto px-8 py-10">
                {/* --- HEADER --- */}
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center text-blue-600 font-bold text-[11px] tracking-widest uppercase mb-4 font-sans">
                            <span className="w-6 h-0.5 bg-blue-600 mr-3"></span>
                            WORKSPACE SYSTEM
                        </div>
                        <h1 className="text-5xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">PROJECTS</h1>
                        <p className="text-slate-500 dark:text-neutral-400 font-medium">
                            Manage and track all your active workspaces and repositories
                        </p>
                    </div>
                </header>

                {/* --- STAT CARDS --- */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-blue-900/40 rounded-2xl p-6 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 tracking-widest uppercase mb-2">TOTAL</div>
                        <div className="text-4xl font-black text-neutral-900 dark:text-white">{totalProjects}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-6 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-blue-400/70 tracking-widest uppercase mb-2">ACTIVE</div>
                        <div className="text-4xl font-black text-blue-600">{activeProjectsCount}</div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 tracking-widest uppercase mb-2">ON HOLD</div>
                        <div className="text-4xl font-black text-neutral-900 dark:text-white">{onHoldProjectsCount}</div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 tracking-widest uppercase mb-2">COMPLETED</div>
                        <div className="text-4xl font-black text-neutral-900 dark:text-white">{completedProjectsCount}</div>
                    </div>
                </div>

                {/* --- FILTER & SEARCH BAR --- */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-full p-2 flex items-center mb-8 shadow-sm">
                    {/* Tabs */}
                    <div className="flex items-center space-x-1 pl-2">
                        {['ALL', 'ACTIVE', 'PLANNING', 'ON_HOLD', 'COMPLETED'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    activeFilter === filter
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                {filter === 'ALL' ? 'All Projects' : filter.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-4"></div>

                    {/* Search */}
                    <div className="flex-1 flex items-center pr-4">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search projects..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none text-sm text-neutral-900 dark:text-white focus:outline-none w-full placeholder-slate-400"
                        />
                    </div>
                    
                    <button 
                        onClick={openCreateModal}
                        className="ml-auto bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* --- PROJECT GRID --- */}
                {isLoading && projects.length === 0 ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 dark:text-neutral-500">
                        No projects found matching your criteria.
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20"
                    >
                        {filteredProjects.map((project, index) => (
                            <motion.div 
                                key={project._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ProjectCard 
                                    project={project} 
                                    onEdit={handleEditProject} 
                                    onDelete={handleDeleteProject} 
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* --- CREATE PROJECT MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/20 dark:bg-neutral-950/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            <h2 className="font-bold text-2xl mb-6 text-neutral-900 dark:text-white">{editingProjectId ? 'Edit Project' : 'Create Project'}</h2>
                            <form onSubmit={handleSaveProject} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold font-sans text-slate-500 mb-1.5 uppercase tracking-widest">Project Name</label>
                                    <input type="text" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Website Redesign" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold font-sans text-slate-500 mb-1.5 uppercase tracking-widest">Description (Optional)</label>
                                    <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none" placeholder="Brief description..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold font-sans text-slate-500 mb-1.5 uppercase tracking-widest">Status</label>
                                    <select value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors">
                                        <option value="PLANNING">Planning</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="ON_HOLD">On Hold</option>
                                        <option value="COMPLETED">Completed</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-[10px] font-bold font-sans text-slate-500 mb-1.5 uppercase tracking-widest">GitHub Link</label>
                                        <input type="url" value={newProject.githubLink} onChange={e => setNewProject({...newProject, githubLink: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="https://github.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold font-sans text-slate-500 mb-1.5 uppercase tracking-widest">Live Link</label>
                                        <input type="url" value={newProject.deployedLink} onChange={e => setNewProject({...newProject, deployedLink: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="https://..." />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-white/10 mt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white transition-colors">Cancel</button>
                                    <button 
                                        type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-semibold rounded-full shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {editingProjectId ? 'Save Changes' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
};

export default ProjectsPage;