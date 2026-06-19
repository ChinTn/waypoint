import { create } from 'zustand';
import axios from '../api/axios';

const useSearchStore = create((set) => ({
    results: { projects: [], tasks: [], documents: [] },
    isLoading: false,
    
    searchQuery: async (query) => {
        if (!query || query.length < 2) {
            set({ results: { projects: [], tasks: [], documents: [] } });
            return;
        }
        
        set({ isLoading: true });
        try {
            const response = await axios.get(`/search?q=${encodeURIComponent(query)}`);
            set({ results: response.data, isLoading: false });
        } catch (error) {
            console.error("Search failed:", error);
            set({ isLoading: false });
        }
    },
    
    clearSearch: () => set({ results: { projects: [], tasks: [], documents: [] } })
}));

export default useSearchStore;