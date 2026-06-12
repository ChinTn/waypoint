import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, GitBranch, ExternalLink } from 'lucide-react';

const ProjectCard = ({ project, isDragging, onEdit, onDelete }) => {
    const navigate = useNavigate();

    return (
        <div 
            className={`group relative backdrop-blur-md border p-6 rounded-[1.5rem] shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-colors flex flex-col h-full ${isDragging ? 'bg-black/60 border-[#3b82f6] shadow-[0_0_30px_rgba(59,130,246,0.3)] z-50' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
        >
            {/* Colored shadow line */}
            <div className={`absolute top-0 left-0 w-full h-1 border-t-2 ${isDragging ? 'opacity-100' : 'opacity-50'}`} style={{ borderColor: project.accentColor }}></div>

            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-serif text-white shadow-lg border border-white/10 flex-shrink-0" style={{ backgroundColor: project.accentColor }}>
                    {project.name.charAt(0).toUpperCase()}
                </div>
                
                {/* Status Read-only Badge & Actions */}
                <div className="flex items-center space-x-2 ml-4">
                    <span className="bg-black/50 border border-white/10 text-neutral-400 text-[10px] font-bold font-mono uppercase tracking-widest rounded-full px-3 py-1.5 pointer-events-none whitespace-nowrap">
                        {project.status.replace('_', ' ')}
                    </span>
                    {project.myRole === 'OWNER' && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                                className="p-1.5 text-neutral-400 hover:text-[#3b82f6] hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <h3 
                onPointerDown={(e) => e.stopPropagation()} 
                onClick={(e) => { e.stopPropagation(); navigate(`/project/${project._id}`); }} 
                className="relative z-10 font-serif text-xl text-white mb-2 line-clamp-1 hover:text-[#3b82f6] transition-colors cursor-pointer"
            >
                {project.name}
            </h3>
            
            <p 
                onPointerDown={(e) => e.stopPropagation()} 
                onClick={(e) => { e.stopPropagation(); navigate(`/project/${project._id}`); }} 
                className="relative z-10 text-sm text-neutral-400 line-clamp-2 mb-4 flex-1 hover:text-white transition-colors cursor-pointer"
            >
                {project.description || 'No description provided.'}
            </p>

            {/* Optional Links */}
            {(project.githubLink || project.deployedLink) && (
                <div className="relative z-10 flex items-center space-x-4 mb-4">
                    {project.githubLink && (
                        <a 
                            href={project.githubLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()} 
                            className="flex items-center text-neutral-400 hover:text-white transition-colors"
                        >
                            <GitBranch className="w-4 h-4 mr-1.5" />
                            <span className="text-[10px] uppercase font-bold font-mono tracking-wider">Source</span>
                        </a>
                    )}
                    {project.deployedLink && (
                        <a 
                            href={project.deployedLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()} 
                            className="flex items-center text-neutral-400 hover:text-white transition-colors"
                        >
                            <ExternalLink className="w-4 h-4 mr-1.5" />
                            <span className="text-[10px] uppercase font-bold font-mono tracking-wider">Live</span>
                        </a>
                    )}
                </div>
            )}
            
            <div className="relative z-10 flex justify-between items-center text-[10px] font-bold font-mono text-neutral-500 uppercase tracking-widest pt-3 border-t border-white/5 pointer-events-none mt-auto">
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] bg-green-500"></span>
                    <span>{project.members?.length || 1} MBR</span>
                </span>
            </div>
        </div>
    );
};

export default ProjectCard;
