# Demo Components Test Route

This route provides a comprehensive testing environment for the new demo mode components.

## Access URL

- **Development**: `http://localhost:4200/dev-test/demo-components`
- **Production**: Route not available (404)

## Features

### ✅ Complete Demo Mode Testing
- Test all demo components in isolation
- Toggle between demo mode and normal mode
- Switch between "use own" and "use demo" options
- Real-time visual feedback and debugging

### 🧪 Test Components

#### Smart Upload Component
- Tests file upload with demo mode bypass
- Shows different UI when `useDemoData` is true
- Automatically loads demo document images

#### Smart Scanner Component
- Tests document scanning with demo mode
- Shows composite image (document over blurry background)
- Simulates camera capture without requiring real camera

#### Smart Liveness Component
- Tests liveness detection with demo mode
- Shows composite image (face over blurry background)
- Simulates liveness capture without requiring real camera

### 🎛️ Test Controls

- **Demo Mode Toggle**: Enable/disable demo mode for the project
- **Demo Choice**: Switch between "use own" and "use demo" options
- **Reset Test**: Reset all test state and counters
- **Real-time Status**: Shows current demo mode state and usage

### 📊 Debug Information

- Attempt counter for each test
- Last result status
- Demo mode status (ON/OFF)
- Use demo data status (YES/NO)
- Detailed capture event information

### 🔧 Mock Data Setup

The test component automatically sets up:
- Mock project with `demoMode: true`
- Mock project flow with all steps enabled
- Mock app registration with document and face validation
- Initialized smart enroll service store

### 🎯 Testing Scenarios

1. **Normal Mode**: Test components work as expected without demo mode
2. **Demo Mode - Use Own**: Test components show demo UI but use real data
3. **Demo Mode - Use Demo**: Test components use demo data and show demo UI
4. **Component Switching**: Test conditional rendering based on demo mode

### 🚀 Usage

1. Start development server: `npm start`
2. Navigate to: `http://localhost:4200/dev-test/demo-components`
3. Use the test controls to toggle demo mode and choice
4. Test each component tab (Upload, Scanner, Liveness)
5. Check browser console for detailed debug information
6. Use "Reset Test" button to test again

### 🔒 Security

- Route is **completely disabled** in production builds
- Uses `environment.production` flag to conditionally include routes
- No security risk for production deployments

### 🎨 Visual Testing

This route is perfect for testing:
- ✅ Demo mode UI changes
- ✅ Component conditional rendering
- ✅ Demo data loading and display
- ✅ Canvas-based composite image generation
- ✅ Translation key display in different languages
- ✅ Responsive behavior across different screen sizes
