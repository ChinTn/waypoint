import { create } from 'zustand';
import api from '../api/axios';

const useDocumentStore = create((set, get) => ({
    documents: [],
    loading: false,
    error: null,

    fetchDocuments: async (projectId) => {
        try {
            set({ loading: true, error: null });
            const response = await api.get(`/documents/project/${projectId}`);
            set({ documents: response.data.data, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to fetch documents', loading: false });
        }
    },

    getDocumentById: async (documentId) => {
        try {
            const response = await api.get(`/documents/${documentId}`);
            // Update the single document in the store in case title/content changed externally
            set((state) => ({
                documents: state.documents.map(d => d._id === documentId ? response.data.data : d)
            }));
            return response.data.data;
        } catch (error) {
            console.error("Failed to fetch document", error);
            throw error;
        }
    },

    createDocument: async (projectId, title, content = "") => {
        try {
            const response = await api.post(`/documents/project/${projectId}`, { title, content });
            set((state) => ({
                documents: [response.data.data, ...state.documents]
            }));
            return response.data.data;
        } catch (error) {
            console.error("Failed to create document", error);
            throw error;
        }
    },

    updateDocument: async (documentId, updates) => {
        try {
            // Optimistic UI update
            set((state) => ({
                documents: state.documents.map(d => d._id === documentId ? { ...d, ...updates } : d)
            }));
            
            const response = await api.put(`/documents/${documentId}`, updates);
            return response.data.data;
        } catch (error) {
            console.error("Failed to update document", error);
            throw error;
        }
    },

    deleteDocument: async (documentId) => {
        try {
            await api.delete(`/documents/${documentId}`);
            set((state) => ({
                documents: state.documents.filter(d => d._id !== documentId)
            }));
        } catch (error) {
            console.error("Failed to delete document", error);
            throw error;
        }
    }
}));

export default useDocumentStore;
