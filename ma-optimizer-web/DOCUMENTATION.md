# MA Optimizer Web Documentation

## Overview

MA Optimizer Web is a web-based version of the popular MA Optimizer desktop application. It provides a modern, accessible interface for system optimization and performance monitoring.

## Architecture

The application follows a client-server architecture:

- **Frontend**: React-based single-page application (SPA)
- **Backend**: Express.js server providing RESTful API endpoints
- **Data Flow**: Frontend components communicate with the backend API to fetch system information and trigger optimization processes

## Directory Structure

```
ma-optimizer-web/
├── dist/                  # Built application (generated)
├── node_modules/          # Dependencies (generated)
├── public/                # Static assets
├── src/                   # Source code
│   ├── api/               # API client code
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts for state management
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main application component
│   ├── index.css          # Global styles
│   └── index.jsx          # Application entry point
├── .gitignore             # Git ignore file
├── CHANGELOG.md           # Version history
├── deploy.sh              # Deployment script
├── DOCUMENTATION.md       # This file
├── index.html             # HTML entry point
├── package.json           # Project configuration
├── postcss.config.js      # PostCSS configuration
├── README.md              # Project overview
├── server.js              # Express server
├── start.sh               # Development startup script
├── tailwind.config.js     # Tailwind CSS configuration
└── vite.config.js         # Vite configuration
```

## Components

### Pages

- **Dashboard**: Displays system information and performance metrics
- **Optimizer**: Provides interface for running optimization processes
- **Visualization**: Shows performance data in various chart formats
- **Settings**: Allows customization of application behavior
- **About**: Provides information about the project and team

### UI Components

- **Header**: Top navigation bar with logo and user controls
- **Sidebar**: Navigation menu for accessing different pages
- **Charts**: Various visualization components using Recharts

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/system-info`: Returns information about the system
- `GET /api/performance-data`: Returns performance metrics
- `POST /api/optimize`: Triggers optimization processes

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev:all`

### Building

1. Build the application: `npm run build`
2. Start the production server: `npm run server`

## Deployment

1. Run the deployment script: `./deploy.sh`
2. Upload the generated zip file to your server
3. Extract the zip file
4. Run the start script: `./start.sh`

## Customization

### Themes

The application uses Tailwind CSS for styling. The theme can be customized in the `tailwind.config.js` file.

### Adding New Features

1. Create new components in the appropriate directories
2. Add new API endpoints in `server.js`
3. Update the documentation to reflect the changes

## Troubleshooting

### Common Issues

- **API Connection Errors**: Ensure the server is running and accessible
- **Build Failures**: Check for syntax errors in the code
- **Missing Dependencies**: Run `npm install` to install all dependencies

### Logs

- Frontend logs can be viewed in the browser console
- Backend logs are output to the terminal running the server

## License

This project is licensed under the MIT License - see the LICENSE file for details.