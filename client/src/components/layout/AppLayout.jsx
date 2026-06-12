import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Background from './Background';

const AppLayout = ({ children }) => {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

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
                    animate={{ width: isSidebarHovered ? 280 : 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="h-full bg-black/80 backdrop-blur-3xl border-r border-white/10 flex flex-col items-center py-10 relative z-50 flex-shrink-0 overflow-hidden"
                >
                    <AnimatePresence>
                        {isSidebarHovered && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full px-6 h-full flex flex-col"
                            >
                                <div className="text-white font-serif text-3xl tracking-widest mb-16 text-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">WAYPOINT</div>
                                
                                <div className="space-y-4 flex-1">
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
