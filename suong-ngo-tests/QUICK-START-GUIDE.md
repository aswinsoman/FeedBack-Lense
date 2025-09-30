# Quick Start Guide - Individual Feature Testing

## 🚀 **Step-by-Step Testing Guide**

### **Step 1: Start Your Applications**

Open **3 terminals** and run these commands:

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend  
cd frontend
npm start

# Terminal 3: Run Tests
cd suong-ngo-tests
```

### **Step 2: Test Individual Features**

Once both applications are running, test each feature individually:

```bash
# Test F3: Survey Creation (Chrome only - fastest)
npm run test:f3:chrome

# Test F5: Survey Taking (Chrome only)
npm run test:f5:chrome

# Test F6: Analytics (Chrome only)
npm run test:f6:chrome

# Test F8: PDF Export (Chrome only)
npm run test:f8:chrome
```

### **Step 3: Debug Issues (if any)**

If tests fail, use these commands to debug:

```bash
# Run with visible browser (see what's happening)
npm run test:f3:headed

# Run in debug mode (step through tests)
npm run test:f3:debug

# Run all browsers for F3 (if Chrome works)
npm run test:f3
```

## 📋 **Available Test Commands**

### **Individual Feature Tests**
| Command | Description | Tests | Time |
|---------|-------------|-------|------|
| `npm run test:f3` | F3: Survey Creation (all browsers) | 95 | ~3 min |
| `npm run test:f5` | F5: Survey Taking (all browsers) | 95 | ~3 min |
| `npm run test:f6` | F6: Analytics (all browsers) | 125 | ~4 min |
| `npm run test:f8` | F8: PDF Export (all browsers) | 85 | ~3 min |

### **Chrome-Only Tests (Faster)**
| Command | Description | Tests | Time |
|---------|-------------|-------|------|
| `npm run test:f3:chrome` | F3 on Chrome only | 19 | ~30 sec |
| `npm run test:f5:chrome` | F5 on Chrome only | 19 | ~30 sec |
| `npm run test:f6:chrome` | F6 on Chrome only | 25 | ~40 sec |
| `npm run test:f8:chrome` | F8 on Chrome only | 17 | ~30 sec |

### **Debug Commands**
| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run test:f3:headed` | F3 with visible browser | See what's happening |
| `npm run test:f3:debug` | F3 in debug mode | Step through tests |
| `npm run test:f3 -- --retries=3` | F3 with 3 retries | Handle flaky tests |

## 🔧 **Troubleshooting**

### **Common Issues and Solutions**

#### **Issue 1: "Application not running"**
```bash
# Solution: Make sure both applications are running
# Check Terminal 1: Backend should show "Server running at http://localhost:5000"
# Check Terminal 2: Frontend should show "Server running at http://localhost:3000"
```

#### **Issue 2: "TimeoutError: page.fill: Timeout 10000ms exceeded"**
```bash
# Solution: Application not fully loaded
# Wait 30-60 seconds after starting applications
# Then run: npm run test:f3:chrome
```

#### **Issue 3: "Element not found"**
```bash
# Solution: Use headed mode to see what's happening
npm run test:f3:headed
# This will open a browser window so you can see the issue
```

#### **Issue 4: "Tests are slow"**
```bash
# Solution: Use Chrome-only tests for faster feedback
npm run test:f3:chrome  # Instead of npm run test:f3
```

## 📊 **Expected Results**

### **When Tests Pass**
```
✓ F3: Survey Creation with CSV Upload (19)
  ✓ Authentication & Access Control (3)
  ✓ CSV Upload Functionality (3)
  ✓ CSV Validation (4)
  ✓ CSV Preview & Editing (2)
  ✓ Survey Setup & Creation (2)
  ✓ Error Handling (3)
  ✓ User Experience (2)

19 passed (30.2s)
```

### **When Tests Fail**
```
✗ F3: Survey Creation with CSV Upload (19)
  ✗ should redirect to login when accessing survey creation without authentication
    TimeoutError: page.fill: Timeout 10000ms exceeded.
    Call log:
      - waiting for locator('#email')

19 failed (30.2s)
```

## 🎯 **Progressive Testing Strategy**

### **Phase 1: Basic Functionality (Start Here)**
```bash
# Test F3 on Chrome only first
npm run test:f3:chrome

# If this works, test other features
npm run test:f5:chrome
npm run test:f6:chrome
npm run test:f8:chrome
```

### **Phase 2: All Browsers (Once Chrome works)**
```bash
# Test each feature on all browsers
npm run test:f3
npm run test:f5
npm run test:f6
npm run test:f8
```

### **Phase 3: Full Suite (Once individual features work)**
```bash
# Run all tests
npm test
```

## 📈 **Performance Tips**

### **Faster Testing**
- Use Chrome-only tests: `npm run test:f3:chrome`
- Test one feature at a time
- Use `--headed` only when debugging

### **Debugging**
- Use `--headed` to see browser
- Use `--debug` to step through tests
- Check browser console for errors

### **CI/CD**
- Use `npm run test:ci` for automated testing
- Use `npm run test:report` to view results

## 🆘 **Getting Help**

### **Check Test Reports**
```bash
# View HTML report
npm run test:report

# View test results
ls test-results/
```

### **Common Commands**
```bash
# List all available tests
npm run test -- --list

# Run specific test
npm run test:f3 -- --grep "should redirect to login"

# Update snapshots
npm run test:update-snapshots
```

---

**Happy Testing! 🎉**

Start with `npm run test:f3:chrome` and work your way up! 🚀
