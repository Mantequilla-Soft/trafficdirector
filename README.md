# Traffic Director

A Node.js application that manages hot node infrastructure for video encoding uploads. The Traffic Director monitors hot node health and directs video encoders to available nodes for upload distribution.

## Features

- **Hot Node Management**: Add, enable/disable, and monitor hot nodes
- **Health Monitoring**: Automatically checks hot node status and availability
- **Admin Dashboard**: Web-based interface for managing hot nodes
- **Round-robin Distribution**: Distributes encoder uploads across healthy nodes
- **Activity Logging**: Tracks all hot node changes and activity
- **Real-time Updates**: WebSocket-based dashboard updates
- **Rate Limiting**: Protects API endpoints from abuse
- **Session-based Authentication**: Secure admin access

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string.

## Running the Application

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on the PORT specified in your .env file (default: 3000).

## API Endpoints

### Public Endpoints

#### Get Random Hot Node (for Encoders)
```
GET /api/director/random
```
Returns a random healthy and enabled hot node URL for encoder uploads.

#### Health Check
```
GET /health
```
Returns server status and database connection.

### Admin Endpoints (Require Authentication)

#### Admin Dashboard
```
GET /admin/dashboard
```
Web-based dashboard for managing hot nodes.

#### Get All Hot Nodes
```
GET /api/admin/nodes
```
Returns all hot nodes with their status.

#### Add Hot Node
```
POST /api/admin/nodes
Content-Type: application/json

{
  "value": "hotnode1",
  "url": "https://hotnode1.example.com:5001",
  "description": "Primary hot node"
}
```

#### Update Hot Node Status
```
PATCH /api/admin/nodes/:id/status
Content-Type: application/json

{
  "active": true
}
```

#### Delete Hot Node
```
DELETE /api/admin/nodes/:id
```

## Project Structure

```
trafficdirector/
├── config/
│   └── database.js              # MongoDB configuration
├── controllers/
│   ├── admin.controller.js      # Admin operations
│   └── director.controller.js   # Hot node routing logic
├── middleware/
│   ├── auth.js                  # Authentication middleware
│   └── rateLimiter.js           # Rate limiting
├── models/
│   └── Director.model.js        # Hot node schema
├── routes/
│   ├── admin.routes.js          # Admin API routes
│   └── director.routes.js       # Public API routes
├── utils/
│   ├── activityLogger.js        # Activity logging
│   └── healthCheck.js           # Hot node health checking
├── views/
│   ├── dashboard.ejs            # Admin dashboard
│   └── login.ejs                # Admin login page
├── tests/                       # Test files
├── .env.example                 # Environment variables template
├── .gitignore
├── install.sh                   # Installation script
├── trafficdirector.service      # systemd service file
├── package.json
└── server.js                    # Application entry point
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `DATABASE_NAME` - MongoDB database name
- `DATABASE_COLLECTION` - Collection name for hot nodes
- `API_SECRET` - Secret key for API authentication
- `ADMIN_PASSWORD` - Password for admin dashboard access
- `SESSION_SECRET` - Secret key for session management
- `RATE_LIMIT_WHITELIST` - Comma-separated IPs to whitelist from rate limiting

## Deployment

An installation script is provided for easy deployment:

```bash
sudo ./install.sh
```

This will:
- Install Node.js and dependencies
- Configure MongoDB connection
- Set up systemd service
- Configure firewall rules
- Start the service

## Admin Access

Access the admin dashboard at:
```
http://your-server:PORT/admin/dashboard
```

Default admin password should be changed in the `.env` file.
