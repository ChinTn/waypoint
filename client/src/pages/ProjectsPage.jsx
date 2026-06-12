import React, { useEffect, useState } from 'react';
import { Plus, FolderKanban, LogOut, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ColumnDroppable from '../components/kanban/ColumnDroppable';
import SortableProjectCard from '../components/dashboard/SortableProjectCard';
import ProjectCard from '../components/dashboard/ProjectCard';

const ProjectsPage = () => {
    const { projects, fetchProjects, createProject, updateProjectStatus, updateProject, deleteProject, isLoading } = useProjectStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [newProject, setNewProject] = useState({ name: '', description: '', accentColor: '#3b82f6', endDate: '', githubLink: '', deployedLink: '' });
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const CATEGORIES = [
        { id: 'PLANNING', title: 'Planning' },
        { id: 'ACTIVE', title: 'Active' },
        { id: 'ON_HOLD', title: 'On Hold' },
        { id: 'COMPLETED', title: 'Completed' }
    ];

    const [focusedCategory, setFocusedCategory] = useState(null);
    const [localProjects, setLocalProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);

    useEffect(() => {
        setLocalProjects(projects);
    }, [projects]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        const project = localProjects.find(p => p._id === active.id);
        setActiveProject(project);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) return;

        const isActiveProject = active.data.current?.type === 'Project';
        const isOverProject = over.data.current?.type === 'Project';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveProject) return;

        if (isActiveProject && isOverProject) {
            const activeIndex = localProjects.findIndex(p => p._id === activeId);
            const overIndex = localProjects.findIndex(p => p._id === overId);

            if (localProjects[activeIndex].status !== localProjects[overIndex].status) {
                setLocalProjects((prevProjects) => {
                    const newProjects = [...prevProjects];
                    newProjects[activeIndex] = { ...newProjects[activeIndex], status: newProjects[overIndex].status };
                    return arrayMove(newProjects, activeIndex, overIndex);
                });
            } else {
                 setLocalProjects((prevProjects) => arrayMove(prevProjects, activeIndex, overIndex));
            }
        }

        if (isActiveProject && isOverColumn) {
            setLocalProjects((prevProjects) => {
                const activeIndex = prevProjects.findIndex(p => p._id === activeId);
                const newProjects = [...prevProjects];
                newProjects[activeIndex] = { ...newProjects[activeIndex], status: overId };
                return arrayMove(newProjects, activeIndex, activeIndex);
            });
        }
    };

    const handleDragEnd = (event) => {
        setActiveProject(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const activeProj = localProjects.find(p => p._id === activeId);
        
        let finalStatus = activeProj.status;
        const isOverColumn = over.data.current?.type === 'Column';
        
        if (isOverColumn) {
            finalStatus = over.id;
        } else {
             const overProject = localProjects.find(p => p._id === over.id);
             if (overProject) finalStatus = overProject.status;
        }

        const originalProject = projects.find(p => p._id === activeId);
        if (originalProject && originalProject.status !== finalStatus) {
            updateProjectStatus(activeId, finalStatus);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
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
        setNewProject({ name: '', description: '', accentColor: '#3b82f6', endDate: '', githubLink: '', deployedLink: '' });
    };

    //edit the basic info.
    const handleEditProject = (project) => {
        setEditingProjectId(project._id);
        setNewProject({
            name: project.name,
            description: project.description || '',
            accentColor: project.accentColor || '#3b82f6',
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
            githubLink: project.githubLink || '',
            deployedLink: project.deployedLink || ''
        });
        setIsModalOpen(true);
    };

    //delete project
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

    const filteredProjects = localProjects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <>
            <main className="flex-1 overflow-auto pt-8 px-10 pb-10 flex flex-col relative custom-scrollbar w-full h-full">
                    <header className="flex flex-col mb-4 border-b border-white/5 pb-4 flex-shrink-0 min-w-max w-full">
                        <button onClick={() => navigate('/dashboard')} className="self-start text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center mb-6">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Return to Home
                        </button>
                        <div className="flex justify-between items-end w-full">
                            <div>
                                <h2 className="text-sm font-bold text-[#60a5fa] font-mono tracking-[0.3em] uppercase mb-2">Workspace Overview</h2>
                            <div className="flex items-center space-x-4">

                                {/* This is to show category based Projects */}
                                {focusedCategory && (
                                    <button 
                                        onClick={() => setFocusedCategory(null)}
                                        className="text-neutral-400 hover:text-white transition-colors flex items-center justify-center bg-white/5 p-2 rounded-full border border-white/10 hover:bg-white/10"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <h1 className="font-serif text-3xl text-white">
                                    {focusedCategory ? `${focusedCategory.title} Projects` : 'Project Dashboard'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search projects..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-full py-3 pl-12 pr-6 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-64 focus:w-80"
                                />
                            </div>

                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={openCreateModal}
                                className="bg-[#3b82f6] text-white px-8 py-4 flex items-center space-x-2 transition-colors font-sans text-base tracking-widest uppercase font-semibold shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:shadow-[0_0_30px_rgba(255,90,0,0.5)] rounded-full"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Project</span>
                            </motion.button>
                        </div>
                        </div>
                    </header>

                    {isLoading && projects.length === 0 ? (
                        <div className="flex justify-center py-20 min-w-max w-full"><Loader2 className="w-8 h-8 animate-spin text-[#60a5fa]" /></div>
                    ) : focusedCategory ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 pb-6 w-full max-w-7xl"
                        >
                            {filteredProjects.filter(p => p.status === focusedCategory.id).map((project, index) => (
                                <motion.div 
                                    key={project._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    className="h-full"
                                >
                                    <ProjectCard project={project} isDragging={false} onEdit={handleEditProject} onDelete={handleDeleteProject} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="w-full flex space-x-6 items-start mt-4 relative z-10 pb-10">
                                {CATEGORIES.map(category => {
                                    const categoryProjects = filteredProjects.filter(p => p.status === category.id);
                                    const projectIds = categoryProjects.map(p => p._id);

                                    return (
                                        <ColumnDroppable 
                                            key={category.id} 
                                            column={category} 
                                            taskCount={categoryProjects.length}
                                            onHeaderClick={() => setFocusedCategory(category)}
                                        >
                                            <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
                                                <div className="p-4 space-y-4 pb-8 min-h-[150px]">
                                                    {categoryProjects.map((project) => (
                                                        <SortableProjectCard key={project._id} project={project} onEdit={handleEditProject} onDelete={handleDeleteProject} />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </ColumnDroppable>
                                    );
                                })}

                                {/* Floating Drag Overlay */}
                                <DragOverlay>
                                    {activeProject ? (
                                        <div className="bg-black/80 backdrop-blur-3xl border border-[#3b82f6] p-6 shadow-[0_0_50px_rgba(59,130,246,0.4)] opacity-95 cursor-grabbing rotate-3 rounded-[1.5rem] flex flex-col w-[306px]">
                                            <div className="absolute top-0 left-0 w-full h-1 border-t-2" style={{ borderColor: activeProject.accentColor }}></div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-serif text-white shadow-lg border border-white/10 flex-shrink-0" style={{ backgroundColor: activeProject.accentColor }}>
                                                    {activeProject.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="bg-black/50 border border-white/10 text-neutral-400 text-[10px] font-bold font-mono uppercase tracking-widest rounded-full px-3 py-1.5 pointer-events-none whitespace-nowrap ml-4">
                                                    {activeProject.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="font-serif text-xl text-white mb-2 line-clamp-1">{activeProject.name}</h3>
                                            <p className="text-sm text-neutral-400 line-clamp-2 mb-4 flex-1">{activeProject.description || 'No description provided.'}</p>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </div>
                        </DndContext>
                    )}
                </main>

                {/* --- CREATE PROJECT MODAL --- */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                            >
                                <h2 className="font-serif text-2xl mb-6 text-white">{editingProjectId ? 'Edit Project' : 'Create Project'}</h2>
                                <form onSubmit={handleSaveProject} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold font-mono text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Project Name</label>
                                        <input type="text" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-sm text-white focus:outline-none focus:border-[#3b82f6] transition-colors" placeholder="e.g. Website Redesign" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold font-mono text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Due Date (Optional)</label>
                                        <input type="date" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-sm text-white focus:outline-none focus:border-[#3b82f6] transition-colors [color-scheme:dark]" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold font-mono text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Description (Optional)</label>
                                        <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-[1rem] text-sm text-white focus:outline-none focus:border-[#3b82f6] transition-colors h-16 resize-none custom-scrollbar" placeholder="Brief description..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold font-mono text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Accent Color</label>
                                        <div className="flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                                            <input type="color" value={newProject.accentColor} onChange={e => setNewProject({...newProject, accentColor: e.target.value})} className="w-6 h-6 cursor-pointer bg-transparent border-none p-0 rounded-full" />
                                            <span className="text-sm font-mono text-neutral-400 uppercase">{newProject.accentColor}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                            <div>
                                                <label className="block text-[10px] font-bold font-mono text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">GitHub Link</label>
                                                <input type="url" value={newProject.githubLink} onChange={e => setNewProject({...newProject, githubLink: e.target.value})} className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-xs text-white focus:outline-none focus:border-[#3b82f6] transition-colors" placeholder="https://github.com/..." />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold font-mono text-neutral-500 mb-1.5 uppercase tracking-[0.2em]">Live Link</label>
                                                <input type="url" value={newProject.deployedLink} onChange={e => setNewProject({...newProject, deployedLink: e.target.value})} className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-xs text-white focus:outline-none focus:border-[#3b82f6] transition-colors" placeholder="https://..." />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-xs font-bold font-mono text-neutral-400 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
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
        </>
    );
};

export default ProjectsPage;