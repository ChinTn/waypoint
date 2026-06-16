import { create } from 'zustand';
import api from '../api/axios';

const useTaskStore = create((set) => ({
    tasks: [],
    myTasks: [],
    isLoading: false,
    error: null,

    fetchMyTasks: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/tasks/me`);
            set({ myTasks: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch my tasks', isLoading: false });
        }
    },

    fetchTasks: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/tasks/project/${projectId}`);
            set({ tasks: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch tasks', isLoading: false });
        }
    },

    createTask: async (taskData) => {
        try {
            const response = await api.post('/tasks', taskData);
            // Append the newly created task instantly
            set((state) => ({ tasks: [response.data.data, ...state.tasks] }));
        } catch (error) {
            console.error(error);
        }
    },

    updateTaskStatus: async (taskId, newStatus) => {
        // OPTIMISTIC UI: We update the state instantly so the drag feels blazing fast!
        set((state) => ({
            tasks: state.tasks.map(task => 
                task._id === taskId ? { ...task, status: newStatus } : task
            )
        }));

        try {
            // Then we tell the backend to save the change silently in the background
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
        } catch (error) {
            const errDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Backend Failed to save task: ${errDetails}. DID YOU RESTART THE BACKEND SERVER?`);
            console.error('Failed to update task status on server:', errDetails);
        }
    },

    // ADVANCED TASK MANAGEMENT (Phase 1)
    
    fetchTaskDetails: async (taskId) => {
        try {
            const [taskRes, commentsRes, filesRes] = await Promise.all([
                api.get(`/tasks/${taskId}`),
                api.get(`/tasks/${taskId}/comments`),
                api.get(`/tasks/${taskId}/files`)
            ]);
            
            return {
                ...taskRes.data.data,
                comments: commentsRes.data.data,
                files: filesRes.data.data
            };
        } catch (error) {
            console.error('Failed to fetch full task details:', error);
            throw error;
        }
    },

    assignTask: async (taskId, assigneeId) => {
        try {
            await api.post(`/tasks/${taskId}/assign`, { assigneeId });
        } catch (error) {
            console.error('Failed to assign task:', error);
            throw error;
        }
    },

    unassignTask: async (taskId, assigneeId) => {
        try {
            await api.delete(`/tasks/${taskId}/assign/${assigneeId}`);
        } catch (error) {
            console.error('Failed to unassign task:', error);
            throw error;
        }
    },

    addComment: async (taskId, content) => {
        try {
            const res = await api.post(`/tasks/${taskId}/comments`, { content });
            return res.data.data;
        } catch (error) {
            console.error('Failed to add comment:', error);
            throw error;
        }
    },

    uploadTaskFile: async (taskId, file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const res = await api.post(`/tasks/${taskId}/files`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return res.data.data;
        } catch (error) {
            console.error('Failed to upload file:', error);
            throw error;
        }
    },

    updateTaskDetails: async (taskId, updates) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, updates);
        } catch (error) {
            console.error('Failed to update task details:', error);
            throw error;
        }
    },

    updateTaskPriority: async (taskId, newPriority) => {
        set((state) => ({
            tasks: state.tasks.map(task => 
                task._id === taskId ? { ...task, priority: newPriority } : task
            )
        }));

        try {
            await api.patch(`/tasks/${taskId}/status`, { priority: newPriority });
        } catch (error) {
            console.error('Failed to update task priority:', error);
        }
    }
}));

export default useTaskStore;