import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, CheckCircle2, Circle, Clock, MessageSquare, UserPlus, ListTodo, Trash2, Plus } from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import useProjectStore from '../../store/projectStore';
import useAuthStore from '../../store/authStore';
import socket from '../../api/socket';
import DiscussionModal from './DiscussionModal';

const TaskDetailsModal = ({ taskId, onClose }) => {
    const { fetchTaskDetails, addComment, uploadTaskFile, assignTask, unassignTask, updateTaskDetails } = useTaskStore();
    const { members, fetchProjectMembers } = useProjectStore();
    const { user } = useAuthStore();
    
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [newSubtask, setNewSubtask] = useState("");
    const [uploading, setUploading] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descText, setDescText] = useState("");
    const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);

    const myMembership = members.find(m => m.userId._id === user?._id);
    const myRole = myMembership?.role || 'VIEWER';

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const details = await fetchTaskDetails(taskId);
                setTask(details);
                setDescText(details.description || "");
                if (details.projectId) {
                    fetchProjectMembers(details.projectId._id || details.projectId);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [taskId, fetchTaskDetails]);

        useEffect(() => {
        // Listen for task changes
        const handleTaskUpdate = (updatedTask) => {
            if (updatedTask._id === taskId) {
                // Merge the new data into our local state!
                setTask(prev => ({ ...prev, ...updatedTask }));
            }
        };

        // Listen for new comments
        const handleNewComment = ({ taskId: commentTaskId, comment }) => {
            if (commentTaskId === taskId) {
                setTask(prev => {
                    // Prevent duplicates: if the comment is already in the array (e.g. from our own optimistic update), ignore it
                    if (prev.comments?.some(c => c._id === comment._id)) return prev;
                    return { ...prev, comments: [...(prev.comments || []), comment] };
                });
            }
        };

        socket.on("task_updated", handleTaskUpdate);
        socket.on("comment_added", handleNewComment);

        return () => {
            // Clean up the listeners when the modal closes
            socket.off("task_updated", handleTaskUpdate);
            socket.off("comment_added", handleNewComment);
        };
    }, [taskId]);

    const handleAddComment = async (content) => {
        if (!content.trim() || myRole === 'VIEWER') return;
        
        try {
            const comment = await addComment(taskId, content);
            setTask(prev => {
                if (prev.comments?.some(c => c._id === comment._id)) return prev;
                return { ...prev, comments: [...(prev.comments || []), comment] };
            });
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || myRole === 'VIEWER') return;

        try {
            setUploading(true);
            const uploadedFile = await uploadTaskFile(taskId, file);
            setTask(prev => ({ ...prev, files: [uploadedFile, ...prev.files] }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("File upload failed! Did you add your Cloudinary API keys to the .env file?");
        } finally {
            setUploading(false);
        }
    };

    const handleDescSave = async () => {
        if (descText !== task.description) {
            try {
                await updateTaskDetails(taskId, { description: descText });
                setTask(prev => ({ ...prev, description: descText }));
            } catch (error) {
                console.error("Failed to save description", error);
            }
        }
        setIsEditingDesc(false);
    };

    const handleAssign = async (e) => {
        const assigneeId = e.target.value;
        if (!assigneeId) return;

        try {
            await assignTask(taskId, assigneeId);
            // Refresh details to get populated assignees
            const details = await fetchTaskDetails(taskId);
            setTask(details);
        } catch (error) {
            console.error("Assign failed", error);
        }
    };

    const handleUnassign = async (assigneeId) => {
        try {
            await unassignTask(taskId, assigneeId);
            const details = await fetchTaskDetails(taskId);
            setTask(details);
        } catch (error) {
            console.error("Unassign failed", error);
        }
    };

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!newSubtask.trim() || myRole === 'VIEWER') return;
        
        const newSubtasks = [...(task.subtasks || []), { title: newSubtask, isCompleted: false }];
        
        try {
            await updateTaskDetails(taskId, { subtasks: newSubtasks });
            setTask(prev => ({ ...prev, subtasks: newSubtasks }));
            setNewSubtask("");
        } catch (error) {
            console.error("Failed to add subtask", error);
        }
    };

    const handleToggleSubtask = async (index) => {
        if (myRole === 'VIEWER') return;
        const newSubtasks = [...(task.subtasks || [])];
        newSubtasks[index].isCompleted = !newSubtasks[index].isCompleted;
        
        try {
            await updateTaskDetails(taskId, { subtasks: newSubtasks });
            setTask(prev => ({ ...prev, subtasks: newSubtasks }));
        } catch (error) {
            console.error("Failed to toggle subtask", error);
        }
    };

    const handleDeleteSubtask = async (index) => {
        if (myRole === 'VIEWER') return;
        const newSubtasks = task.subtasks.filter((_, i) => i !== index);
        
        try {
            await updateTaskDetails(taskId, { subtasks: newSubtasks });
            setTask(prev => ({ ...prev, subtasks: newSubtasks }));
        } catch (error) {
            console.error("Failed to delete subtask", error);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
            </div>
        );
    }

    if (!task) return null;

    // Filter out users who are already assigned for the dropdown
    const assignedIds = task.assignedTo?.map(a => a._id) || [];
    const safeMembers = members || [];
    const availableMembersToAssign = safeMembers.filter(m => !assignedIds.includes(m._id));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-5xl h-[85vh] flex flex-col bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden"
            >
                {/* Header */}
                <header className="px-8 py-6 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                    <div className="flex-1 mr-8">
                        <div className="flex items-center space-x-3 mb-2">
                            <span className={`text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border ${task.priority === 'URGENT' ? 'border-red-500 text-red-100 bg-red-600' : task.priority === 'HIGH' ? 'border-red-500/50 text-red-400 bg-red-500/10' : task.priority === 'MEDIUM' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' : 'border-green-500/50 text-green-400 bg-green-500/10'}`}>
                                {task.priority}
                            </span>
                            <span className="text-xs font-mono text-neutral-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                {task.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h2 className="text-3xl font-serif text-white mt-4">{task.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </header>

                {/* Body (2 columns) */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    
                    {/* LEFT COLUMN: Details & Files */}
                    <div className="flex-1 md:w-2/3 overflow-y-auto custom-scrollbar p-8 border-r border-white/5">
                        <div className="mb-10">
                            <h3 className="text-sm font-bold font-mono text-neutral-500 uppercase tracking-widest mb-4">Description</h3>
                            {isEditingDesc && myRole !== 'VIEWER' ? (
                                <textarea
                                    autoFocus
                                    value={descText}
                                    onChange={(e) => setDescText(e.target.value)}
                                    onBlur={handleDescSave}
                                    className="w-full h-32 bg-black/40 text-neutral-200 text-sm leading-relaxed p-6 rounded-2xl border border-[#3b82f6] focus:outline-none resize-none custom-scrollbar"
                                    placeholder="Write a detailed description..."
                                />
                            ) : (
                                <div 
                                    onClick={() => myRole !== 'VIEWER' && setIsEditingDesc(true)}
                                    className={`text-neutral-300 text-sm leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap ${myRole !== 'VIEWER' ? 'cursor-pointer hover:border-white/20' : ''}`}
                                >
                                    {task.description || <span className="text-neutral-500 italic">Click to add description...</span>}
                                </div>
                            )}
                        </div>

                        <div className="mb-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold font-mono text-neutral-500 uppercase tracking-widest flex items-center">
                                    <ListTodo size={14} className="mr-2" /> Subtasks
                                </h3>
                                {/* Progress Bar */}
                                {task.subtasks?.length > 0 && (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#3b82f6] transition-all duration-500"
                                                style={{ width: `${Math.round((task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-neutral-400">
                                            {Math.round((task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {task.subtasks?.map((subtask, idx) => (
                                    <div key={idx} className="flex items-center group bg-black/20 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <button 
                                            onClick={() => handleToggleSubtask(idx)}
                                            disabled={myRole === 'VIEWER'}
                                            className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${subtask.isCompleted ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'border-neutral-600 hover:border-[#3b82f6] text-transparent'}`}
                                        >
                                            <CheckCircle2 size={12} className={subtask.isCompleted ? 'opacity-100' : 'opacity-0'} />
                                        </button>
                                        <span className={`flex-1 text-sm transition-colors ${subtask.isCompleted ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                                            {subtask.title}
                                        </span>
                                        {myRole !== 'VIEWER' && (
                                            <button 
                                                onClick={() => handleDeleteSubtask(idx)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {myRole !== 'VIEWER' && (
                                    <form onSubmit={handleAddSubtask} className="mt-4 flex items-center bg-white/5 p-1 pl-4 rounded-xl border border-white/10 focus-within:border-[#3b82f6] transition-colors">
                                        <Plus size={16} className="text-neutral-500 mr-2" />
                                        <input 
                                            type="text"
                                            value={newSubtask}
                                            onChange={(e) => setNewSubtask(e.target.value)}
                                            placeholder="Add a subtask..."
                                            className="flex-1 bg-transparent text-sm text-white py-2 outline-none"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newSubtask.trim()}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors"
                                        >
                                            Add
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        <div className="mb-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold font-mono text-neutral-500 uppercase tracking-widest flex items-center">
                                    <Paperclip size={14} className="mr-2" /> Attachments
                                </h3>
                                {myRole !== 'VIEWER' && (
                                    <label className="cursor-pointer text-xs font-bold font-mono text-[#3b82f6] hover:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 transition-colors">
                                        {uploading ? "Uploading..." : "Upload File"}
                                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {task.files?.map(file => (
                                    <a key={file._id} href={file.fileUrl} target="_blank" rel="noreferrer" className="flex items-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group">
                                        <div className="w-10 h-10 bg-black/30 rounded-lg flex items-center justify-center mr-4 text-blue-400 group-hover:scale-110 transition-transform">
                                            <Paperclip size={18} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm text-white truncate font-medium">{file.fileName}</p>
                                            <p className="text-xs text-neutral-500 font-mono mt-1">{(file.fileSize / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </a>
                                ))}
                                {task.files?.length === 0 && (
                                    <div className="col-span-full py-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                        <p className="text-sm font-mono text-neutral-500">No attachments yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Assignees & Comments */}
                    <div className="w-full md:w-1/3 flex flex-col bg-black/20">
                        {/* Assignees Section */}
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-sm font-bold font-mono text-neutral-500 uppercase tracking-widest flex items-center mb-4">
                                <UserPlus size={14} className="mr-2" /> Assignees
                            </h3>
                            <div className="space-y-3 mb-4">
                                {task.assignedTo?.map(assignee => {
                                    // Check if user is allowed to unassign this person
                                    const isMe = assignee.userId._id === user?._id;
                                    const canUnassign = myRole === 'OWNER' || myRole === 'ADMIN' || isMe;
                                    return (
                                    <div key={assignee._id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center">
                                            <img src={assignee.userId.avatar || `https://ui-avatars.com/api/?name=${assignee.userId.fullName}`} alt="Avatar" className="w-8 h-8 rounded-full mr-3 border border-white/10" />
                                            <span className="text-sm text-white font-medium">{assignee.userId.fullName}</span>
                                        </div>
                                        {canUnassign && myRole !== 'VIEWER' && (
                                            <button 
                                                onClick={() => handleUnassign(assignee._id)}
                                                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )})}
                                {task.assignedTo?.length === 0 && (
                                    <p className="text-xs font-mono text-neutral-500">Unassigned</p>
                                )}
                            </div>

                            {/* RBAC: Only Owners/Admins can assign others. Members can only assign themselves. */}
                            {myRole !== 'VIEWER' && availableMembersToAssign.length > 0 && (
                                <select 
                                    onChange={handleAssign}
                                    value=""
                                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#3b82f6] appearance-none"
                                >
                                    <option value="" disabled>+ Assign Member</option>
                                    {availableMembersToAssign.map(member => {
                                        // RBAC check for rendering options
                                        const isMe = member.userId._id === user?._id;
                                        const canAssign = myRole === 'OWNER' || myRole === 'ADMIN' || isMe;
                                        
                                        if (canAssign) {
                                            return <option key={member._id} value={member._id}>{member.userId.fullName || 'Unknown User'} {isMe ? '(Me)' : ''}</option>;
                                        }
                                        return null;
                                    })}
                                </select>
                            )}
                        </div>

                        {/* Discussion Button */}
                        <div className="p-6 border-b border-white/5 bg-black/10">
                            <button 
                                onClick={() => setIsDiscussionOpen(true)}
                                className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center border border-[#3b82f6]/30 group-hover:bg-[#3b82f6]/30 transition-colors">
                                        <MessageSquare size={20} className="text-[#3b82f6]" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white mb-0.5">Task Discussion</h3>
                                        <p className="text-xs font-mono text-neutral-400">{task.comments?.length || 0} comments</p>
                                    </div>
                                </div>
                                <div className="flex -space-x-2">
                                    {task.comments?.slice(0, 3).map(c => (
                                        <img key={c._id} src={c.authorId?.userId?.avatar || `https://ui-avatars.com/api/?name=${c.authorId?.userId?.fullName || 'User'}`} alt="" className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover" />
                                    ))}
                                    {task.comments?.length > 3 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[9px] font-bold text-white z-0 relative">
                                            +{task.comments.length - 3}
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>

                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isDiscussionOpen && (
                    <DiscussionModal 
                        comments={task.comments}
                        onAddComment={handleAddComment}
                        myRole={myRole}
                        onClose={() => setIsDiscussionOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskDetailsModal;
