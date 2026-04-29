import React, { useState, useEffect } from 'react';
import { facilityApi } from '../api/facilityApi';
import ResourceCard from '../components/ResourceCard';
import ResourceForm from '../components/ResourceForm';
import ResourceDetailModal from '../components/ResourceDetailModal';
import { Settings, Plus } from 'lucide-react';
import Layout from '../../../components/Layout';

const AdminFacilityPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatusIds, setUpdatingStatusIds] = useState([]);
  const [savingForm, setSavingForm] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formError, setFormError] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);

  const getStatusCode = (err) => err?.response?.status;

  const getErrorMessageForStatus = (status, fallback) => {
    switch (status) {
      case 400:
        return 'Invalid data. Please check the form fields and try again.';
      case 401:
        return 'You are not signed in. Please sign in again and retry.';
      case 403:
        return 'Access denied. Your account does not have permission to perform this action.';
      case 404:
        return 'Not found. The selected facility may have been removed.';
      case 409:
        return 'Conflict detected. This facility may already exist or was changed by someone else.';
      case 422:
        return 'Validation failed. Please review the provided information.';
      case 500:
        return 'Server error. Please try again in a moment.';
      default:
        return fallback;
    }
  };

  const loadResources = async () => {
    if (resources.length > 0) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await facilityApi.getAdminResources();
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load resources', error);
      const status = getStatusCode(error);
      setError(
        getErrorMessageForStatus(
          status,
          'Failed to fetch administrative data. Please check your connection.',
        ),
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleSave = async (data) => {
    setFormError(null);
    setError(null);
    setSavingForm(true);
    try {
      if (editingResource) {
        const res = await facilityApi.updateResource(editingResource.id, data);
        const updatedResource = res.data;
        // Update edited card immediately instead of reloading whole list.
        setResources((prev) =>
          prev.map((item) =>
            item.id === editingResource.id ? { ...item, ...updatedResource } : item,
          ),
        );
        setSuccessMessage('Facility successfully updated.');
      } else {
        const res = await facilityApi.createResource(data);
        const createdResource = res.data;
        // Insert new resource immediately for faster UI feedback.
        setResources((prev) => [createdResource, ...prev]);
        setSuccessMessage('Facility successfully created.');
      }
      setIsFormOpen(false);
      setEditingResource(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save resource', error);
      const status = getStatusCode(error);
      setFormError(
        getErrorMessageForStatus(
          status,
          'Failed to save the facility. Please verify the information and try again.',
        ),
      );
    } finally {
      setSavingForm(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      const previous = resources;
      setResources((prev) => prev.filter((item) => item.id !== id));
      try {
        await facilityApi.deleteResource(id);
        setSuccessMessage('Facility successfully deleted.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Failed to delete', error);
        setResources(previous);
        const status = getStatusCode(error);
        setError(
          getErrorMessageForStatus(
            status,
            'Failed to delete the selected facility.',
          ),
        );
      }
    }
  };

  const handleStatusToggle = async (resource) => {
    const newStatus =
      resource.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    const previousStatus = resource.status;
    const id = resource.id;

    setError(null);
    setUpdatingStatusIds((prev) => [...prev, id]);
    // Optimistic update: reflect status change immediately.
    setResources((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item,
      ),
    );

    try {
      await facilityApi.updateResourceStatus(id, newStatus);
      setSuccessMessage(
        `Facility status updated to ${newStatus.replace('_', ' ')}.`,
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update status', error);
      // Rollback optimistic update if backend request failed.
      setResources((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: previousStatus } : item,
        ),
      );
      const status = getStatusCode(error);
      setError(
        getErrorMessageForStatus(status, 'Failed to update facility status.'),
      );
    } finally {
      setUpdatingStatusIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const openCreateForm = () => {
    setEditingResource(null);
    setIsFormOpen(true);
  };

  const openEditForm = (resource) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#4169E1]/10 flex items-center justify-center text-[#4169E1]">
                <Settings size={24} className="stroke-[2.5]" />
              </div>
              Manage Facilities
            </h1>
            <p className="text-slate-500 mt-2 ml-16 font-medium">
              Administration panel for campus resources and facilities.
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-[#4169E1] text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-[#4169E1]/30 hover:bg-blue-700 hover:shadow-[#4169E1]/40 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            Add New Facility
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold animate-fade-in shadow-sm flex items-center">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl font-bold flex justify-between items-center shadow-sm animate-fade-in">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
        {isRefreshing && resources.length > 0 && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
            Refreshing facilities...
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4169E1]"></div>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Settings size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">
              No facilities configured.
            </h3>
            <p className="text-slate-500 mt-2 font-medium">
              Click the Add New Facility button to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isAdmin={true}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onStatusToggle={handleStatusToggle}
                statusUpdating={updatingStatusIds.includes(resource.id)}
                onViewDetails={(res) => setSelectedResource(res)}
              />
            ))}
          </div>
        )}

        {isFormOpen && (
          <ResourceForm
            initialData={editingResource}
            onSave={handleSave}
            onClose={() => setIsFormOpen(false)}
            error={formError}
            saving={savingForm}
          />
        )}

        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      </div>
    </Layout>
  );
};

export default AdminFacilityPage;
