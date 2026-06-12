import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Paperclip, CheckCircle2, Circle, Clock, MessageSquare, UserPlus } from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import useProjectStore from '../../store/projectStore';

const TaskDetailsModal = ({ taskId, onClose }) => {
    const { fetchTaskDetails, addComment, uploadTaskFile, assignTask, unassignTask, updateTaskDetails } = useTaskStore();
    const { currentProject, members } = useProjectStore();
    
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [uploading, setUploading] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descText, setDescText] = useState("");

    const myRole = currentProject?.myRole;

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const details = await fetchTaskDetails(taskId);
                setTask(details);
                setDescText(details.description || "");
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [taskId, fetchTaskDetails]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || myRole === 'VIEWER') return;
        
        try {
            const comment = await addComment(taskId, newComment);
            setTask(prev => ({ ...prev, comments: [...prev.comments, comment] }));
            setNewComment("");
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
                                {task.assignedTo?.map(assignee => (
                                    <div key={assignee._id} className="flex items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                        <img src={assignee.userId.avatar || `https://ui-avatars.com/api/?name=${assignee.userId.fullName}`} alt="Avatar" className="w-8 h-8 rounded-full mr-3 border border-white/10" />
                                        <span className="text-sm text-white font-medium">{assignee.userId.fullName}</span>
                                    </div>
                                ))}
                                {task.assignedTo?.length === 0 && (
                                    <p className="text-xs font-mono text-neutral-500">Unassigned</p>
                                )}
                            </div>

                            {/* RBAC: Only Owners/Admins can assign others. Members can only assign themselves. */}
                            {myRole !== 'VIEWER' && availableMembersToAssign.length > 0 && (
                                <select 
                                    onChange={handleAssign}
                                    defaultValue=""
                                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#3b82f6] appearance-none"
                                >
                                    <option value="" disabled>+ Assign Member</option>
                                    {availableMembersToAssign.map(member => {
                                        // RBAC check for rendering options
                                        const isMe = member._id === currentProject?.myMembershipId;
                                        const canAssign = myRole === 'OWNER' || myRole === 'ADMIN' || isMe;
                                        
                                        if (canAssign) {
                                            return <option key={member._id} value={member._id}>{member?.user?.fullName || 'Unknown User'} {isMe ? '(Me)' : ''}</option>;
                                        }
                                        return null;
                                    })}
                                </select>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <h3 className="text-sm font-bold font-mono text-neutral-500 uppercase tracking-widest flex items-center p-6 pb-2">
                                <MessageSquare size={14} className="mr-2" /> Discussion
                            </h3>
                            
                            {/* Comment Feed */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {task.comments?.map(comment => (
                                    <div key={comment._id} className="flex space-x-4">
                                        <img src={comment.authorId.userId.avatar || `https://ui-avatars.com/api/?name=${comment.authorId.userId.fullName}`} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" />
                                        <div>
                                            <div className="flex items-baseline space-x-2 mb-1">
                                                <span className="text-sm font-semibold text-white">{comment.authorId.userId.fullName}</span>
                                                <span className="text-[10px] font-mono text-neutral-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-sm text-neutral-300 bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-sm leading-relaxed">
                                                {comment.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {task.comments?.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-sm font-mono text-neutral-500">No comments yet. Start the discussion!</p>
                                    </div>
                                )}
                            </div>

                            {/* Comment Input */}
                            {myRole !== 'VIEWER' && (
                                <div className="p-6 pt-4 border-t border-white/5 bg-black/40">
                                    <form onSubmit={handleAddComment} className="relative">
                                        <textarea 
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-4 text-sm text-white focus:outline-none focus:border-[#3b82f6] resize-none custom-scrollbar"
                                            rows="2"
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!newComment.trim()}
                                            className="absolute right-3 bottom-4 p-2 bg-[#3b82f6] text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-[#3b82f6] transition-colors"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TaskDetailsModal;
