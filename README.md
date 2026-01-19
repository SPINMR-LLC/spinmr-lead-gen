# SPINMR Lead Generation App

AI-powered lead generation platform for HR services by **SPINMR LLC**.

## Features
- 🔍 **AI Company Research** - Analyze companies for HR service opportunities using GPT-5.2
- 👥 **AI Contact Discovery** - Find key decision-makers (CHROs, HR Directors)
- 📧 **AI Email Generation** - Generate personalized outreach emails
- 📊 **Lead Pipeline** - Track leads through sales stages
- 👤 **Contact Management** - Manage contacts linked to leads
- 📝 **Email Templates** - Create and manage outreach templates

## Tech Stack
- **Backend**: FastAPI + MongoDB
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **AI**: OpenAI GPT-5.2 via Emergent Integrations
- **Auth**: JWT

## Quick Start

### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
uvicorn server:app --reload --port 8001

# Frontend (new terminal)
cd frontend
yarn install
yarn start
```

### AWS Deployment
See [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md) for full instructions.

```bash
chmod +x deploy.sh
./deploy.sh
```

## Environment Variables

### Backend (.env)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="spinmr_leads"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=your_emergent_key
JWT_SECRET=your_secret_key
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://leads.spinmr.com
```

## API Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `POST /api/leads/seed` - Seed example leads
- `POST /api/ai/research` - AI company research
- `POST /api/ai/discover-contacts` - AI contact discovery
- `POST /api/ai/generate-email` - AI email generation

## License
© 2024 SPINMR LLC. All rights reserved.
