import axiosInstance from '../api/axiosInstance';

const notificationService = {
  getNotifications: async () => {
    const response = await axiosInstance.get('/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id) => {
    await axiosInstance.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await axiosInstance.post('/notifications/mark-all-read');
  },

  deleteNotification: async (id) => {
    await axiosInstance.delete(`/notifications/${id}`);
  },

  sendTestNotification: async () => {
    const response = await axiosInstance.get('/notifications/test');
    return response.data;
  }
};

export default notificationService;
