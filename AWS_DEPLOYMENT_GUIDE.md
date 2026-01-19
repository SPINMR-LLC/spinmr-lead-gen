# SPINMR Lead Generation App - AWS EC2 Deployment Guide

## Prerequisites
- Ubuntu/Debian EC2 instance (your instance: 13.221.69.180)
- SSH access with your key pair (spinmrkeypair)
- Domain: leads.spinmr.com (or your preferred subdomain)

## Step 1: SSH into your EC2 Instance
```bash
ssh -i spinmrkeypair.pem ubuntu@13.221.69.180
# Or for Bitnami images:
ssh -i spinmrkeypair.pem bitnami@13.221.69.180
```

## Step 2: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install Yarn
sudo npm install -g yarn

# Install PM2 for process management
sudo npm install -g pm2
```

## Step 3: Clone Repository
```bash
cd /home/ubuntu  # or /home/bitnami
git clone https://github.com/SPINMR-LLC/spinmr-lead-gen.git
cd spinmr-lead-gen
```

## Step 4: Setup Backend
```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Create .env file
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="spinmr_leads"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=sk-emergent-eDc3eC09eA077DdE48
JWT_SECRET=spinmr_lead_gen_secret_key_2024_secure
EOF

# Test backend
uvicorn server:app --host 0.0.0.0 --port 8001
# Press Ctrl+C to stop after testing
```

## Step 5: Setup Frontend
```bash
cd ../frontend

# Install dependencies
yarn install

# Create .env file (replace with your domain)
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://leads.spinmr.com
EOF

# Build for production
yarn build
```

## Step 6: Configure PM2 for Backend
```bash
cd /home/ubuntu/spinmr-lead-gen

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'spinmr-backend',
    cwd: './backend',
    script: 'venv/bin/uvicorn',
    args: 'server:app --host 0.0.0.0 --port 8001',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start backend with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 7: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/spinmr-leads
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name leads.spinmr.com;

    # Frontend (React build)
    location / {
        root /home/ubuntu/spinmr-lead-gen/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
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
sudo ln -s /etc/nginx/sites-available/spinmr-leads /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d leads.spinmr.com
```

## Step 9: Configure Route 53 DNS

In your AWS Route 53 console, add this record to spinmr.com hosted zone:

| Record name | Type | Value |
|-------------|------|-------|
| leads.spinmr.com | A | 13.221.69.180 |

## Step 10: Configure EC2 Security Group

Ensure these inbound rules are set:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)

## Verify Deployment
```bash
# Check backend
curl http://localhost:8001/api/health

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx
```

## Troubleshooting

### Check logs
```bash
# Backend logs
pm2 logs spinmr-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart services
```bash
pm2 restart spinmr-backend
sudo systemctl restart nginx
```

## Login Credentials
- Email: mpraghavi@gmail.com
- Password: spinmr2024

## Support
For issues with the Emergent LLM Key or AI features, contact Emergent support.
