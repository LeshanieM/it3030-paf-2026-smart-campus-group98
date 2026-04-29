import api from '../../../services/api';

export const getAttachmentName = (attachment) => {
  if (!attachment) return 'Attachment';
  return attachment.fileName || attachment.name || attachment.originalFilename || 'Attachment';
};

const createBlobUrl = (response) => {
  const blob = response?.data instanceof Blob
    ? response.data
    : new Blob([response?.data], { type: response?.headers?.['content-type'] || 'application/octet-stream' });

  return URL.createObjectURL(blob);
};

export const getViewerUrl = (attachment) => {
  if (!attachment?.viewUrl) return null;
  const name = getAttachmentName(attachment);
  const type = attachment.contentType || 'application/octet-stream';
  
  const params = new URLSearchParams();
  params.set('url', attachment.viewUrl);
  params.set('name', name);
  params.set('type', type);
  
  return `/maintenance/attachment-viewer?${params.toString()}`;
};

export const viewAttachment = async (attachment) => {
  const viewerUrl = getViewerUrl(attachment);
  if (!viewerUrl) {
    throw new Error('This attachment is not available for preview.');
  }

  const previewWindow = window.open(viewerUrl, '_blank');
  
  if (!previewWindow) {
    throw new Error('Popup blocked. Please allow popups to view the attachment.');
  }
};

export const downloadAttachment = async (attachment) => {
  if (!attachment?.downloadUrl) {
    throw new Error('This attachment is not available for download.');
  }

  const response = await api.get(attachment.downloadUrl, { responseType: 'blob' });
  const blobUrl = createBlobUrl(response);
  const link = document.createElement('a');

  link.href = blobUrl;
  link.download = getAttachmentName(attachment);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 5_000);
};
