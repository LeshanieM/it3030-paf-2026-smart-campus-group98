import axiosInstance from '../../../api/axiosInstance';

const BASE_URL = '/admin/tickets';

export const getAllTickets = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data;
};

export const getTicketDetails = async (id) => {
  const response = await axiosInstance.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const updateTicketStatus = async (id, statusOrPayload) => {
  const payload = typeof statusOrPayload === 'string'
    ? { status: statusOrPayload }
    : statusOrPayload;

  const response = await axiosInstance.patch(`${BASE_URL}/${id}/status`, payload);
  return response.data;
};

export const assignTechnicianToTicket = async (id, technicianId) => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/assign`, { technicianId });
  return response.data;
};

export const editAdminComment = async (ticketId, commentId, payload) => {
  const response = await axiosInstance.put(`${BASE_URL}/${ticketId}/comments/${commentId}`, payload);
  return response.data;
};

export const deleteAdminComment = async (ticketId, commentId) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${ticketId}/comments/${commentId}`);
  return response.data;
};

export default axiosInstance;
