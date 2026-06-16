import { create } from 'zustand';
import api from '../api/axios';

const useFlowStore = create((set, get) => ({
    nodes: [],
    edges: [],
    loading: false,
    error: null,

    fetchFlow: async (projectId) => {
        try {
            set({ loading: true, error: null });
            const response = await api.get(`/flows/project/${projectId}`);
            set({ 
                nodes: response.data.data.nodes || [], 
                edges: response.data.data.edges || [], 
                loading: false 
            });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to fetch flow', loading: false });
        }
    },

    saveFlow: async (projectId, nodes, edges) => {
        try {
            await api.put(`/flows/project/${projectId}`, { nodes, edges });
            // We don't necessarily need to update local state here if React Flow is managing it,
            // but we can if we want to ensure sync. Usually React Flow keeps local state fine.
        } catch (error) {
            console.error("Failed to save flow", error);
            throw error;
        }
    }
}));

export default useFlowStore;
