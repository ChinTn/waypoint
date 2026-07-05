import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';

const DiscussionModal = ({ comments, onAddComment, myRole, onClose }) => {
    const [newComment, setNewComment] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || myRole === 'VIEWER') return;
        
        await onAddComment(newComment);
        setNewComment("");
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl h-[75vh] flex flex-col bg-white/95 dark:bg-neutral-900/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative"
            >
                {/* Header */}
                <header className="px-8 py-5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                    <h3 className="text-sm font-bold font-sans text-neutral-900 dark:text-white flex items-center uppercase tracking-widest">
                        <MessageSquare size={16} className="mr-3 text-blue-600 dark:text-[#3b82f6]" /> Task Discussion
                    </h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors border border-slate-200 dark:border-white/5">
                        <X size={16} />
                    </button>
                </header>
                
                {/* Comment Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                    {comments?.map(comment => (
                        <div key={comment._id} className="flex space-x-4">
                            <img src={comment.authorId?.userId?.avatar || `https://ui-avatars.com/api/?name=${comment.authorId?.userId?.fullName || 'User'}`} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex-shrink-0 object-cover" />
                            <div className="flex-1">
                                <div className="flex items-baseline space-x-2 mb-1.5">
                                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{comment.authorId?.userId?.fullName}</span>
                                    <span className="text-[10px] font-sans text-slate-500 dark:text-neutral-500">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="inline-block text-sm text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 rounded-2xl rounded-tl-sm leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!comments || comments.length === 0) && (
                        <div className="text-center py-16 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5 mb-4">
                                <MessageSquare size={24} className="text-slate-400 dark:text-neutral-500" />
                            </div>
                            <p className="text-sm font-sans text-slate-500 dark:text-neutral-500">No comments yet. Start the discussion!</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Comment Input */}
                {myRole !== 'VIEWER' && (
                    <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-neutral-950/40">
                        <form onSubmit={handleSubmit} className="relative">
                            <textarea 
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                placeholder="Type your message here..."
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] resize-none custom-scrollbar"
                                rows="3"
                            />
                            <button 
                                type="submit" 
                                disabled={!newComment.trim()}
                                className="absolute right-4 bottom-4 p-2.5 bg-blue-600 dark:bg-[#3b82f6] text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-600 dark:disabled:hover:bg-[#3b82f6] transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default DiscussionModal;
