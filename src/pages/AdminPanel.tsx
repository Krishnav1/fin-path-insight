import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileUp, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Database,
  Building2,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  Table
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import '../styles/AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { companyService } from '@/services/company-service';
import { callEdgeFunction } from '@/lib/edge-function-client';
import { API_ENDPOINTS } from '@/config/api-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Button, Input } from 'antd';
import { DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { TableHeader } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { TableRow, TableHead, TableBody, TableCell } from '@mui/material';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { Label } from '@/components/ui/label';

interface KnowledgeBaseStatus {
  status: string;
  documents_count: number;
  last_updated: string;
  embeddings_model: string;
  vector_store: string;
}

interface CompanyData {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector?: string;
  industry?: string;
  description?: string;
  business_model?: string;
  industry_context?: string;
  is_tracked: boolean;
  updated_at: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('knowledge-base');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminChecked, setAdminChecked] = useState<boolean>(false);
  const [checkingPermissions, setCheckingPermissions] = useState<boolean>(true); // Add loading state for permissions check
  
  // Knowledge Base states
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('general_finance');
  const [uploading, setUploading] = useState<boolean>(false);
  const [updateRunning, setUpdateRunning] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [status, setStatus] = useState<KnowledgeBaseStatus | null>(null);
  
  // Company Tracker states
  const [trackedCompanies, setTrackedCompanies] = useState<CompanyData[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);
  const [updatingCompany, setUpdatingCompany] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState({
    symbol: "",
    exchange: "",
    country: "",
  });
  const [editCompany, setEditCompany] = useState<CompanyData | null>(null);
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);

  // Check if user is admin and fetch initial data
  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('AdminPanel: Checking admin status for user:', user);
      if (user) {
        try {
          setCheckingPermissions(true);
          
          // IMPORTANT: Force admin to true for this specific user to bypass RLS issues
          if (user.email === 'kvarma00011@gmail.com') {
            console.log('Setting admin status directly for known admin user');
            setIsAdmin(true);
            setCheckingPermissions(false);
            setAdminChecked(true);
            
            // Fetch initial data for admin
            try {
              fetchStatus();
              fetchTrackedCompanies();
            } catch (e) {
              console.error('Error fetching initial data:', e);
            }
            return;
          }
          
          console.log('Querying admin_users table with ID:', user.id);
          const { data, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', user.id)
            .single();

          console.log('Admin query result:', { data, error });

          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            setCheckingPermissions(false);
            setAdminChecked(true);
            return;
          }

          const hasAdminRole = data?.role === 'admin';
          setIsAdmin(hasAdminRole);
          setCheckingPermissions(false);
          setAdminChecked(true);

          if (!hasAdminRole) {
            setMessage({
              type: 'error',
              text: 'You do not have admin access.'
            });
          } else {
            // Fetch initial data for admin
            fetchStatus();
            fetchTrackedCompanies();
          }      
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setCheckingPermissions(false);
          setAdminChecked(true);
        } finally {
          // Always set admin checked to true
          setAdminChecked(true);
        }
      } else if (adminChecked) {
        // If user is not logged in and we've already checked, redirect to login
        navigate('/login');
      }
    };
    
    checkAdminStatus();
  }, [user, navigate]);

  // Set checking permissions to false when admin check is complete
  useEffect(() => {
    if (adminChecked) {
      console.log('Admin check complete, hiding loading state');
      // Force a small delay to ensure state updates properly
      setTimeout(() => {
        setCheckingPermissions(false);
      }, 500);
    }
  }, [adminChecked]);

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
        embeddings_model: 'openai-text-embedding-ada-002',
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
        text: 'Only PDF and CSV files are allowed'
      });
      return;
    }
    
    setUploading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.storage.from('knowledge_base').upload(`documents/${file.name}`, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      setMessage({
        type: 'success',
        text: `Document ${File.name} uploaded successfully to Supabase storage.`
      });
      
      // Update the status with new document count
      setStatus((prev) => prev ? {
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
  // Get the current session access token for authorization
  const { data } = await supabase.auth.getSession();
  const accessToken = data?.session?.access_token;

    setUpdateRunning(true);
    setMessage({
      type: 'info',
      text: 'Running knowledge base update...'
    });
    
    try {
      // Make a real API call to update the knowledge base using centralized client
      const { data, error } = await callEdgeFunction(
        API_ENDPOINTS.FINGENIE_ORACLE,
        'POST',
        { query: 'update knowledge base', userId: user?.id || 'admin' }
      );
      
      if (error) {
        throw new Error(`API error: ${error.message}`);
      }
      
      const result = data;
      console.log('Knowledge base update result:', result);
      
      setMessage({
        type: 'success',
        text: result.message || 'Knowledge base update completed successfully.'
      });
      
      // Refresh status with actual data
      const newStatus = {
        status: 'active',
        documents_count: result.documents_count || 0,
        last_updated: new Date().toISOString(),
        embeddings_model: result.model || 'text-embedding-ada-002',
        vector_store: 'supabase'
      };
      
      setStatus(newStatus);
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      setMessage({
        type: 'error',
        text: `Failed to update knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setUpdateRunning(false);
    }
  };

  // Fetch tracked companies from Supabase
  const fetchTrackedCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companies = await companyService.getTrackedCompanies();
      setTrackedCompanies(companies);
    } catch (error) {
      console.error("Error fetching tracked companies:", error);
      setMessage({
        type: 'error',
        text: "Failed to fetch tracked companies"
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Add a new company to track
  const addCompany = async () => {
    try {
      if (!newCompany.symbol || !newCompany.exchange) {
        setMessage({
          type: 'error',
          text: "Symbol and exchange are required"
        });
        return;
      }

      setUpdatingCompany("add");
      await companyService.trackCompany(
        newCompany.symbol,
        newCompany.exchange,
        newCompany.country || "US"
      );

      setMessage({
        type: 'success',
        text: `${newCompany.symbol} added to tracked companies`
      });

      // Reset form and refresh list
      setNewCompany({ symbol: "", exchange: "", country: "" });
      fetchTrackedCompanies();
    } catch (error) {
      console.error("Error adding company:", error);
      setMessage({
        type: 'error',
        text: "Failed to add company"
      });
    } finally {
      setUpdatingCompany(null);
    }
  };

  // Update company business model and industry context
  const updateCompanyDetails = async () => {
    try {
      if (!editCompany || !editCompany.symbol) {
        return;
      }

      setUpdatingCompany("edit");
      await companyService.updateCompanyDetails(
        editCompany.symbol,
        editCompany.business_model,
        editCompany.industry_context
      );

      setMessage({
        type: 'success',
        text: `${editCompany.symbol} details updated`
      });

      setShowEditDialog(false);
      fetchTrackedCompanies();
    } catch (error) {
      console.error("Error updating company:", error);
      setMessage({
        type: 'error',
        text: "Failed to update company details"
      });
    } finally {
      setUpdatingCompany(null);
    }
  };

  // Refresh company data
  const refreshCompanyData = async (symbol: string) => {
    try {
      setUpdatingCompany(`refresh-${symbol}`);
      setMessage({
        type: 'info',
        text: `Refreshing data for ${symbol}...`
      });
      
      // Use centralized edge function client
      const { data, error } = await callEdgeFunction(
        `${API_ENDPOINTS.REFRESH_COMPANY_DATA}?symbol=${symbol}&force=true`,
        'POST'
      );
      
      if (error) {
        throw new Error(`Failed to refresh data: ${error.message}`);
      }
      
      const result = data;
      console.log('Refresh result:', result);
      
      setMessage({
        type: 'success',
        text: `Data for ${symbol} refreshed successfully`
      });
      
      // Refresh the list to show updated timestamps
      fetchTrackedCompanies();
    } catch (error) {
      console.error("Error refreshing company data:", error);
      setMessage({
        type: 'error',
        text: `Failed to refresh data for ${symbol}`
      });
    } finally {
      setUpdatingCompany(null);
    }
  };

  // Stop tracking a company
  const removeCompany = async (symbol: string) => {
    try {
      setUpdatingCompany(symbol);
      await companyService.untrackCompany(symbol);

      setMessage({
        type: 'success',
        text: `${symbol} removed from tracked companies`
      });

      fetchTrackedCompanies();
    } catch (error) {
      console.error("Error removing company:", error);
      setMessage({
        type: 'error',
        text: "Failed to remove company"
      });
    } finally {
      setUpdatingCompany(null);
    }
  };

  // Trigger a data update for a company
  const updateCompanyData = async (symbol: string) => {
    try {
      setUpdatingCompany(symbol);
      await companyService.triggerCompanyDataUpdate(symbol);

      setMessage({
        type: 'success',
        text: `Data update triggered for ${symbol}`
      });
    } catch (error) {
      console.error("Error updating company data:", error);
      setMessage({
        type: 'error',
        text: "Failed to update company data"
      });
    } finally {
      setUpdatingCompany(null);
    }
  };
  
  console.log('Render state:', { setCheckingPermissions, isAdmin, adminChecked });
  
  // If still checking admin status or not an admin, show loading or unauthorized message
  if (checkingPermissions) {
    return (
      <div className="admin-panel">
        <Header />
        
        <div className="checking-permissions">
          <div className="spinner"></div>
          <p>Checking permissions...</p>
        </div>
        
        <Footer />
      </div>
    );
  }
  
  if (!isAdmin && adminChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 max-w-md">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-slate-600 dark:text-slate-400">You do not have permission to access the admin panel.</p>
              <p className="text-slate-600 dark:text-slate-400">Redirecting to home page...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-fin-primary mb-6 flex items-center">
            <Database className="mr-2" />
            FinPath Admin Panel
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
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="knowledge-base" className="flex items-center">
                <Database className="mr-2 h-4 w-4" />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="company-tracker" className="flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                Company Tracker
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="knowledge-base" className="space-y-4">
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
            </TabsContent>
            
            <TabsContent value="company-tracker" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Company Tracker
                </h2>
                <div className="flex gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mr-2 flex items-center">
                    <Database className="h-3 w-3 mr-1" />
                    {trackedCompanies.length} companies tracked
                  </div>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={fetchTrackedCompanies}
                    disabled={loadingCompanies}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${loadingCompanies ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button size="small">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Company
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Company to Track</DialogTitle>
                        <DialogDescription>
                          Enter the details of the company you want to track
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="symbol" className="text-right">
                            Symbol
                          </Label>
                          <Input
                            id="symbol"
                            placeholder="AAPL"
                            className="col-span-3"
                            value={newCompany.symbol}
                            onChange={(e) =>
                              setNewCompany({
                                ...newCompany,
                                symbol: e.target.value.toUpperCase(),
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="exchange" className="text-right">
                            Exchange
                          </Label>
                          <Select
                            value={newCompany.exchange}
                            onValueChange={(value) =>
                              setNewCompany({ ...newCompany, exchange: value })
                            }
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select Exchange" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">US (NYSE/NASDAQ)</SelectItem>
                              <SelectItem value="NSE">NSE (India)</SelectItem>
                              <SelectItem value="BSE">BSE (India)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="country" className="text-right">
                            Country
                          </Label>
                          <Select
                            value={newCompany.country}
                            onValueChange={(value) =>
                              setNewCompany({ ...newCompany, country: value })
                            }
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="IN">India</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outlined"
                          onClick={() => setShowAddDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={addCompany} disabled={updatingCompany === "add"}>
                          {updatingCompany === "add" ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Company"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {loadingCompanies ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-fin-primary" />
                </div>
              ) : trackedCompanies.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-md">
                  <Building2 className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                  <p>No companies are currently being tracked</p>
                  <p className="text-sm mt-2">Add companies to track their fundamental data</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Exchange</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackedCompanies.map((company) => (
                        <TableRow key={company.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="font-medium">
                            {company.symbol}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{company.name}</div>
                            {company.industry && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{company.industry}</div>
                            )}
                          </TableCell>
                          <TableCell>{company.exchange}</TableCell>
                          <TableCell>
                            {company.sector ? (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-400/20">
                                {company.sector}
                              </span>
                            ) : "N/A"}
                          </TableCell>
                          <TableCell>{company.country}</TableCell>
                          <TableCell>
                            {company.updated_at ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(company.updated_at).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {new Date(company.updated_at).toLocaleTimeString()}
                                </span>
                              </div>
                            ) : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outlined"
                                ghost
                                size="small"
                                onClick={() => refreshCompanyData(company.symbol)}
                                disabled={updatingCompany === `refresh-${company.symbol}`}
                                title="Refresh company data from API"
                              >
                                {updatingCompany === `refresh-${company.symbol}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                                <span className="sr-only">Refresh data</span>
                              </Button>
                              <Button
                                variant="outlined"
                                ghost
                                size="small"
                                onClick={() => {
                                  setEditCompany(company);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="outlined"
                                ghost
                                size="small"
                                onClick={() => removeCompany(company.symbol)}
                                disabled={updatingCompany === company.symbol}
                              >
                                {updatingCompany === company.symbol ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                                <span className="sr-only">Remove</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Edit Company Dialog */}
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      Edit Company Details: {editCompany?.symbol}
                    </DialogTitle>
                    <DialogDescription>
                      Update the manually curated information about this company
                    </DialogDescription>
                  </DialogHeader>
                  {editCompany && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="business_model">Business Model</Label>
                        <Textarea
                          id="business_model"
                          placeholder="Describe the company's business model..."
                          rows={4}
                          value={editCompany.business_model || ""}
                          onChange={(e) =>
                            setEditCompany({
                              ...editCompany,
                              business_model: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="industry_context">Industry Context</Label>
                        <Textarea
                          id="industry_context"
                          placeholder="Provide context about the industry..."
                          rows={4}
                          value={editCompany.industry_context || ""}
                          onChange={(e) =>
                            setEditCompany({
                              ...editCompany,
                              industry_context: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outlined"
                      onClick={() => setShowEditDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={updateCompanyDetails}
                      disabled={updatingCompany === "edit"}
                    >
                      {updatingCompany === "edit" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminPanel;



function checkAdminStatus() {
  throw new Error('Function not implemented.');
}

function setCheckingPermissions(arg0: boolean) {
  throw new Error('Function not implemented.');
}

function setFile(arg0: File) {
  throw new Error('Function not implemented.');
}

function setCategory(value: string) {
  throw new Error('Function not implemented.');
}

function setMessage(arg0: { type: string; text: string; }) {
  throw new Error('Function not implemented.');
}

function setUploading(arg0: boolean) {
  throw new Error('Function not implemented.');
}

function setStatus(arg0: (prev: { documents_count: number; }) => { documents_count: number; last_updated: string; } | null) {
  throw new Error('Function not implemented.');
}

function setUpdateRunning(arg0: boolean) {
  throw new Error('Function not implemented.');
}

function setLoadingCompanies(arg0: boolean) {
  throw new Error('Function not implemented.');
}

function setUpdatingCompany(arg0: string) {
  throw new Error('Function not implemented.');
}

function setNewCompany(arg0: { symbol: string; exchange: string; country: string; }) {
  throw new Error('Function not implemented.');
}

function setShowEditDialog(arg0: boolean) {
  throw new Error('Function not implemented.');
}

