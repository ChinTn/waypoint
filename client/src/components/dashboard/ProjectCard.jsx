import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Lock, Unlock, Edit2, Trash2 } from 'lucide-react';

const ProjectCard = ({ project, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const isActive = project.status === 'ACTIVE';

    // The user wants a toggle switch visual. We will make it purely visual for now based on status.
    // If they want it functional, they can tie it to updateProjectStatus later.
    
    return (
        <div 
            className="group relative bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[180px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
                        {project?.name ? project.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                        <div className="flex items-center space-x-1">
                            <h3 
                                onClick={(e) => { e.stopPropagation(); navigate(`/project/${project?._id}`); }}
                                className="font-bold text-neutral-900 dark:text-white text-[15px] cursor-pointer hover:text-blue-600 transition-colors"
                            >
                                {project?.name || 'Untitled'}
                            </h3>
                            {project.githubLink && (
                                <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-500 mt-0.5 truncate max-w-[150px]">
                            {project.description || 'No description'}
                        </p>
                    </div>
                </div>

                {/* Removed Toggle Switch per user request */}
            </div>

            {/* Branch / Status string */}
            <div className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 tracking-widest uppercase mb-auto mt-2">
                PROJECT • {project.status.replace('_', ' ')}
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-end mt-4">
                <div className="flex items-center space-x-3">
                    {/* Removed Private Badge per user request */}
                    <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 dark:text-neutral-400">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-neutral-600'}`}></div>
                        <span>{project?.members?.length || 1} Members</span>
                    </div>
                </div>

                {/* Actions that appear on hover */}
                {project.myRole === 'OWNER' && (
                    <div className={`flex items-center space-x-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                         <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectCard;
