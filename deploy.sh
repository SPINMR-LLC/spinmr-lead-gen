#!/bin/bash
# SPINMR Lead Gen - Quick Deploy Script for AWS EC2
# Run this after cloning the repo on your EC2 instance

set -e

echo "🚀 SPINMR Lead Gen - AWS Deployment Script"
echo "==========================================="

# Variables - UPDATE THESE
DOMAIN="leads.spinmr.com"
REPO_DIR="/home/ubuntu/spinmr-lead-gen"
EMERGENT_KEY="sk-emergent-eDc3eC09eA077DdE48"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}[1/8] Installing system dependencies...${NC}"
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip nginx

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn pm2

echo -e "${GREEN}[2/8] Installing MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt update
    sudo apt install -y mongodb-org
fi
sudo systemctl start mongod
sudo systemctl enable mongod

echo -e "${GREEN}[3/8] Setting up Backend...${NC}"
cd $REPO_DIR/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="spinmr_leads"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=$EMERGENT_KEY
JWT_SECRET=spinmr_lead_gen_secret_key_2024_secure
EOF

echo -e "${GREEN}[4/8] Setting up Frontend...${NC}"
cd $REPO_DIR/frontend
yarn install

cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF

yarn build

echo -e "${GREEN}[5/8] Configuring PM2...${NC}"
cd $REPO_DIR

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

pm2 delete spinmr-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo -e "${GREEN}[6/8] Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/spinmr-leads > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $REPO_DIR/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/spinmr-leads /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}[7/8] Setting up SSL...${NC}"
sudo apt install -y certbot python3-certbot-nginx
echo "Run this command after DNS is configured:"
echo "sudo certbot --nginx -d $DOMAIN"

echo -e "${GREEN}[8/8] Verifying deployment...${NC}"
sleep 3
curl -s http://localhost:8001/api/health
echo ""

echo "==========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Add DNS A record: $DOMAIN -> YOUR_EC2_IP"
echo "2. Run: sudo certbot --nginx -d $DOMAIN"
echo "3. Visit: https://$DOMAIN"
echo ""
echo "Login: mpraghavi@gmail.com / spinmr2024"
echo "==========================================="
