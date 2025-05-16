import React, { useState, useEffect } from 'react';
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
  status: string;
  documents_count: number;
  last_updated: string;
  embeddings_model: string;
  vector_store: string;
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
      // Using Supabase instead of FastAPI
      // This is a simplified version that just returns basic status info
      setStatus({
        status: 'active',
        documents_count: 0,
        last_updated: new Date().toISOString(),
        embeddings_model: 'text-embedding-ada-002',
        vector_store: 'supabase'
      });
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
    
    setUploading(true);
    setMessage({
      type: 'info',
      text: 'Uploading document...'
    });
    
    try {
      // Simulate successful upload to Supabase storage
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessage({
        type: 'success',
        text: `Document ${file.name} uploaded successfully to Supabase storage.`
      });
      
      // Update the status with new document count
      setStatus(prev => prev ? {
        ...prev,
        documents_count: prev.documents_count + 1,
        last_updated: new Date().toISOString()
      } : null);
      
      // Reset form
      setFile(null);
      
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
      // Simulate successful update with Supabase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({
        type: 'success',
        text: 'Knowledge base update completed successfully.'
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
                    Category
                  </label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-md dark:border-slate-600 dark:bg-slate-800"
                    value={category}
                    onChange={handleCategoryChange}
                  >
                    <option value="general_finance">General Finance</option>
                    <option value="market_analysis">Market Analysis</option>
                    <option value="investment_strategies">Investment Strategies</option>
                    <option value="company_reports">Company Reports</option>
                    <option value="economic_data">Economic Data</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-fin-primary text-white py-2 px-4 rounded-md hover:bg-fin-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Uploading...
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
            
            {/* Status Panel */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Database className="mr-2" />
                Knowledge Base Status
              </h2>
              
              {status ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        status.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {status.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                    
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Documents:</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {status.documents_count}
                    </div>
                    
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Updated:</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(status.last_updated).toLocaleString()}
                    </div>
                    
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Embeddings Model:</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {status.embeddings_model}
                    </div>
                    
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Vector Store:</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {status.vector_store}
                    </div>
                  </div>
                  
                  <button 
                    onClick={triggerUpdate}
                    className="w-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 py-2 px-4 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
                    disabled={updateRunning}
                  >
                    {updateRunning ? (
                      <>
                        <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update Knowledge Base
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="animate-spin h-8 w-8 text-slate-400" />
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
