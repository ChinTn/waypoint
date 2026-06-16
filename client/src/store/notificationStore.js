import { create } from 'zustand';
import api from '../api/axios';

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    // Fetch all notifications from the backend
    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get('/notifications');
            const notifications = res.data.data;
            set({
                notifications,
                unreadCount: notifications.filter(n => !n.isRead).length,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ isLoading: false });
        }
    },

    // Called when a real-time notification arrives via socket
    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },

    // Mark a single notification as read
    markAsRead: async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            set((state) => ({
                notifications: state.notifications.map(n =>
                    n._id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    },

    // Mark ALL notifications as read
    markAllAsRead: async () => {
        try {
            await api.patch('/notifications/read-all');
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0,
            }));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    },
}));

export default useNotificationStore;
