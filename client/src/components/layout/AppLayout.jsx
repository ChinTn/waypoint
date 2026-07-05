import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare, Bell, CheckCheck, Play } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import useProjectStore from '../../store/projectStore';
import socket from '../../api/socket';
import Background from './Background';
import CommandPalette from './CommandPalette';
import ThemeToggle from './ThemeToggle';
import ProfileSettingsModal from './ProfileSettingsModal';

const AppLayout = ({ children }) => {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const notifRef = useRef(null);
    const { logout, user } = useAuthStore();
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, addNotification } = useNotificationStore();
    const { fetchProjects, syncProject, removeProject } = useProjectStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch notifications on mount + connect to personal socket room
    useEffect(() => {
        if (user?._id) {
            fetchNotifications();
            fetchProjects();

            const onConnect = () => {
                socket.emit('join_user', user._id);
            };

            if (socket.connected) {
                socket.emit('join_user', user._id);
            }

            socket.on('connect', onConnect);

            const handleNewNotification = (notification) => {
                useNotificationStore.getState().addNotification(notification);
            };

            const handleProjectUpdated = (updatedProject) => {
                syncProject(updatedProject);
            };

            const handleProjectDeleted = ({ projectId }) => {
                removeProject(projectId);
            };

            socket.on('new_notification', handleNewNotification);
            socket.on('project_updated', handleProjectUpdated);
            socket.on('project_deleted', handleProjectDeleted);

            return () => {
                socket.off('connect', onConnect);
                socket.off('new_notification', handleNewNotification);
                socket.off('project_updated', handleProjectUpdated);
                socket.off('project_deleted', handleProjectDeleted);
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

    const navLinks = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/projects', label: 'Projects', icon: FolderKanban },
        { path: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
    ];

    return (
        <Background>
            <div className="flex flex-col w-full h-full overflow-hidden">
                {/* --- TOP NAVIGATION --- */}
                <header className="flex-shrink-0 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl z-50">
                    <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                        {/* Logo Left */}
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                                <Play className="w-4 h-4 fill-current" />
                            </div>
                            <span className="font-bold text-xl text-neutral-900 dark:text-white font-sans tracking-tight">Waypoint</span>
                        </div>

                        {/* Navigation Center (or right aligned with tools) */}
                        <nav className="flex items-center space-x-1 ml-auto mr-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors text-sm font-semibold ${
                                        location.pathname === link.path 
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400' 
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white'
                                    }`}
                                >
                                    <link.icon className="w-4 h-4" />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Tools Right */}
                        <div className="flex items-center space-x-4">
                            <CommandPalette />
                            
                            <ThemeToggle />

                            {/* Notifications */}
                            <div className="relative" ref={notifRef}>
                                <button 
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className="p-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors relative"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-neutral-900 rounded-full"></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                <AnimatePresence>
                                    {isNotifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 top-full mt-2 w-[380px] max-h-[500px] rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden flex flex-col z-[60]"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
                                                <h3 className="text-neutral-900 dark:text-white font-semibold text-sm">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllAsRead}
                                                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                                                    >
                                                        <CheckCheck size={14} />
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            {/* List */}
                                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                                {notifications.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-12 px-6">
                                                        <Bell size={32} className="text-slate-300 dark:text-neutral-600 mb-3" />
                                                        <p className="text-slate-500 dark:text-neutral-500 text-sm">No notifications yet</p>
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
                                                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 ${
                                                                !n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                                            }`}
                                                        >
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                {n.actor?.avatar ? (
                                                                    <img src={n.actor.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                                ) : (
                                                                    <img src={`https://ui-avatars.com/api/?name=${n.actor?.fullName || 'User'}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm leading-snug ${
                                                                    !n.isRead ? 'text-neutral-900 dark:text-white font-medium' : 'text-slate-600 dark:text-neutral-400'
                                                                }`}>
                                                                    {n.message}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {n.projectId?.name && (
                                                                        <span className="text-[10px] text-slate-500 dark:text-neutral-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5">
                                                                            {n.projectId.name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-slate-400 dark:text-neutral-600">
                                                                        {new Date(n.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {!n.isRead && (
                                                                <div className="flex-shrink-0 mt-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
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

                            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>

                            {/* User Menu / Logout */}
                            <button 
                                onClick={handleLogout}
                                className="p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-400/10 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                            
                            {/* User Avatar */}
                            <button 
                                onClick={() => setIsProfileModalOpen(true)}
                                className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 ml-2 flex-shrink-0 hover:border-blue-500 transition-colors focus:outline-none"
                            >
                                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=random`} alt="User" className="w-full h-full object-cover" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* --- DYNAMIC MAIN CONTENT --- */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {children}
                </div>
            </div>

            <ProfileSettingsModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
            />
        </Background>
    );
};

export default AppLayout;
