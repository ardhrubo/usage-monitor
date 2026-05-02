# Usage Monitor

A desktop application to monitor app and website usage for productivity tracking.

## Features

- 📊 Real-time app usage monitoring
- 🌐 Website tracking
- 📈 Daily/Weekly/Monthly reports
- 📤 Export data to CSV
- 🌙 Dark/Light theme support
- 🔒 Local-only data storage

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Electron + TypeScript
- **Database**: SQLite (better-sqlite3)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/usage-monitor.git
cd usage-monitor

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```

## Project Structure

```
usage-monitor/
├── main/                 # Electron main process
│   ├── monitor/         # App and web monitoring
│   ├── database/        # SQLite database service
│   └── index.ts         # Electron entry point
├── renderer/            # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API calls
│   │   └── utils/       # Helper functions
│   └── index.html
├── shared/              # Shared types and interfaces
├── package.json
└── README.md
```

## Building for Different Platforms

```bash
# Windows
npm run build -- --win

# macOS
npm run build -- --mac

# Linux
npm run build -- --linux
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
# usage-monitor
