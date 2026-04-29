import axiosInstance from '../api/axiosInstance';

export const bookingService = {
  // Create a new booking
  createBooking: async (data) => {
    const response = await axiosInstance.post('/bookings', data);
    return response.data;
  },

  // Get current user's bookings
  getMyBookings: async () => {
    const response = await axiosInstance.get('/bookings/my');
    return response.data;
  },

  // Get ALL bookings (ADMIN only)
  getAllBookings: async () => {
    const response = await axiosInstance.get('/bookings');
    return response.data;
  },

  // Get single booking by ID
  getBookingById: async (id) => {
    const response = await axiosInstance.get(`/bookings/${id}`);
    return response.data;
  },

  // Approve a booking (ADMIN)
  approveBooking: async (id) => {
    const response = await axiosInstance.patch(`/bookings/${id}/approve`);
    return response.data;
  },

  // Reject a booking with reason (ADMIN)
  rejectBooking: async (id, reason) => {
    const response = await axiosInstance.patch(`/bookings/${id}/reject`, { reason });
    return response.data;
  },

  // Cancel a booking (USER)
  cancelBooking: async (id) => {
    const response = await axiosInstance.patch(`/bookings/${id}/cancel`);
    return response.data;
  },

  // Delete a booking entirely (USER - for PENDING/REJECTED/CANCELLED)
  deleteBooking: async (id) => {
    const response = await axiosInstance.delete(`/bookings/${id}`);
    return response.data;
  },
};

export default bookingService;
