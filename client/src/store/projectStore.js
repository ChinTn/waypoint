import { create } from 'zustand';
import api from '../api/axios';

const useProjectStore = create((set) => ({
    projects: [],
    members: [],
    isLoading: false,
    error: null,

    fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/projects');
            set({ projects: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch projects', isLoading: false });
        }
    },

    syncProject: (updatedProject) => {
        set((state) => ({
            projects: state.projects.map(project => 
                project._id === updatedProject._id ? { ...project, ...updatedProject } : project
            )
        }));
    },

    removeProject: (projectId) => {
        set((state) => ({
            projects: state.projects.filter(project => project._id !== projectId)
        }));
    },

    createProject: async (projectData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/projects', projectData);
            // Instantly append the new project to our UI list!
            set((state) => ({ 
                projects: [...state.projects, { ...response.data.data, myRole: 'OWNER' }],
                isLoading: false 
            }));
            return response.data.data;
        } catch (error) {
            console.error("Error creating project:", error);
            // Optionally set error state here
        }
    },

    updateProjectStatus: async (projectId, newStatus) => {
        // Optimistic UI update
        set((state) => ({
            projects: state.projects.map(project => 
                project._id === projectId ? { ...project, status: newStatus } : project
            )
        }));

        try {
            await api.patch(`/projects/${projectId}/status`, { status: newStatus });
        } catch (error) {
            const errDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Backend Failed to save project status: ${errDetails}. DID YOU RESTART THE BACKEND SERVER?`);
            console.error('Failed to update project status:', errDetails);
        }
    },

    updateProject: async (projectId, projectData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`/projects/${projectId}`, projectData);
            set((state) => ({
                projects: state.projects.map(project => 
                    project._id === projectId ? { ...project, ...response.data.data } : project
                ),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to update project', isLoading: false });
            throw error;
        }
    },

    deleteProject: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`/projects/${projectId}`);
            set((state) => ({
                projects: state.projects.filter(project => project._id !== projectId),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to delete project', isLoading: false });
            throw error;
        }
    },

    // ==========================================
    // MEMBER MANAGEMENT & INVITES
    // ==========================================

    fetchProjectMembers: async (projectId) => {
        try {
            const response = await api.get(`/projects/${projectId}/members`);
            set({ members: response.data.data });
        } catch (error) {
            console.error("Failed to fetch members", error);
        }
    },

    generateInviteLink: async (projectId, email) => {
        try {
            const response = await api.post(`/projects/${projectId}/invite`, { email });
            return response.data.data.inviteToken;
        } catch (error) {
            console.error("Failed to generate invite", error);
            throw error;
        }
    },

    joinProject: async (token) => {
        try {
            const response = await api.post(`/projects/join/${token}`);
            return response.data.data;
        } catch (error) {
            console.error("Failed to join project", error);
            throw error;
        }
    },

    updateMemberRole: async (projectId, memberId, role) => {
        try {
            const response = await api.patch(`/projects/${projectId}/members/${memberId}`, { role });
            set((state) => ({
                members: state.members.map(m => m._id === memberId ? { ...m, role: response.data.data.role } : m)
            }));
        } catch (error) {
            console.error("Failed to update role", error);
            throw error;
        }
    },

    removeMember: async (projectId, memberId) => {
        try {
            await api.delete(`/projects/${projectId}/members/${memberId}`);
            set((state) => ({
                members: state.members.filter(m => m._id !== memberId)
            }));
        } catch (error) {
            console.error("Failed to remove member", error);
            throw error;
        }
    }
}));

export default useProjectStore;