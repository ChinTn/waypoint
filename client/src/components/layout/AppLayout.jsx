import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare, Bell, Check, CheckCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import useProjectStore from '../../store/projectStore';
import socket from '../../api/socket';
import Background from './Background';
import CommandPalette from './CommandPalette';

const AppLayout = ({ children }) => {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const { logout, user } = useAuthStore();
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, addNotification } = useNotificationStore();
    const { fetchProjects } = useProjectStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch notifications on mount + connect to personal socket room
    useEffect(() => {
        if (user?._id) {
            fetchNotifications();
            fetchProjects();

            // Handler that fires AFTER the socket has actually connected to the server
            const onConnect = () => {
                socket.emit('join_user', user._id);
            };

            // If already connected (e.g. ProjectBoard connected it first), join immediately
            if (socket.connected) {
                socket.emit('join_user', user._id);
            }

            // Listen for future connections AND reconnections
            socket.on('connect', onConnect);

            // Connect the socket (no-op if already connected)
            socket.connect();

            // Listen for real-time notifications using Zustand getState to avoid stale closures
            socket.on('new_notification', (notification) => {
                useNotificationStore.getState().addNotification(notification);
            });

            // Listen for global project updates (like status changes on the dashboard)
            socket.on('project_updated', (updatedProject) => {
                syncProject(updatedProject);
            });

            // Listen for global project deletions
            socket.on('project_deleted', ({ projectId }) => {
                removeProject(projectId);
            });

            return () => {
                socket.off('connect', onConnect);
                socket.off('new_notification');
                socket.off('project_updated');
                socket.off('project_deleted');
            };
        }
    }, [user?._id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    return (
        <Background>
            <div className="flex flex-1 w-full h-full overflow-hidden">
                {/* --- COLLAPSIBLE SIDEBAR --- */}
                <motion.div 
                    onMouseEnter={() => setIsSidebarHovered(true)}
                    onMouseLeave={() => setIsSidebarHovered(false)}
                    initial={{ width: 0 }}
                    animate={{ width: isSidebarHovered || isNotifOpen ? 280 : 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="h-full bg-black/80 backdrop-blur-3xl border-r border-white/10 flex flex-col items-center py-10 relative z-50 flex-shrink-0"
                >
                    <AnimatePresence>
                        {(isSidebarHovered || isNotifOpen) && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-[280px] px-6 h-full flex flex-col"
                            >
                                <div className="text-white font-serif text-3xl tracking-widest mb-10 text-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">WAYPOINT</div>
                                
                                <CommandPalette />

                                <div className="space-y-4 flex-1 mt-2">
                                    <button 
                                        onClick={() => navigate('/dashboard')}
                                        className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${location.pathname === '/dashboard' ? 'bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <LayoutDashboard className="w-5 h-5" />
                                        <span className="font-sans font-bold tracking-widest uppercase text-sm">Overview</span>
                                    </button>
                                    <button 
                                        onClick={() => navigate('/projects')}
                                        className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${location.pathname === '/projects' ? 'bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <FolderKanban className="w-5 h-5" />
                                        <span className="font-sans font-bold tracking-widest uppercase text-sm">Projects</span>
                                    </button>
                                    <button 
                                        onClick={() => navigate('/my-tasks')}
                                        className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${location.pathname === '/my-tasks' ? 'bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <CheckSquare className="w-5 h-5" />
                                        <span className="font-sans font-bold tracking-widest uppercase text-sm">My Tasks</span>
                                    </button>

                                    {/* NOTIFICATIONS BUTTON IN SIDEBAR */}
                                    <div className="relative" ref={notifRef}>
                                        <button 
                                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                                            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${isNotifOpen ? 'bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <div className="relative">
                                                <Bell className="w-5 h-5" />
                                                {unreadCount > 0 && (
                                                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse">
                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-sans font-bold tracking-widest uppercase text-sm">Notifications</span>
                                        </button>

                                        {/* Notification Dropdown - opens to the right of sidebar */}
                                        <AnimatePresence>
                                            {isNotifOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute left-full top-0 ml-3 w-[380px] max-h-[500px] rounded-3xl bg-[#0a0a0a]/95 border border-white/10 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col z-[60]"
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                                        <h3 className="text-white font-sans font-semibold text-sm tracking-wide">Notifications</h3>
                                                        {unreadCount > 0 && (
                                                            <button
                                                                onClick={markAllAsRead}
                                                                className="text-[11px] font-sans font-medium text-[#3b82f6] hover:text-white transition-colors flex items-center gap-1.5"
                                                            >
                                                                <CheckCheck size={14} />
                                                                Mark all read
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* List */}
                                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                                        {notifications.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center py-16 px-6">
                                                                <Bell size={32} className="text-neutral-600 mb-4" />
                                                                <p className="text-neutral-500 text-sm font-sans text-center">No notifications yet</p>
                                                            </div>
                                                        ) : (
                                                            notifications.map((n) => (
                                                                <div
                                                                    key={n._id}
                                                                    onClick={() => {
                                                                        if (!n.isRead) markAsRead(n._id);
                                                                        if (n.projectId?._id) {
                                                                            navigate(`/project/${n.projectId._id}`);
                                                                            setIsNotifOpen(false);
                                                                        }
                                                                    }}
                                                                    className={`flex items-start gap-3 px-6 py-4 cursor-pointer transition-all border-b border-white/5 hover:bg-white/5 ${
                                                                        !n.isRead ? 'bg-[#3b82f6]/5' : ''
                                                                    }`}
                                                                >
                                                                    {/* Actor Avatar */}
                                                                    <div className="flex-shrink-0 mt-0.5">
                                                                        {n.actor?.avatar ? (
                                                                            <img src={n.actor.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                                                        ) : (
                                                                            <img src={`https://ui-avatars.com/api/?name=${n.actor?.fullName || 'User'}`} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                                                        )}
                                                                    </div>

                                                                    {/* Content */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-sans leading-snug ${
                                                                            !n.isRead ? 'text-white' : 'text-neutral-400'
                                                                        }`}>
                                                                            {n.message}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1.5">
                                                                            {n.projectId?.name && (
                                                                                <span className="text-[10px] font-sans text-neutral-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                                                                    {n.projectId.name}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-[10px] text-neutral-600 font-sans">
                                                                                {new Date(n.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Unread dot */}
                                                                    {!n.isRead && (
                                                                        <div className="flex-shrink-0 mt-2">
                                                                            <div className="w-2 h-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-4 text-red-400 hover:text-red-300 hover:bg-red-400/10 px-6 py-4 rounded-2xl transition-colors mt-auto"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-sans font-bold tracking-widest uppercase text-sm">Disconnect</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Hover trigger zone when collapsed */}
                    {!isSidebarHovered && (
                        <div className="absolute top-0 left-0 w-4 h-full cursor-pointer z-50"></div>
                    )}
                </motion.div>

                {/* --- DYNAMIC MAIN CONTENT --- */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {children}
                </div>
            </div>
        </Background>
    );
};

export default AppLayout;
