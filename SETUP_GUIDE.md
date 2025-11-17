# Selectra AI-Powered Interviewer - Setup & Next Steps Guide

## ✅ Completed So Far

### Backend (Django)
1. **API Architecture**
   - Created REST API endpoints for users, organizations, jobs, applications, and interviews
   - Implemented JWT authentication with token refresh
   - Set up ViewSets with proper permissions and filtering
   - Configured CORS for frontend communication

2. **Models & Serializers**
   - Custom User model with user_type (candidate/organization)
   - OrganizationDetails, JobPost, Application, Interview models
   - Complete serializers for all models with validation

### Frontend (React + TypeScript)
1. **API Integration Layer**
   - Created `src/services/api.ts` with axios configuration
   - Token interceptors for automatic refresh
   - Type-safe API functions for all endpoints

2. **Authentication System**
   - AuthContext for global auth state management
   - Login/Register pages connected to real API
   - Protected routes (to be implemented)

3. **UI Updates**
   - Updated login/register forms to use real API calls
   - Added loading states and error handling
   - FormInput component enhanced with name prop support

---

## 🚀 Next Steps to Complete the Project

### Phase 1: Install Dependencies & Setup Database (PRIORITY)

#### Backend Setup
```powershell
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create PostgreSQL database (or use SQLite for development)
# Option 1: Update .env file with PostgreSQL credentials
# Option 2: For quick start, modify settings.py to use SQLite:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### Frontend Setup
```powershell
cd "React Server"

# Install dependencies (axios was added to package.json)
npm install
# or if using bun
bun install

# Start development server
npm run dev
# or
bun dev
```

### Phase 2: Test Authentication Flow
1. Start both backend (port 8000) and frontend (port 5173)
2. Test organization registration at `/org/register`
3. Test candidate registration at `/candidate/register`
4. Test login for both user types
5. Verify JWT tokens are stored in localStorage

### Phase 3: Connect Job Posting (IN PROGRESS)

Update `PostJob.tsx` to actually create jobs:

```typescript
// In src/pages/org/PostJob.tsx
import { jobAPI } from "@/services/api";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const jobData = {
      job_title: formData.jobTitle,
      job_description: formData.description,
      required_skills: formData.skills.split(',').map(s => s.trim()),
      experience_required: formData.experience,
      qualification: formData.qualification,
      responsibilities: formData.responsibilities,
      employment_type: formData.employmentType,
      location: formData.location,
      application_link: window.location.origin + `/apply/${Date.now()}`,
      status: 'active'
    };
    
    const createdJob = await jobAPI.create(jobData);
    // Generate interview link based on job ID
    const interviewLink = `${window.location.origin}/interview/${createdJob.id}`;
    setInterviewLink(interviewLink);
    setShowModal(true);
  } catch (error) {
    console.error('Failed to create job:', error);
  }
};
```

### Phase 4: Connect Dashboards

#### Organization Dashboard
```typescript
// In src/pages/org/Dashboard.tsx
import { useEffect, useState } from "react";
import { jobAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const OrgDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobAPI.list();
        setJobs(data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Rest of component...
};
```

#### Candidate Dashboard
```typescript
// In src/pages/candidate/Dashboard.tsx
import { useEffect, useState } from "react";
import { applicationAPI, jobAPI } from "@/services/api";

const CandidateDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [myApps, jobs] = await Promise.all([
          applicationAPI.list(),
          jobAPI.list()
        ]);
        setApplications(myApps);
        setAvailableJobs(jobs);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  // Rest of component...
};
```

### Phase 5: Implement Protected Routes

Create `src/components/ProtectedRoute.tsx`:
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'candidate' | 'organization';
}

export const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

Update App.tsx routes:
```typescript
<Route path="/org/dashboard" element={
  <ProtectedRoute requiredUserType="organization">
    <OrgDashboard />
  </ProtectedRoute>
} />
```

### Phase 6: AI Services Integration

#### Connect Flask AI Service to Django
1. Create proxy endpoints in Django for AI service calls
2. Update Flask app to handle interview generation
3. Integrate ChromaDB for resume parsing

Example Django proxy view:
```python
# In core/views.py
from rest_framework.decorators import api_view
import requests

