# Migration Checklist: Unified Admin Backend

## Current State Analysis

### Existing Workers (From Chat History)
Based on our conversation, these are the current worker implementations that need to be consolidated:

1. **Event Listing Worker** - Handles event scraping and API endpoints
2. **Gallery/Flyer Upload Worker** - Manages flyer uploads and batch processing  
3. **Newsletter/Blog Worker** - Manages blog posts and newsletter integration
4. **Static Site Worker** - Serves the main frontend (stays separate)

### New Features to Add
1. **Menu Management** - Food and drinks menu editing
2. **Operating Hours** - Business hours management
3. **Howdy Thrift SPA** - Separate application with admin panel

## Migration Steps

### Phase 1: Repository Setup ✓ (To Do)
- [ ] Initialize `fwhyadmin` repository locally
- [ ] Set up basic Cloudflare Worker structure
- [ ] Configure `wrangler.toml` for multiple environments
- [ ] Set up package.json with required dependencies
- [ ] Create basic directory structure

### Phase 2: Core Infrastructure ✓ (To Do)
- [ ] Implement CORS middleware
- [ ] Set up authentication system (JWT-based)
- [ ] Create standard API response utilities
- [ ] Set up input validation helpers
- [ ] Configure environment variables

### Phase 3: Event Management Migration ✓ (To Do)
- [ ] Extract event scraping logic from current worker
- [ ] Implement event CRUD operations
- [ ] Add event deduplication logic
- [ ] Create public event listing endpoints
- [ ] Test compatibility with existing frontend calls

### Phase 4: Flyer Management Migration ✓ (To Do)
- [ ] Extract flyer upload logic from current worker
- [ ] Implement single file upload endpoint
- [ ] Add batch upload functionality (simplified version)
- [ ] Create flyer management admin interface
- [ ] Test with existing batch upload page

### Phase 5: Newsletter/Blog Migration ✓ (To Do)
- [ ] Extract blog post management from current worker
- [ ] Implement post CRUD operations
- [ ] Maintain Kit/ConvertKit integration
- [ ] Create blog admin interface
- [ ] Test with existing newsletter iframe

### Phase 6: New Features Implementation ✓ (To Do)
- [ ] Design menu data structure (food & drinks)
- [ ] Implement menu management endpoints
- [ ] Create menu editing admin interface
- [ ] Design operating hours data structure
- [ ] Implement hours management endpoints
- [ ] Create hours editing admin interface

### Phase 7: Admin Dashboard ✓ (To Do)
- [ ] Create unified admin dashboard SPA
- [ ] Implement admin authentication UI
- [ ] Build event management interface
- [ ] Build flyer management interface
- [ ] Build blog management interface
- [ ] Build menu management interface
- [ ] Build hours management interface

### Phase 8: Howdy Thrift SPA ✓ (To Do)
- [ ] Design Howdy Thrift application architecture
- [ ] Create thrift-specific data models
- [ ] Build public thrift SPA
- [ ] Create thrift admin panel
- [ ] Set up thrift subdomain routing

### Phase 9: Testing & Integration ✓ (To Do)
- [ ] Test all API endpoints
- [ ] Verify CORS configuration for dev/prod domains
- [ ] Test admin dashboard functionality
- [ ] Verify existing frontend integration still works
- [ ] Test new menu and hours features
- [ ] Test Howdy Thrift SPA

### Phase 10: Production Deployment ✓ (To Do)
- [ ] Configure production environment variables
- [ ] Set up domain routing (admin.farewellcafe.com, etc.)
- [ ] Deploy unified worker to production
- [ ] Update frontend to use new API endpoints (if needed)
- [ ] Monitor and verify all functionality
- [ ] Archive old worker deployments

## Code Consolidation Priority

### High Priority (Core Functionality)
1. **Event Management** - Essential for current site functionality
2. **Authentication** - Required for all admin functions
3. **CORS Setup** - Required for frontend integration

### Medium Priority (Enhanced Features)  
1. **Flyer Management** - Currently working, needs improvement
2. **Blog Management** - Currently working via iframe
3. **Menu Management** - New feature, high value

### Low Priority (New Applications)
1. **Operating Hours** - New feature, nice to have
2. **Howdy Thrift SPA** - Separate project, can be phased

## Technical Considerations

### Data Migration
- Events: Export from current worker/storage
- Flyers: Verify current storage location and access
- Blog posts: Check current data source
- Menu: Create initial data structure
- Hours: Create initial data structure

### Frontend Compatibility
- Maintain existing API endpoints during transition
- Ensure CORS headers match current setup
- Test event popup functionality thoroughly
- Verify newsletter iframe integration

### Performance
- Implement caching for public endpoints
- Optimize image handling for flyers
- Consider CDN setup for static assets

### Security
- Implement proper authentication for all admin endpoints
- Validate and sanitize all inputs
- Set up proper CORS restrictions
- Consider rate limiting for public APIs

## Rollback Plan
- Keep current workers running during migration
- Use feature flags to gradually enable new endpoints
- Have immediate rollback capability for each phase
- Monitor error rates and performance during cutover

## Success Criteria
- [ ] All existing frontend functionality works unchanged
- [ ] Admin can manage events, flyers, and blog posts through unified dashboard
- [ ] New menu and hours management features are working
- [ ] Howdy Thrift SPA is functional with its own admin panel
- [ ] Performance is equal or better than current setup
- [ ] All security requirements are met
