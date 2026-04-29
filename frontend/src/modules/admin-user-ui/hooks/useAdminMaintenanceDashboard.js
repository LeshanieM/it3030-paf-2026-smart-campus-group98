import { useState, useEffect } from 'react';
import { getAllTickets, updateTicketStatus, assignTechnicianToTicket, editAdminComment, deleteAdminComment } from '../api/adminMaintenanceApi';
import api from '../../../services/api';

export const useAdminMaintenanceDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadTechnicians = async () => {
        try {
            const response = await api.get('/admin/users');
            if (Array.isArray(response.data)) {
                setTechnicians(response.data.filter(u => u.role === 'TECHNICIAN'));
            }
        } catch (err) {
            console.error('Failed to load technicians', err);
        }
    };

    const loadTickets = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllTickets();
            setTickets(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.response?.status === 403 
                ? 'Access Denied: You do not have top-level Admin permissions.'
                : 'Failed to fetch facility incidents right now.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
        loadTechnicians();
    }, []);

    const changeStatus = async (ticketId, statusPayload) => {
        try {
            const updated = await updateTicketStatus(ticketId, statusPayload);
            setTickets(current => current.map(t => t.id === ticketId ? { ...t, ...updated } : t));
            return updated;
        } catch (err) {
            console.error('Failed to update ticket status', err);
            alert(err?.response?.data?.message || 'Failed to update ticket. Check your connection.');
            return null;
        }
    };

    const assignTicket = async (ticketId, technicianId) => {
        try {
            const updated = await assignTechnicianToTicket(ticketId, technicianId);
            setTickets(current => current.map(t => t.id === ticketId ? { ...t, ...updated } : t));
        } catch (err) {
            console.error('Failed to assign technician', err);
            alert('Failed to assign technician.');
        }
    };

    const addComment = async (ticketId, commentPayload) => {
        try {
            const response = await api.post(`/admin/tickets/${ticketId}/comments`, commentPayload);
            setTickets(current => current.map(t => t.id === ticketId ? { ...t, ...response.data } : t));
            return response.data;
        } catch (err) {
            console.error('Failed to add admin comment', err);
            alert(err?.response?.data?.message || 'Failed to add comment.');
            return null;
        }
    };

    const editComment = async (ticketId, commentId, commentPayload) => {
        try {
            const updated = await editAdminComment(ticketId, commentId, commentPayload);
            setTickets(current => current.map(t => t.id === ticketId ? { ...t, ...updated } : t));
            return updated;
        } catch (err) {
            console.error('Failed to edit admin comment', err);
            alert(err?.response?.data?.message || 'Failed to edit comment.');
            return null;
        }
    };

    const deleteComment = async (ticketId, commentId) => {
        try {
            const updated = await deleteAdminComment(ticketId, commentId);
            setTickets(current => current.map(t => t.id === ticketId ? { ...t, ...updated } : t));
            return updated;
        } catch (err) {
            console.error('Failed to delete admin comment', err);
            alert(err?.response?.data?.message || 'Failed to delete comment.');
            return null;
        }
    };

    return {
        tickets,
        technicians,
        isLoading,
        error,
        changeStatus,
        assignTicket,
        addComment,
        editComment,
        deleteComment,
        refreshTickets: loadTickets
    };
};
