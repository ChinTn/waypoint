import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, ListTodo, FolderKanban, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSearchStore from '../../store/searchStore';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { results, isLoading, searchQuery, clearSearch } = useSearchStore();
    const navigate = useNavigate();
    const resultsRef = React.useRef(null);

    const allResults = [
        ...results.projects.map(p => ({ ...p, _type: 'project', _path: `/project/${p._id}` })),
        ...results.tasks.map(t => ({ ...t, _type: 'task', _path: `/project/${t.projectId}/board` })),
        ...results.documents.map(d => ({ ...d, _type: 'doc', _path: `/project/${d.projectId}/documents` }))
    ];

    useEffect(() => {
        setSelectedIndex(0);
    }, [results, query]);

    useEffect(() => {
        if (resultsRef.current) {
            const selectedElement = resultsRef.current.querySelector('.selected-result');
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

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

    return (
        <>
            {/* Integrated Top Nav Search Button */}
            <div className="w-48 sm:w-64">
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center space-x-3 bg-slate-100 dark:bg-neutral-950/40 backdrop-blur-md border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-200 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all group"
                >
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                    <span className="flex-1 text-left text-[11px] font-sans text-slate-400 dark:text-neutral-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors truncate">Search...</span>
                    <kbd className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[9px] text-slate-500 dark:text-neutral-400 font-sans tracking-widest">⌘K</kbd>
                </button>
            </div>

            {/* The Command Palette Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-transparent" onClick={() => setIsOpen(false)}>
                        <motion.div 
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="w-full max-w-2xl bg-white/95 dark:bg-neutral-900/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                    {/* Search Input Area */}
                    <div className="flex items-center px-4 py-4 border-b border-slate-200 dark:border-white/5">
                        <Search className="w-5 h-5 text-slate-400 dark:text-neutral-400 mr-3" />
                        <input 
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (!allResults.length) return;
                                if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
                                } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                                } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (allResults[selectedIndex]) {
                                        handleSelect(allResults[selectedIndex]._path);
                                    }
                                }
                            }}
                            placeholder="Search projects, tasks, or docs... (Esc to close)"
                            className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 font-sans text-sm"
                        />
                        {isLoading && <Loader2 className="w-4 h-4 text-blue-600 dark:text-[#3b82f6] animate-spin" />}
                        <div className="flex items-center space-x-1 ml-3">
                            <kbd className="bg-slate-200 dark:bg-white/10 px-2 py-1 rounded text-[10px] text-slate-500 dark:text-neutral-400 font-sans">esc</kbd>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
                        {query.length > 0 && query.length < 2 && (
                            <div className="p-4 text-center text-xs font-sans text-neutral-500 uppercase">Keep typing...</div>
                        )}
                        
                        {query.length >= 2 && !isLoading && results.projects.length === 0 && results.tasks.length === 0 && results.documents.length === 0 && (
                            <div className="p-8 text-center flex flex-col items-center">
                                <Search className="w-8 h-8 text-neutral-600 mb-3" />
                                <span className="text-xs font-sans text-neutral-500 uppercase tracking-widest">No results found</span>
                            </div>
                        )}

                        {/* Projects */}
                        {results.projects.length > 0 && (
                            <div className="mb-4">
                                <div className="px-3 py-2 text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 uppercase tracking-widest">Projects</div>
                                {results.projects.map((project, idx) => {
                                    const absIdx = idx;
                                    const isSelected = selectedIndex === absIdx;
                                    return (
                                        <button 
                                            key={project._id}
                                            onClick={() => handleSelect(`/project/${project._id}`)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center group ${isSelected ? 'selected-result bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                        >
                                            <FolderKanban className="w-4 h-4 text-slate-400 dark:text-neutral-400 mr-3 group-hover:text-blue-600 dark:group-hover:text-[#3b82f6] transition-colors" />
                                            <span className="flex-1 text-sm text-slate-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{project.name}</span>
                                            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tasks */}
                        {results.tasks.length > 0 && (
                            <div className="mb-4">
                                <div className="px-3 py-2 text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 uppercase tracking-widest">Tasks</div>
                                {results.tasks.map((task, idx) => {
                                    const absIdx = results.projects.length + idx;
                                    const isSelected = selectedIndex === absIdx;
                                    return (
                                        <button 
                                            key={task._id}
                                            onClick={() => handleSelect(`/project/${task.projectId}/board`)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center group ${isSelected ? 'selected-result bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                        >
                                            <ListTodo className="w-4 h-4 text-slate-400 dark:text-neutral-400 mr-3 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
                                            <span className="flex-1 text-sm text-slate-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors line-clamp-1">{task.title}</span>
                                            <span className="text-[10px] bg-slate-200 dark:bg-neutral-950/50 px-2 py-1 rounded uppercase tracking-wider text-slate-600 dark:text-neutral-500 mr-3">{task.status.replace('_', ' ')}</span>
                                            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Documents */}
                        {results.documents.length > 0 && (
                            <div className="mb-4">
                                <div className="px-3 py-2 text-[10px] font-bold font-sans text-slate-500 dark:text-neutral-500 uppercase tracking-widest">Documents</div>
                                {results.documents.map((doc, idx) => {
                                    const absIdx = results.projects.length + results.tasks.length + idx;
                                    const isSelected = selectedIndex === absIdx;
                                    return (
                                        <button 
                                            key={doc._id}
                                            onClick={() => handleSelect(`/project/${doc.projectId}/documents`)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center group ${isSelected ? 'selected-result bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                        >
                                            <FileText className="w-4 h-4 text-slate-400 dark:text-neutral-400 mr-3 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors" />
                                            <span className="flex-1 text-sm text-slate-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors line-clamp-1">{doc.title}</span>
                                            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    );
                                })}
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