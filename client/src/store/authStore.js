import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
    persist(
        (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    register: async (fullName, email, password) => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/users/register', { fullName, email, password });
            // We do NOT set isAuthenticated to true here anymore
            set({ isLoading: false });
        } catch (error) {
            const errData = error.response?.data;
            const errMsg = errData?.errors?.length > 0 ? errData.errors[0] : errData?.message;
            set({ error: errMsg || 'Registration failed', isLoading: false });
            throw error;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/users/login', { email, password });
            set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            // Check if it's our clean validation array from the backend
            const errData = error.response?.data;
            const errMsg = errData?.errors?.length > 0 ? errData.errors[0] : errData?.message;
            set({ error: errMsg || 'Login failed', isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/users/logout');
            set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
            set({ error: 'Logout failed', isLoading: false });
        }
        }
    }),
    {
        name: 'auth-storage'
    }
));

export default useAuthStore;