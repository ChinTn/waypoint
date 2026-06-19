import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, ListTodo, FolderKanban, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSearchStore from '../../store/searchStore';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const { results, isLoading, searchQuery, clearSearch } = useSearchStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Listen for CMD+K or CTRL+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(open => !open);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Detect scroll for dynamic visibility
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Debounce the search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchQuery(query);
        }, 300); // Wait 300ms after user stops typing to hit the API
        return () => clearTimeout(timeoutId);
    }, [query, searchQuery]);

    // Cleanup when closing
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            clearSearch();
        }
    }, [isOpen, clearSearch]);

    const handleSelect = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    // Determine the button's position and visibility
    const isMainDashboard = location.pathname === '/dashboard';
    const isProjectsPage = location.pathname === '/projects';
    
    let containerClasses = "fixed z-50 transition-all duration-300 ";
    
    if (isMainDashboard) {
        // Main Overview: Corner (Bottom Right)
        containerClasses += "bottom-6 right-6 opacity-100 translate-y-0";
    } else if (isProjectsPage) {
        // Projects Dashboard: Top Center, Permanently visible
        containerClasses += "top-6 left-1/2 -translate-x-1/2 opacity-100 translate-y-0";
    } else {
        // Other Pages: Top Center, visible ONLY when scrolled down
        containerClasses += "top-6 left-1/2 -translate-x-1/2 ";
        if (isScrolled) {
            containerClasses += "opacity-100 translate-y-0";
        } else {
            containerClasses += "opacity-0 -translate-y-10 pointer-events-none";
        }
    }

    return (
        <>
            {/* Persistent Floating Search Bar */}
            <div className={containerClasses}>
                <button 
                    onClick={() => setIsOpen(true)}
                    className="flex items-center space-x-3 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-full shadow-lg hover:bg-white/5 hover:border-white/20 transition-all group w-[300px]"
                >
                    <Search className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
                    <span className="flex-1 text-left text-xs font-mono text-neutral-400 group-hover:text-white transition-colors">Search anything...</span>
                    <kbd className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-neutral-400 font-mono tracking-widest">⌘K</kbd>
                </button>
            </div>

            {/* The Command Palette Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                    {/* Search Input Area */}
                    <div className="flex items-center px-4 py-4 border-b border-white/5">
                        <Search className="w-5 h-5 text-neutral-400 mr-3" />
                        <input 
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search projects, tasks, or docs... (Esc to close)"
                            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm"
                        />
                        {isLoading && <Loader2 className="w-4 h-4 text-[#3b82f6] animate-spin" />}
                        <div className="flex items-center space-x-1 ml-3">
                            <kbd className="bg-white/10 px-2 py-1 rounded text-[10px] text-neutral-400 font-mono">esc</kbd>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
                        {query.length > 0 && query.length < 2 && (
                            <div className="p-4 text-center text-xs font-mono text-neutral-500 uppercase">Keep typing...</div>
                        )}
                        
                        {query.length >= 2 && !isLoading && results.projects.length === 0 && results.tasks.length === 0 && results.documents.length === 0 && (
                            <div className="p-8 text-center flex flex-col items-center">
                                <Search className="w-8 h-8 text-neutral-600 mb-3" />
                                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">No results found</span>
                            </div>
                        )}

                        {/* Projects */}
                        {results.projects.length > 0 && (
                            <div className="mb-4">
                                <div className="px-3 py-2 text-[10px] font-bold font-mono text-neutral-500 uppercase tracking-widest">Projects</div>
                                {results.projects.map(project => (
                                    <button 
                                        key={project._id}
                                        onClick={() => handleSelect(`/project/${project._id}`)}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center group"
                                    >
                                        <FolderKanban className="w-4 h-4 text-neutral-400 mr-3 group-hover:text-[#3b82f6] transition-colors" />
                                        <span className="flex-1 text-sm text-neutral-300 group-hover:text-white transition-colors">{project.name}</span>
                                        <ArrowRight className="w-4 h-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tasks */}
                        {results.tasks.length > 0 && (
                            <div className="mb-4">
                                <div className="px-3 py-2 text-[10px] font-bold font-mono text-neutral-500 uppercase tracking-widest">Tasks</div>
                                {results.tasks.map(task => (
                                    <button 
                                        key={task._id}
                                        onClick={() => handleSelect(`/project/${task.projectId}/board`)}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center group"
                                    >
                                        <ListTodo className="w-4 h-4 text-neutral-400 mr-3 group-hover:text-emerald-400 transition-colors" />
                                        <span className="flex-1 text-sm text-neutral-300 group-hover:text-white transition-colors line-clamp-1">{task.title}</span>
                                        <span className="text-[10px] bg-black/50 px-2 py-1 rounded uppercase tracking-wider text-neutral-500 mr-3">{task.status.replace('_', ' ')}</span>
                                        <ArrowRight className="w-4 h-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Documents */}
                        {results.documents.length > 0 && (
                            <div className="mb-4">
                                <div className="px-3 py-2 text-[10px] font-bold font-mono text-neutral-500 uppercase tracking-widest">Documents</div>
                                {results.documents.map(doc => (
                                    <button 
                                        key={doc._id}
                                        onClick={() => handleSelect(`/project/${doc.projectId}/documents`)}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center group"
                                    >
                                        <FileText className="w-4 h-4 text-neutral-400 mr-3 group-hover:text-orange-400 transition-colors" />
                                        <span className="flex-1 text-sm text-neutral-300 group-hover:text-white transition-colors line-clamp-1">{doc.title}</span>
                                        <ArrowRight className="w-4 h-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CommandPalette;