@api_view(['POST'])
def generate_interview(request):
    job_id = request.data.get('job_id')
    candidate_resume = request.data.get('resume_text')
    
    # Call Flask AI service
    ai_service_url = 'http://localhost:5000/generate-interview'
    response = requests.post(ai_service_url, json={
        'job_id': job_id,
        'resume': candidate_resume
    })
    
    return Response(response.json())
```

### Phase 7: File Upload Handling

Update Application serializer to handle file uploads:
```python
# In core/serializers.py
class ApplicationCreateSerializer(serializers.ModelSerializer):
    cv_file = serializers.FileField()
    
    class Meta:
        model = Application
        fields = ['job_post', 'candidate_name', 'candidate_email', 'cv_file']
```

Frontend file upload:
```typescript
// In application form
const formData = new FormData();
formData.append('job_post', jobId);
formData.append('candidate_name', user.username);
formData.append('candidate_email', user.email);
formData.append('cv_file', cvFile);

await applicationAPI.create(formData);
```

### Phase 8: Real-time Interview Implementation

1. Set up WebSocket/Socket.io for live interviews
2. Integrate speech-to-text service (e.g., Web Speech API, AssemblyAI)
3. Connect to AI service for generating interview questions
4. Store interview responses in database

### Phase 9: Results & Reporting

1. Create interview evaluation endpoint in Flask AI service
2. Store results in Interview model
3. Create results dashboard for organizations
4. Show interview feedback to candidates

### Phase 10: Testing & Deployment

#### Testing
```powershell
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
cd "React Server"
npm test
```

#### Environment Variables

Backend `.env`:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
POSTGRES_DB=selectra_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

#### Docker Deployment (Optional)
Create `docker-compose.yml` for easy deployment:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: selectra_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
  
  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    ports:
      - "8000:8000"
    depends_on:
      - postgres
  
  frontend:
    build: ./React Server
    ports:
      - "3000:3000"
```

---

## 📝 Current Project Status

### ✅ Completed
- [x] Backend API infrastructure
- [x] JWT authentication
- [x] Frontend API service layer
- [x] Authentication context
- [x] Login/Register pages with API integration

### 🔄 In Progress
- [ ] Job posting connected to API
- [ ] Dashboard data fetching

### ⏳ Pending
- [ ] Protected routes
- [ ] File upload functionality
- [ ] AI service integration
- [ ] Interview flow implementation
- [ ] Results/reporting system
- [ ] Testing
- [ ] Deployment

---

## 🐛 Common Issues & Solutions

### 1. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: Ensure `django-cors-headers` is installed and configured in `settings.py`

### 2. 401 Unauthorized
**Problem**: API requests fail with 401
**Solution**: Check if JWT token is valid, try refreshing or re-logging in

### 3. Module Not Found
**Problem**: React imports fail
**Solution**: Run `npm install` or `bun install` to install dependencies including axios

### 4. Migration Errors
**Problem**: Database migration fails
**Solution**: Delete all migration files except `__init__.py`, then run:
```powershell
python manage.py makemigrations
python manage.py migrate
```

---

## 📚 Resources

- Django REST Framework: https://www.django-rest-framework.org/
- JWT Authentication: https://django-rest-framework-simplejwt.readthedocs.io/
- React Query (for better data fetching): https://tanstack.com/query/latest
- Axios: https://axios-http.com/docs/intro

---

## 🎯 Priority Order for Next Development Session

1. **Install dependencies** (backend & frontend)
2. **Run migrations** and create database
3. **Test authentication** flow end-to-end
4. **Update PostJob** to create actual jobs
5. **Connect dashboards** to fetch real data
6. **Add protected routes**
7. **Implement file uploads**
8. **AI service integration**

---

Generated: November 17, 2025
