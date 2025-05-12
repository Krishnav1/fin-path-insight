import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, 
  FileUp, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Database
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import '../styles/AdminPanel.css';

interface KnowledgeBaseStatus {
  success: boolean;
  pendingFiles: number;
  lastUpdate: {
    total: number;
    processed: number;
    failed: number;
    details: Array<{
      file: string;
      success: boolean;
      documentId?: string;
      chunks?: number;
      error?: string;
    }>;
  } | null;
}

const AdminPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('general_finance');
  const [uploading, setUploading] = useState<boolean>(false);
  const [updateRunning, setUpdateRunning] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [status, setStatus] = useState<KnowledgeBaseStatus | null>(null);

  // Fetch knowledge base status on component mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Handle category selection
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  // Fetch knowledge base status
  const fetchStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3003/api/knowledge-base/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching knowledge base status:', error);
      setMessage({
        type: 'error',
        text: 'Failed to fetch knowledge base status'
      });
    }
  };

  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setMessage({
        type: 'error',
        text: 'Please select a file to upload'
      });
      return;
    }
    
    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'pdf' && fileType !== 'csv') {
      setMessage({
        type: 'error',
        text: 'Only PDF and CSV files are supported'
      });
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', category);
    
    setUploading(true);
    setMessage({
      type: 'info',
      text: 'Uploading and processing document...'
    });
    
    try {
      const response = await axios.post('http://localhost:3003/api/knowledge-base/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage({
        type: 'success',
        text: `Document uploaded and processed successfully. Created ${response.data.chunks} chunks.`
      });
      
      // Reset form
      setFile(null);
      
      // Refresh status
      fetchStatus();
    } catch (error) {
      console.error('Error uploading document:', error);
      setMessage({
        type: 'error',
        text: 'Failed to upload document. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Trigger knowledge base update
  const triggerUpdate = async () => {
    setUpdateRunning(true);
    setMessage({
      type: 'info',
      text: 'Running knowledge base update...'
    });
    
    try {
      const response = await axios.post('http://localhost:3003/api/knowledge-base/update');
      
      setMessage({
        type: 'success',
        text: `Knowledge base update completed. Processed ${response.data.result.processed} files.`
      });
      
      // Refresh status
      fetchStatus();
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update knowledge base. Please try again.'
      });
    } finally {
      setUpdateRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-fin-primary mb-6 flex items-center">
            <Database className="mr-2" />
            FinGenie Knowledge Base Admin
          </h1>
          
          {message && (
            <div className={`mb-6 p-4 rounded-md flex items-start ${
              message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              message.type === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {message.type === 'success' ? <CheckCircle className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0" /> :
               message.type === 'error' ? <AlertCircle className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0" /> :
               <FileText className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upload Form */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="mr-2" />
                Upload Document
              </h2>
              
              <form onSubmit={handleUpload}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document (PDF or CSV)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileUp className="w-8 h-8 mb-3 text-slate-500 dark:text-slate-400" />
                        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          PDF or CSV (MAX. 10MB)
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange}
                        accept=".pdf,.csv"
                      />
                    </label>
                  </div>
                  {file && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document Category
                  </label>
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-fin-primary focus:border-fin-primary dark:bg-slate-700 dark:text-slate-200"
                  >
                    <option value="general_finance">General Finance</option>
                    <option value="market_report">Market Report</option>
                    <option value="financial_news">Financial News</option>
                    <option value="stock_data">Stock Data</option>
                    <option value="economic_indicator">Economic Indicator</option>
                    <option value="company_financial">Company Financial</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full bg-fin-primary hover:bg-fin-primary/90 text-white font-medium py-2 px-4 rounded-md disabled:bg-fin-primary/50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* Knowledge Base Status */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Database className="mr-2" />
                  Knowledge Base Status
                </h2>
                <button
                  onClick={fetchStatus}
                  className="text-fin-primary hover:text-fin-primary/80 p-1"
                  title="Refresh Status"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
              
              {status ? (
                <div className="space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Pending Documents</h3>
                    <p className="text-2xl font-bold text-fin-primary">
                      {status.pendingFiles}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Documents waiting to be processed
                    </p>
                  </div>
                  
                  {status.lastUpdate && (
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-md">
                      <h3 className="font-medium mb-2">Last Update</h3>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <p className="text-xl font-bold text-fin-primary">
                            {status.lastUpdate.total}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Total
                          </p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {status.lastUpdate.processed}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Processed
                          </p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-red-600 dark:text-red-400">
                            {status.lastUpdate.failed}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Failed
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={triggerUpdate}
                    disabled={updateRunning || status.pendingFiles === 0}
                    className="w-full bg-fin-teal hover:bg-fin-teal/90 text-white font-medium py-2 px-4 rounded-md disabled:bg-fin-teal/50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {updateRunning ? (
                      <>
                        <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Run Knowledge Base Update
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="animate-spin h-8 w-8 text-fin-primary" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminPanel;
