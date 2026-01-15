# 3Speak Traffic Director - Deployment Guide

## Quick Installation

```bash
# 1. Clone or copy the project
cd /path/to/trafficdirector

# 2. Run the installation script
sudo ./install.sh
```

The installer will:
- ✅ Check for Node.js and npm
- ✅ Copy files to `/opt/trafficdirector`
- ✅ Install npm dependencies
- ✅ Create .env configuration
- ✅ Set up systemd service
- ✅ Configure logging
- ✅ Set proper permissions

## Configuration

### 1. Edit Environment Variables

```bash
sudo nano /opt/trafficdirector/.env
```

**Required Settings:**
```env
PORT=3000                                           # Application port
MONGODB_URI=mongodb://user:pass@host:27017/        # MongoDB connection
DATABASE_NAME=threespeak                            # Database name
DATABASE_COLLECTION=3speak-hot-nodes                # Collection name
ADMIN_PASSWORD=your-secure-password                 # Admin panel password
SESSION_SECRET=random-secret-key-here               # Session encryption key
API_SECRET=your-api-secret-key                      # API authentication key
API_BASE_URL=http://localhost:3000/api              # API base URL
RATE_LIMIT_WHITELIST=127.0.0.1,::1                  # IPs to skip rate limiting
```

### 2. Generate Secure Secrets

```bash
# Generate random secrets
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 32  # For API_SECRET
openssl rand -base64 32  # For ADMIN_PASSWORD
```

## Service Management

### Start Service
```bash
sudo systemctl start trafficdirector
```

### Stop Service
```bash
sudo systemctl stop trafficdirector
```

### Restart Service
```bash
sudo systemctl restart trafficdirector
```

### Check Status
```bash
sudo systemctl status trafficdirector
```

### Enable Auto-start on Boot
```bash
sudo systemctl enable trafficdirector
```

### Disable Auto-start
```bash
sudo systemctl disable trafficdirector
```

## Monitoring

### View Live Logs
```bash
# System logs
sudo journalctl -u trafficdirector -f

# Application logs
sudo tail -f /var/log/trafficdirector/access.log
sudo tail -f /var/log/trafficdirector/error.log
```

### Check Recent Logs
```bash
# Last 100 lines
sudo journalctl -u trafficdirector -n 100

# Logs from today
sudo journalctl -u trafficdirector --since today
```

## Nginx Reverse Proxy (Optional)

Create `/etc/nginx/sites-available/trafficdirector`:

```nginx
server {
    listen 80;
    server_name traffic.3speak.tv;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/trafficdirector /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d traffic.3speak.tv
```

## Updating the Application

```bash
# 1. Stop the service
sudo systemctl stop trafficdirector

# 2. Backup current installation
sudo cp -r /opt/trafficdirector /opt/trafficdirector.backup

# 3. Copy new files
cd /path/to/new/version
sudo rsync -av --exclude='node_modules' --exclude='.env' ./ /opt/trafficdirector/

# 4. Install dependencies
cd /opt/trafficdirector
sudo npm install --production

# 5. Set permissions
sudo chown -R www-data:www-data /opt/trafficdirector

# 6. Restart service
sudo systemctl start trafficdirector
```

## Uninstallation

```bash
# Stop and disable service
sudo systemctl stop trafficdirector
sudo systemctl disable trafficdirector

# Remove service file
sudo rm /etc/systemd/system/trafficdirector.service
sudo systemctl daemon-reload

# Remove application
sudo rm -rf /opt/trafficdirector
sudo rm -rf /var/log/trafficdirector
```

## Troubleshooting

### Service won't start
```bash
# Check service status
sudo systemctl status trafficdirector

# Check for port conflicts
sudo netstat -tulpn | grep :3000

# Verify MongoDB connection
mongo --eval "db.adminCommand('ping')"
```

### Permission errors
```bash
# Fix ownership
sudo chown -R www-data:www-data /opt/trafficdirector
sudo chmod 600 /opt/trafficdirector/.env
```

### Clear logs
```bash
sudo truncate -s 0 /var/log/trafficdirector/access.log
sudo truncate -s 0 /var/log/trafficdirector/error.log
```

## API Endpoints

### Public Endpoints
- `GET /api/hotnode` - Get next hot node (round-robin, rate-limited)
- `GET /api/node/:owner` - Get node by owner
- `GET /api/nodes` - Get all nodes
- `GET /health` - Health check

### Protected Endpoints (require X-API-Secret header)
- `POST /api/node` - Create/update hot node
- `PUT /api/node/:owner` - Update hot node

### Admin Panel
- `/admin` - Admin dashboard (password protected)
- `/admin/login` - Login page
- `/admin/logout` - Logout

## Security Recommendations

1. **Change default passwords** in .env
2. **Use strong secrets** (32+ characters)
3. **Enable firewall**: `sudo ufw allow 3000/tcp`
4. **Use HTTPS** in production
5. **Restrict MongoDB access** to localhost or trusted IPs
6. **Keep Node.js updated**: `sudo npm install -g n && sudo n stable`
7. **Monitor logs regularly**
8. **Backup MongoDB** regularly

## Support

For issues or questions, check:
- Application logs: `/var/log/trafficdirector/`
- System logs: `sudo journalctl -u trafficdirector`
- MongoDB logs: `/var/log/mongodb/`
