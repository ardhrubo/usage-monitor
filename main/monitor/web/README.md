# monitor/

## Web Monitor

### Approach 1: Browser Extension (Recommended)
- Chrome extension
- Firefox WebExtension
- Edge extension

Benefits:
- Accurate URL tracking
- Works across all browser instances
- Easy to implement

### Approach 2: Native Browser Integration
- Chrome DevTools Protocol
- Firefox Remote Agent
- Custom browser forks

### Implementation

Browser extension structure:
```
extension/
├── manifest.json
├── background.js
├── content.js
└── utils/
```

Track:
- URL
- Title
- Domain
- Time spent
- Category (productive/unproductive)
