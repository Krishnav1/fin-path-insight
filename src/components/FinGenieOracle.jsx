import React, { useState, useEffect, useContext } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Paper, Divider } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { useFinGenie } from '../contexts/FinGenieContext';

const FinGenieOracle = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Using the FinGenieContext properly

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Import API configuration
      const API = await import("../config/api").then(module => module.default);
      
      // Call the Deno Deploy API
      const response = await fetch(API.endpoints.finGenieOracle, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Set the response data
      setResponse(data);
    } catch (err) {
      console.error('Error fetching response:', err);
      setError(err.message || 'Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Fin Genie Oracle
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Ask any financial question - from stock analysis to market trends, definitions, and more.
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Your financial query"
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="E.g., 'What's the current state of AAPL stock?' or 'Explain P/E ratio'"
          multiline
          rows={2}
          disabled={loading}
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          disabled={loading || !query.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Ask Fin Genie'}
        </Button>
      </Box>
      
      {error && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: '#FFEBEE' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}
      
      {response && !loading && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Fin Genie's Analysis
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ 
            '& a': { color: 'primary.main' },
            '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
            '& th, & td': { border: '1px solid #ddd', p: 1 },
            '& th': { bgcolor: '#f5f5f5' }
          }}>
            <ReactMarkdown>{response.answer}</ReactMarkdown>
          </Box>
          
          {response.dataFetched && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Data sources: yfinance and/or EODHD API
            </Typography>
          )}
          
          {response.dataErrors && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Note: Some data could not be retrieved. Fin Genie has provided the best analysis with available information.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FinGenieOracle;
