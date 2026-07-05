import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Clock, AlertCircle, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import useTaskStore from '../store/taskStore';
import { useNavigate } from 'react-router-dom';

const MyTasksPage = () => {
    const { myTasks, fetchMyTasks, isLoading } = useTaskStore();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('ALL'); // ALL, TODO, IN_PROGRESS, IN_REVIEW, DONE

    useEffect(() => {
        fetchMyTasks();
    }, [fetchMyTasks]);

    const filteredTasks = (myTasks || []).filter(t => filter === 'ALL' || t.status === filter);

    // Grouping for priority layout
    const urgentTasks = filteredTasks.filter(t => t.priority === 'URGENT' && t.status !== 'DONE');
    const highTasks = filteredTasks.filter(t => t.priority === 'HIGH' && t.status !== 'DONE');
    const normalTasks = filteredTasks.filter(t => (t.priority === 'MEDIUM' || t.priority === 'LOW') && t.status !== 'DONE');
    const completedTasks = filteredTasks.filter(t => t.status === 'DONE');

    const renderTaskCard = (task) => (
        <motion.div 
            key={task._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onClick={() => task.projectId && navigate(`/project/${task.projectId._id}/board`)}
            className="group relative flex flex-col justify-between min-h-[160px] p-6 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 cursor-pointer overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] shadow-sm dark:shadow-none"
        >
            {/* Subtle top glossy highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/20 to-transparent opacity-50"></div>
            
            {/* Glowing orb effect on hover */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#3b82f6]/10 rounded-full blur-[60px] group-hover:bg-[#3b82f6]/30 transition-colors duration-500"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-5">
                    <span className="text-[11px] font-medium font-sans tracking-wide px-3 py-1 rounded-full border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-neutral-950/40 text-slate-600 dark:text-neutral-300 shadow-inner">
                        {task.projectId?.name || "Unknown Project"}
                    </span>
                    <span className={`text-[10px] font-bold font-sans tracking-wider uppercase px-3 py-1 rounded-full border shadow-sm ${
                        task.priority === 'URGENT' ? 'border-red-500/40 text-red-300 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 
                        task.priority === 'HIGH' ? 'border-amber-500/40 text-amber-300 bg-amber-500/20' : 
                        task.priority === 'MEDIUM' ? 'border-blue-500/40 text-blue-300 bg-blue-500/20' : 
                        'border-emerald-500/40 text-emerald-300 bg-emerald-500/20'
                    }`}>
                        {task.priority}
                    </span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-sans font-medium text-lg leading-snug group-hover:text-[#3b82f6] transition-colors line-clamp-2 pr-4">{task.title}</h3>
            </div>
            
            <div className="relative z-10 flex justify-between items-center mt-6 pt-5 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center text-xs font-sans font-medium tracking-wide text-slate-500 dark:text-neutral-400 group-hover:text-slate-700 dark:group-hover:text-neutral-300 transition-colors">
                    {task.status === 'TODO' && <Clock size={15} className="mr-2 text-slate-400 dark:text-neutral-500" />}
                    {task.status === 'IN_PROGRESS' && <Play size={15} className="mr-2 text-[#3b82f6]" />}
                    {task.status === 'IN_REVIEW' && <AlertCircle size={15} className="mr-2 text-amber-500 dark:text-amber-400" />}
                    {task.status === 'DONE' && <CheckCircle2 size={15} className="mr-2 text-emerald-500 dark:text-emerald-400" />}
                    {task.status?.replace('_', ' ') || 'UNKNOWN'}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-[#3b82f6] group-hover:border-[#3b82f6] transition-all duration-300">
                    <ArrowRight size={14} className="text-slate-400 dark:text-neutral-400 group-hover:text-white transition-colors" />
                </div>
            </div>
        </motion.div>
    );

    return (
        <main className="flex-1 overflow-auto pt-10 px-10 pb-10 flex flex-col relative custom-scrollbar w-full h-full">
            <header className="mb-10 shrink-0">
                <h1 className="font-serif text-5xl text-slate-900 dark:text-white tracking-tight mb-4">My Tasks</h1>
                <p className="text-slate-500 dark:text-neutral-400 font-sans text-sm tracking-widest uppercase">Everything assigned to you across all projects.</p>
            </header>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-10 overflow-x-auto pb-2 scrollbar-hide shrink-0">
                {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-6 py-3 rounded-full font-sans text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                            filter === status 
                            ? 'bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-[#3b82f6]' 
                            : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex-1 flex justify-center items-center">
                    <span className="text-slate-400 dark:text-neutral-500 font-sans uppercase tracking-widest text-sm animate-pulse">Scanning Data Cores...</span>
                </div>
            ) : myTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-slate-50 dark:bg-neutral-950/20 p-10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <CheckSquare className="w-16 h-16 text-slate-300 dark:text-neutral-600 mb-6 relative z-10" />
                    <p className="text-slate-500 dark:text-neutral-400 font-sans uppercase tracking-widest text-sm text-center relative z-10">You have no tasks assigned to you. Enjoy your free time!</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {urgentTasks.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold text-red-500 font-sans tracking-[0.2em] uppercase mb-6 flex items-center">
                                <AlertCircle size={16} className="mr-2" />
                                Requires Immediate Action
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {urgentTasks.map(renderTaskCard)}
                            </div>
                        </section>
                    )}

                    {highTasks.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold text-amber-500 font-sans tracking-[0.2em] uppercase mb-6 flex items-center">
                                <Clock size={16} className="mr-2" />
                                High Priority
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {highTasks.map(renderTaskCard)}
                            </div>
                        </section>
                    )}

                    {normalTasks.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold text-slate-500 dark:text-neutral-400 font-sans tracking-[0.2em] uppercase mb-6 flex items-center">
                                <CheckSquare size={16} className="mr-2" />
                                Standard Queue
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {normalTasks.map(renderTaskCard)}
                            </div>
                        </section>
                    )}

                    {completedTasks.length > 0 && (
                        <section className="opacity-60 hover:opacity-100 transition-opacity">
                            <h2 className="text-sm font-bold text-emerald-500 font-sans tracking-[0.2em] uppercase mb-6 flex items-center">
                                <CheckCircle2 size={16} className="mr-2" />
                                Completed
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {completedTasks.map(renderTaskCard)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </main>
    );
};

export default MyTasksPage;
