import React, { useState, useEffect } from 'react';
import { documentApi } from '../../services/fastApiService';
import './DocumentUpload.css';

const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch existing documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fetch documents from the API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentApi.listDocuments();
      setDocuments(response.documents || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again later.');
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  // Handle description change
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setUploadStatus({
        success: false,
        message: 'Please select a file to upload.'
      });
      return;
    }

    try {
      setUploading(true);
      setUploadStatus(null);

      // Upload the file
      const response = await documentApi.uploadDocument(file, description);

      setUploadStatus({
        success: true,
        message: `File "${response.filename}" uploaded successfully!`,
        details: `Document ID: ${response.document_id}, Vectors: ${response.vector_count}`
      });

      // Reset form
      setFile(null);
      setDescription('');
      document.getElementById('file-upload').value = '';

      // Refresh document list
      fetchDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setUploadStatus({
        success: false,
        message: `Upload failed: ${err.message || 'Unknown error'}`
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await documentApi.deleteDocument(documentId);
      setUploadStatus({
        success: true,
        message: `Document "${fileName}" deleted successfully!`
      });
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      setUploadStatus({
        success: false,
        message: `Failed to delete document: ${err.message || 'Unknown error'}`
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="document-upload-container">
      <h2>Document Management</h2>
      <p className="upload-description">
        Upload PDF, CSV, or Excel files to enhance the AI knowledge base. These documents will be used to provide context for AI analysis and FinGenie responses.
      </p>

      {/* Upload Form */}
      <div className="upload-form-container">
        <h3>Upload New Document</h3>
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="file-upload">Select File:</label>
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.csv,.xlsx"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="file-types">Supported formats: PDF, CSV, XLSX</div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional):</label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter a description of the document..."
              disabled={uploading}
            />
          </div>

          <button type="submit" className="upload-button" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.success ? 'success' : 'error'}`}>
            <p>{uploadStatus.message}</p>
            {uploadStatus.details && <p className="status-details">{uploadStatus.details}</p>}
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="document-list-container">
        <h3>Uploaded Documents</h3>
        {loading ? (
          <div className="loading">Loading documents...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : documents.length === 0 ? (
          <div className="no-documents">No documents uploaded yet.</div>
        ) : (
          <table className="document-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Size</th>
                <th>Type</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.filename}>
                  <td>{doc.filename}</td>
                  <td>{formatFileSize(doc.size)}</td>
                  <td>{doc.content_type.split('/')[1]}</td>
                  <td>{formatDate(doc.upload_date)}</td>
                  <td>
                    <span className={`status-badge ${doc.processed ? 'processed' : 'pending'}`}>
                      {doc.processed ? 'Processed' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteDocument(doc.document_id || doc.filename, doc.filename)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Weekly Update Information */}
      <div className="update-info">
        <h3>Knowledge Base Updates</h3>
        <p>
          The knowledge base is automatically updated weekly to process any new documents and refresh the AI's information. 
          This ensures that the AI analysis and FinGenie chatbot have access to the latest information.
        </p>
      </div>
    </div>
  );
};

export default DocumentUpload;
