# FinPath Insight Deployment Checklist

This document provides a comprehensive checklist for deploying the FinPath Insight application to production.

## Pre-Deployment Checks

### Environment Variables
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly
- [ ] `FMP_API_KEY` is valid and has sufficient quota
- [ ] `NEWS_API_KEY` is valid and has sufficient quota
- [ ] `GEMINI_API_KEY` and `PINECONE_API_KEY` are set if using AI features
- [ ] `SUPABASE_TTL_CACHE` is set to an appropriate value (e.g., 3600 seconds)
- [ ] `PORT` is set to the correct value for your environment
- [ ] `NODE_ENV` is set to "production"

### Database
- [ ] Run `python -m app.scripts.update_database` to create required tables
- [ ] Verify all tables exist in Supabase: `market_overview`, `stocks`, `news`, `cache`
- [ ] Check that sample data is populated if needed

### API Testing
- [ ] Run `python test_api.py` to verify all endpoints are working
- [ ] Test health check endpoints: `/api/health`, `/api/health/ready`, `/api/health/live`
- [ ] Test market data endpoints with Postman collection
- [ ] Test Supabase data endpoints with Postman collection
- [ ] Test news endpoints with Postman collection
- [ ] Test analysis endpoints with Postman collection
- [ ] Test AI endpoints with Postman collection

### Code Quality
- [ ] All API endpoints have proper error handling
- [ ] Request validation is implemented for all POST endpoints
- [ ] Timeout middleware is configured correctly
- [ ] Caching is implemented for expensive operations
- [ ] Rate limiting is implemented for external API calls

## Deployment Steps

### Backend (Render)
1. [ ] Push all changes to GitHub repository
2. [ ] Connect repository to Render
3. [ ] Create a new Web Service using the `render.yaml` configuration
4. [ ] Set all required environment variables in Render dashboard
5. [ ] Configure health check path: `/api/health/live`
6. [ ] Set appropriate scaling options
7. [ ] Deploy and monitor build logs for errors

### Frontend (Netlify)
1. [ ] Update API endpoint in frontend code to point to production backend
2. [ ] Build and test frontend locally
3. [ ] Push changes to GitHub repository
4. [ ] Connect repository to Netlify
5. [ ] Configure build settings as specified in `render.yaml`
6. [ ] Set environment variables in Netlify dashboard
7. [ ] Deploy and verify frontend is working

## Post-Deployment Verification

### API Health
- [ ] Verify health check endpoints are returning 200 OK
- [ ] Check Supabase connection is working
- [ ] Verify cache table exists and is functioning

### Performance
- [ ] Monitor response times for all endpoints
- [ ] Check for any timeout issues
- [ ] Verify caching is working correctly
- [ ] Test under load if possible

### Error Handling
- [ ] Verify 404 errors are handled gracefully
- [ ] Check 422 validation errors return proper messages
- [ ] Test rate limiting by making rapid requests
- [ ] Verify 500 errors are logged properly

### Data Integrity
- [ ] Verify market data is being updated correctly
- [ ] Check that news data is current
- [ ] Ensure stock data is accurate
- [ ] Verify analysis endpoints return meaningful results

## Monitoring and Maintenance

### Scheduled Tasks
- [ ] Set up cron job for regular data updates
- [ ] Configure alerts for failed jobs
- [ ] Implement monitoring for API health

### Logging
- [ ] Set up centralized logging
- [ ] Configure alerts for critical errors
- [ ] Monitor rate limit warnings

### Backup
- [ ] Set up regular database backups
- [ ] Test restore procedure
- [ ] Document backup and restore process

## Security
- [ ] Ensure all API keys are stored securely
- [ ] Verify CORS settings are appropriate
- [ ] Check for any exposed sensitive information
- [ ] Review Supabase security settings

## Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [ ] Update README with latest information

## Rollback Plan
- [ ] Document rollback procedure
- [ ] Identify rollback triggers
- [ ] Test rollback process if possible
