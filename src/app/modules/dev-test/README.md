# Development Test Routes

This module contains development-only testing routes that are **automatically excluded** from production builds.

## Smart Liveness Test

### Access URL
- **Development**: `http://localhost:4200/dev-test/smart-liveness`
- **Production**: Route not available (404)

### Features
- ✅ Complete isolation testing of the smart-liveness component
- ✅ Mock data setup for all required services
- ✅ Visual test controls and feedback
- ✅ Real-time debug information
- ✅ Reset functionality for repeated testing

### Test Controls
- **Reset Test**: Resets the component state for fresh testing
- **Console Logging**: Detailed logs for debugging angle detection, performance, etc.
- **Visual Feedback**: Success/failure states and attempt counters

### Mock Data
The test component automatically sets up:
- Mock project with branding configuration
- Mock project flow with liveness enabled
- Mock app registration
- Initialized smart enroll service store

### Usage
1. Start development server: `npm start`
2. Navigate to: `http://localhost:4200/dev-test/smart-liveness`
3. Test the liveness detection with your optimized settings
4. Check browser console for detailed debug information
5. Use "Reset Test" button to test again

### Security
- Route is **completely disabled** in production builds
- Uses `environment.production` flag to conditionally include routes
- No security risk for production deployments

### Testing Focus
This route is perfect for testing:
- ✅ New angle threshold improvements
- ✅ Adaptive detection speed optimizations  
- ✅ Responsive styling behavior
- ✅ Cross-user compatibility
- ✅ Mobile vs desktop performance differences
