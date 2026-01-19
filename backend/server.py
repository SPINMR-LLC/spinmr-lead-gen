from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'hr_lead_gen_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class LeadCreate(BaseModel):
    company_name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    status: str = "new"
    notes: Optional[str] = None
    qualification_score: Optional[int] = None

class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    qualification_score: Optional[int] = None
    ai_insights: Optional[str] = None

class LeadResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    status: str
    notes: Optional[str] = None
    qualification_score: Optional[int] = None
    ai_insights: Optional[str] = None
    created_at: str
    updated_at: str
    user_id: str

class ContactCreate(BaseModel):
    lead_id: str
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    notes: Optional[str] = None

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    notes: Optional[str] = None

class ContactResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    lead_id: str
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

class TemplateCreate(BaseModel):
    name: str
    subject: str
    body: str
    category: str = "outreach"

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None

class TemplateResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    subject: str
    body: str
    category: str
    created_at: str
    user_id: str

class AIResearchRequest(BaseModel):
    company_name: str
    industry: Optional[str] = None
    additional_context: Optional[str] = None

class AIContactDiscoveryRequest(BaseModel):
    company_name: str
    lead_id: Optional[str] = None

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        token=token,
        user=UserResponse(id=user_id, email=data.email, name=data.name, created_at=user_doc["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])

# ============ LEADS ROUTES ============

@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(data: LeadCreate, user: dict = Depends(get_current_user)):
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    lead_doc = {
        "id": lead_id,
        "company_name": data.company_name,
        "industry": data.industry,
        "company_size": data.company_size,
        "website": data.website,
        "status": data.status,
        "notes": data.notes,
        "qualification_score": data.qualification_score,
        "ai_insights": None,
        "created_at": now,
        "updated_at": now,
        "user_id": user["id"]
    }
    await db.leads.insert_one(lead_doc)
    lead_doc.pop("_id", None)
    return LeadResponse(**lead_doc)

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"user_id": user["id"]}
    if status:
        query["status"] = status
    leads = await db.leads.find(query, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    return [LeadResponse(**lead) for lead in leads]

@api_router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id, "user_id": user["id"]}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadResponse(**lead)

@api_router.put("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: str, data: LeadUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.leads.update_one(
        {"id": lead_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return LeadResponse(**lead)

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({"id": lead_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    await db.contacts.delete_many({"lead_id": lead_id})
    return {"message": "Lead deleted"}

@api_router.get("/leads/stats/summary")
async def get_lead_stats(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    results = await db.leads.aggregate(pipeline).to_list(100)
    stats = {r["_id"]: r["count"] for r in results}
    total = sum(stats.values())
    return {
        "total": total,
        "new": stats.get("new", 0),
        "contacted": stats.get("contacted", 0),
        "qualified": stats.get("qualified", 0),
        "proposal": stats.get("proposal", 0),
        "won": stats.get("won", 0),
        "lost": stats.get("lost", 0)
    }

# ============ CONTACTS ROUTES ============

@api_router.post("/contacts", response_model=ContactResponse)
async def create_contact(data: ContactCreate, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": data.lead_id, "user_id": user["id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    contact_id = str(uuid.uuid4())
    contact_doc = {
        "id": contact_id,
        "lead_id": data.lead_id,
        "name": data.name,
        "title": data.title,
        "email": data.email,
        "phone": data.phone,
        "linkedin": data.linkedin,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "user_id": user["id"]
    }
    await db.contacts.insert_one(contact_doc)
    contact_doc.pop("_id", None)
    contact_doc.pop("user_id", None)
    return ContactResponse(**contact_doc)

@api_router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(lead_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"user_id": user["id"]}
    if lead_id:
        query["lead_id"] = lead_id
    contacts = await db.contacts.find(query, {"_id": 0, "user_id": 0}).to_list(1000)
    return [ContactResponse(**c) for c in contacts]

@api_router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(contact_id: str, data: ContactUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = await db.contacts.update_one(
        {"id": contact_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0, "user_id": 0})
    return ContactResponse(**contact)

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user: dict = Depends(get_current_user)):
    result = await db.contacts.delete_one({"id": contact_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted"}

# ============ TEMPLATES ROUTES ============

@api_router.post("/templates", response_model=TemplateResponse)
async def create_template(data: TemplateCreate, user: dict = Depends(get_current_user)):
    template_id = str(uuid.uuid4())
    template_doc = {
        "id": template_id,
        "name": data.name,
        "subject": data.subject,
        "body": data.body,
        "category": data.category,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "user_id": user["id"]
    }
    await db.templates.insert_one(template_doc)
    template_doc.pop("_id", None)
    return TemplateResponse(**template_doc)

@api_router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(user: dict = Depends(get_current_user)):
    templates = await db.templates.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return [TemplateResponse(**t) for t in templates]

@api_router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(template_id: str, data: TemplateUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = await db.templates.update_one(
        {"id": template_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = await db.templates.find_one({"id": template_id}, {"_id": 0})
    return TemplateResponse(**template)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user: dict = Depends(get_current_user)):
    result = await db.templates.delete_one({"id": template_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

# ============ AI ROUTES ============

@api_router.post("/ai/research")
async def ai_research_company(data: AIResearchRequest, user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"research_{user['id']}_{uuid.uuid4()}",
            system_message="""You are an expert B2B sales researcher specializing in HR services. 
            Analyze companies and provide actionable insights for HR service providers.
            Focus on: company size indicators, HR pain points, growth signals, and potential HR service needs.
            Be concise and practical."""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Research this company for HR service opportunities:

Company: {data.company_name}
Industry: {data.industry or 'Unknown'}
Additional Context: {data.additional_context or 'None'}

Provide:
1. Company Overview (2-3 sentences)
2. Estimated Company Size
3. HR Service Needs Score (1-10)
4. Key HR Pain Points (3-5 bullet points)
5. Best Approach for Outreach (2-3 sentences)
6. Recommended Services: Which HR services would benefit them most?"""

        response = await chat.send_message(UserMessage(text=prompt))
        return {"research": response, "company_name": data.company_name}
    except Exception as e:
        logger.error(f"AI Research error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI research failed: {str(e)}")

@api_router.post("/ai/discover-contacts")
async def ai_discover_contacts(data: AIContactDiscoveryRequest, user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"contacts_{user['id']}_{uuid.uuid4()}",
            system_message="""You are an expert at identifying key decision-makers for HR services.
            Suggest likely contact roles and how to find them.
            Focus on HR Directors, People Operations, CHROs, and CEOs for smaller companies."""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""For the company "{data.company_name}", suggest the best contacts to reach for HR services:

1. List 3-5 key decision-maker roles to target
2. For each role, provide:
   - Typical title variations
   - Why they're important for HR service decisions
   - How to find them (LinkedIn, company website, etc.)
3. Suggested outreach priority order
4. Best initial contact approach for each role"""

        response = await chat.send_message(UserMessage(text=prompt))
        return {"contacts_research": response, "company_name": data.company_name}
    except Exception as e:
        logger.error(f"AI Contact Discovery error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI contact discovery failed: {str(e)}")

@api_router.post("/ai/generate-email")
async def ai_generate_email(lead_id: str, template_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    lead = await db.leads.find_one({"id": lead_id, "user_id": user["id"]}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    template_context = ""
    if template_id:
        template = await db.templates.find_one({"id": template_id, "user_id": user["id"]}, {"_id": 0})
        if template:
            template_context = f"\nUse this template style:\nSubject: {template['subject']}\nBody: {template['body']}"
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"email_{user['id']}_{uuid.uuid4()}",
            system_message="""You are an expert B2B sales copywriter for HR services.
            Write personalized, professional outreach emails that are concise and compelling.
            Focus on value proposition and specific pain points."""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Generate a personalized outreach email for:

Company: {lead['company_name']}
Industry: {lead.get('industry', 'Unknown')}
Company Size: {lead.get('company_size', 'Unknown')}
AI Insights: {lead.get('ai_insights', 'None available')}
{template_context}

Create:
1. Subject line (compelling, under 50 chars)
2. Email body (under 150 words)
3. Clear call-to-action"""

        response = await chat.send_message(UserMessage(text=prompt))
        return {"email": response, "lead_id": lead_id}
    except Exception as e:
        logger.error(f"AI Email Generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI email generation failed: {str(e)}")

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "SPINMR LLC Lead Generation API", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============ SEED DATA ============

EXAMPLE_LEADS = [
    {"company_name": "TechVision Software", "industry": "Technology", "company_size": "51-200 employees", "website": "https://techvision.example.com", "notes": "Fast-growing SaaS company, recently raised Series B funding"},
    {"company_name": "MedCare Solutions", "industry": "Healthcare", "company_size": "201-500 employees", "website": "https://medcare.example.com", "notes": "Healthcare tech company expanding into new markets"},
    {"company_name": "Capital Trust Bank", "industry": "Finance", "company_size": "500+ employees", "website": "https://capitaltrust.example.com", "notes": "Regional bank with compliance-heavy HR needs"},
    {"company_name": "PrecisionMfg Industries", "industry": "Manufacturing", "company_size": "201-500 employees", "website": "https://precisionmfg.example.com", "notes": "Manufacturing company with shift-based workforce challenges"},
    {"company_name": "ShopSmart Retail", "industry": "Retail", "company_size": "51-200 employees", "website": "https://shopsmart.example.com", "notes": "E-commerce retailer with high seasonal hiring needs"},
    {"company_name": "Apex Consulting Group", "industry": "Professional Services", "company_size": "11-50 employees", "website": "https://apexconsulting.example.com", "notes": "Growing consulting firm needs HR infrastructure"},
    {"company_name": "BrightMinds Academy", "industry": "Education", "company_size": "51-200 employees", "website": "https://brightminds.example.com", "notes": "Private education institution, complex faculty management"},
    {"company_name": "Summit Properties", "industry": "Real Estate", "company_size": "11-50 employees", "website": "https://summitproperties.example.com", "notes": "Real estate firm with distributed workforce"},
    {"company_name": "Grand Hotels Group", "industry": "Hospitality", "company_size": "201-500 employees", "website": "https://grandhotels.example.com", "notes": "Hotel chain with high turnover, needs onboarding solutions"},
    {"company_name": "BuildRight Construction", "industry": "Construction", "company_size": "51-200 employees", "website": "https://buildright.example.com", "notes": "Construction company with compliance and safety training needs"},
    {"company_name": "FastTrack Logistics", "industry": "Transportation", "company_size": "201-500 employees", "website": "https://fasttrack.example.com", "notes": "Logistics company with driver management challenges"},
    {"company_name": "Creative Studios Media", "industry": "Media & Entertainment", "company_size": "11-50 employees", "website": "https://creativestudios.example.com", "notes": "Media production company with freelancer management needs"},
    {"company_name": "GreenGrow Farms", "industry": "Other", "company_size": "51-200 employees", "website": "https://greengrow.example.com", "notes": "Agricultural business with seasonal workforce"}
]

@api_router.post("/leads/seed")
async def seed_example_leads(user: dict = Depends(get_current_user)):
    """Populate the database with example leads for each industry"""
    created_count = 0
    now = datetime.now(timezone.utc).isoformat()
    
    for lead_data in EXAMPLE_LEADS:
        # Check if lead already exists for this user
        existing = await db.leads.find_one({
            "company_name": lead_data["company_name"],
            "user_id": user["id"]
        })
        if existing:
            continue
            
        lead_id = str(uuid.uuid4())
        lead_doc = {
            "id": lead_id,
            "company_name": lead_data["company_name"],
            "industry": lead_data["industry"],
            "company_size": lead_data["company_size"],
            "website": lead_data["website"],
            "status": "new",
            "notes": lead_data["notes"],
            "qualification_score": None,
            "ai_insights": None,
            "created_at": now,
            "updated_at": now,
            "user_id": user["id"]
        }
        await db.leads.insert_one(lead_doc)
        created_count += 1
    
    return {"message": f"Created {created_count} example leads", "total_examples": len(EXAMPLE_LEADS)}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
