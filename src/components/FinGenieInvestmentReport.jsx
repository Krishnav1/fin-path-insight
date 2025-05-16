import React, { useState, useEffect } from 'react';
import { useFinGenie } from '../contexts/FinGenieContext';
import ReactMarkdown from 'react-markdown';
import { Box, Button, TextField, Typography, CircularProgress, Paper, Grid, Divider, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const FinGenieInvestmentReport = () => {
  const { reportData, isLoading } = useFinGenie();
  const [ticker, setTicker] = useState('');
  const [query, setQuery] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState(null);
  
  // Use reportData from context if available
  useEffect(() => {
    if (reportData) {
      setReport(reportData.report);
      setStockData(reportData.data);
      setTicker(reportData.ticker);
      setQuery(reportData.query);
      setError('');
    }
  }, [reportData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ticker) {
      setError('Please enter a stock ticker symbol');
      return;
    }
    if (!query) {
      setQuery(`What's the price forecast and market analysis on ${ticker} stock?`);
    }

    setLoading(true);
    setError('');
    setReport('');
    setStockData(null);

    try {
      // Import API configuration
      const API = await import("../config/api").then(module => module.default);
      
      // Call the Deno Deploy API
      const response = await fetch(API.endpoints.getInvestmentReport, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          query: query || `What's the price forecast and market analysis on ${ticker} stock?`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate investment report');
      }

      setReport(data.report);
      setStockData(data.data);
    } catch (err) {
      console.error('Error fetching investment report:', err);
      setError(`Error: ${err.message || 'Failed to generate report. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr: 1 }} />
          Fin Genie Investment Report
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Generate a comprehensive investment report for any stock. Enter a ticker symbol (e.g., AAPL, MSFT.US, RELIANCE.NSE) and optionally a specific question.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Stock Ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                fullWidth
                required
                placeholder="e.g., AAPL, RELIANCE.NSE"
                variant="outlined"
                margin="normal"
                helperText="Include exchange if non-US (e.g., .NSE for India)"
              />
            </Grid>
            <Grid item xs={12} sm={7}>
              <TextField
                label="Your Question (Optional)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
                placeholder="What's the price forecast and market analysis on this stock?"
                variant="outlined"
                margin="normal"
                helperText="Leave blank for a standard analysis"
              />
            </Grid>
            <Grid item xs={12} sm={2} sx={{ mt: { xs: 0, sm: 3 } }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !ticker}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{ height: '56px' }}
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {(loading || isLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Generating your investment report...
          </Typography>
        </Box>
      )}

      {report && !loading && !isLoading && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Analysis for {ticker}
            </Typography>
            {stockData?.realTimePrice?.currentPrice && (
              <Typography variant="h5" color={stockData.realTimePrice.dayChange >= 0 ? 'success.main' : 'error.main'}>
                {stockData.realTimePrice.currentPrice.toFixed(2)} {stockData.realTimePrice.currency || 'USD'} 
                {stockData.realTimePrice.dayChangePercent && (
                  <Typography component="span" variant="h6" color="inherit">
                    {' '}({stockData.realTimePrice.dayChange >= 0 ? '+' : ''}{stockData.realTimePrice.dayChangePercent.toFixed(2)}%)
                  </Typography>
                )}
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ 
            '& img': { maxWidth: '100%' },
            '& table': { borderCollapse: 'collapse', width: '100%' },
            '& th, & td': { border: '1px solid #ddd', padding: '8px', textAlign: 'left' },
            '& th': { backgroundColor: '#f2f2f2' },
            '& h1': { fontSize: '1.8rem', mb: 2, color: 'primary.main' },
            '& h2': { fontSize: '1.4rem', mt: 4, mb: 2, color: 'secondary.main' },
          }}>
            <ReactMarkdown>{report}</ReactMarkdown>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default FinGenieInvestmentReport;
