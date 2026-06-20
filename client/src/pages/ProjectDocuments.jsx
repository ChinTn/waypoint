import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import useDocumentStore from '../store/documentStore';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import TiptapEditor from '../components/documents/TiptapEditor';
import ErrorBoundary from '../components/ErrorBoundary';

const ProjectDocuments = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { projects, members, fetchProjectMembers, fetchProjects, isLoading } = useProjectStore();
    const { documents, fetchDocuments, getDocumentById, createDocument, updateDocument, deleteDocument, loading } = useDocumentStore();
    
    const [activeDocId, setActiveDocId] = useState(null);

    const project = projects.find(p => p._id === projectId);
    const myMembership = members.find(m => m.userId._id === user?._id);
    const myRole = myMembership?.role || project?.myRole || 'VIEWER';

    useEffect(() => {
        if (projects.length === 0) fetchProjects();
        if (projectId) {
            fetchProjectMembers(projectId);
            fetchDocuments(projectId);
        }
    }, [projectId, fetchProjects, fetchProjectMembers, fetchDocuments, projects.length]);

    // Automatically select the first document if none is selected
    useEffect(() => {
        if (documents.length > 0 && !activeDocId) {
            setActiveDocId(documents[0]._id);
        } else if (documents.length === 0) {
            setActiveDocId(null);
        }
    }, [documents, activeDocId]);

    // Fetch the full content for the active document (since the sidebar list excludes the content to save bandwidth)
    useEffect(() => {
        if (activeDocId) {
            getDocumentById(activeDocId);
        }
    }, [activeDocId, getDocumentById]);

    const activeDoc = documents.find(d => d._id === activeDocId);

    const handleCreateDoc = async () => {
        if (myRole === 'VIEWER') return;
        const newDoc = await createDocument(projectId, "Untitled Document", "");
        setActiveDocId(newDoc._id);
    };

    const handleTitleUpdate = async (e) => {
        if (!activeDoc || myRole === 'VIEWER') return;
        const newTitle = e.target.value;
        await updateDocument(activeDoc._id, { title: newTitle });
    };

    const handleContentUpdate = async (html) => {
        if (!activeDoc || myRole === 'VIEWER') return;
        await updateDocument(activeDoc._id, { content: html });
    };

    const handleDelete = async (docId, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this document?")) {
            await deleteDocument(docId);
            if (activeDocId === docId) {
                setActiveDocId(null);
            }
        }
    };

    if (isLoading && !project) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#0a0a0a]">
                <div className="w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-neutral-400 font-mono text-sm uppercase tracking-widest">Loading Documents...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#0a0a0a]">
                <p className="text-neutral-400 font-mono text-sm uppercase tracking-widest mb-4">Project not found</p>
                <button onClick={() => navigate('/projects')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors">
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <ErrorBoundary>
        <main className="flex h-full w-full bg-[#0a0a0a] overflow-hidden">
            {/* LEFT SIDEBAR: Document List */}
            <div className="w-64 md:w-80 border-r border-white/5 bg-black/20 flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center space-x-3">
                    <button onClick={() => navigate(`/project/${projectId}`)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors" title="Back to Hub">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 className="text-sm font-bold font-mono uppercase tracking-widest text-neutral-500">Docs</h2>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-1">
                    {myRole !== 'VIEWER' && (
                        <button 
                            onClick={handleCreateDoc}
                            className="w-full flex items-center p-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors mb-4 group border border-dashed border-white/10"
                        >
                            <Plus size={16} className="mr-3 group-hover:text-[#3b82f6] transition-colors" />
                            New Document
                        </button>
                    )}

                    {loading && documents.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-500 font-mono animate-pulse">Loading docs...</div>
                    ) : documents.map(doc => {
                        const isSelected = activeDocId === doc._id;
                        // Determine if user can delete (Admin, Owner, or Creator)
                        const canDelete = myRole === 'ADMIN' || myRole === 'OWNER' || doc.createdBy._id === user?._id;
                        
                        return (
                            <div 
                                key={doc._id}
                                onClick={() => setActiveDocId(doc._id)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${
                                    isSelected ? 'bg-[#3b82f6]/10 text-white border border-[#3b82f6]/20' : 'text-neutral-400 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center truncate pr-2">
                                    <FileText size={16} className={`mr-3 flex-shrink-0 ${isSelected ? 'text-[#3b82f6]' : 'text-neutral-500'}`} />
                                    <span className="text-sm truncate font-medium">{doc.title}</span>
                                </div>
                                {canDelete && myRole !== 'VIEWER' && (
                                    <button 
                                        onClick={(e) => handleDelete(doc._id, e)}
                                        className={`p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all ${isSelected ? 'opacity-100' : ''}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT MAIN AREA: Editor */}
            <div className="flex-1 flex flex-col bg-black/40 relative">
                {activeDoc ? (
                    <motion.div 
                        key={activeDoc._id} // Re-mounts animation when changing docs
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col p-8 md:p-12 max-w-4xl mx-auto w-full h-full"
                    >
                        {/* Title Editor */}
                        <div className="mb-8">
                            <input
                                type="text"
                                value={activeDoc.title}
                                onChange={handleTitleUpdate}
                                disabled={myRole === 'VIEWER'}
                                placeholder="Document Title"
                                className="w-full bg-transparent text-3xl md:text-5xl font-serif text-white font-bold outline-none placeholder-neutral-700"
                            />
                            <div className="flex items-center space-x-2 mt-4 text-xs font-mono text-neutral-500">
                                <img src={activeDoc.createdBy?.avatar || `https://ui-avatars.com/api/?name=${activeDoc.createdBy?.fullName || 'User'}`} className="w-5 h-5 rounded-full" alt="" />
                                <span>Created by {activeDoc.createdBy?.fullName}</span>
                                <span>•</span>
                                <span>Last edited {new Date(activeDoc.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Tiptap Rich Text Editor */}
                        <div className="flex-1 min-h-0 pb-12">
                            <TiptapEditor 
                                documentId={activeDoc._id}
                                initialContent={activeDoc.content} 
                                onUpdate={handleContentUpdate} 
                                editable={myRole !== 'VIEWER'} 
                            />
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
                            <FileText size={32} className="text-neutral-600" />
                        </div>
                        <h2 className="text-xl font-serif text-white mb-2">No Document Selected</h2>
                        <p className="text-sm text-neutral-500 max-w-sm">
                            {myRole !== 'VIEWER' 
                                ? "Create a new document from the sidebar to start writing PRDs, notes, and specs."
                                : "Select a document from the sidebar to read."
                            }
                        </p>
                    </div>
                )}
            </div>
        </main>
        </ErrorBoundary>
    );
};

export default ProjectDocuments;
