# SELECTRA - AI-Powered Recruitment Platform

## Complete Website Documentation & Code Reference

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Page-by-Page Guide](#page-by-page-guide)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Key Components](#key-components)
7. [Editing Guide](#editing-guide)

---

## Project Overview

SELECTRA is an AI-powered recruitment platform that connects organizations with candidates through an intelligent interview process. The platform allows organizations to post jobs, receive applications, and candidates to apply and participate in AI-driven interviews.

### Main Features
- Organization registration and job posting
- Candidate registration and CV upload
- AI-powered interview system
- Pre-assessment questions for candidates
- Application tracking dashboard

---

## Technology Stack

- **Frontend Framework**: React 18.3.1 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (Lovable Cloud)
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation
- **State Management**: React hooks (useState, useEffect)
- **UI Components**: Radix UI primitives

---

## Page-by-Page Guide

### 1. Main Landing Page (`/`)
**File**: `src/pages/Index.tsx`

**Purpose**: Main entry point where users choose their role (Organization or Candidate)

**Key Features**:
- Hero section with SELECTRA branding
- Role selection (Organization/Candidate)
- Navigation to respective signup/login pages

**Editable Elements**:
- Hero text and descriptions
- Background image (`selectraBg`)
- Logo (`selectraLogo`)
- Button text and styling

**Code Location**: Lines 1-100+

---

### 2. Organization Authentication

#### Organization Signup (`/organization-signup`)
**File**: `src/pages/OrganizationSignup.tsx`

**Purpose**: New organization registration

**Key Features**:
- Email/password signup form
- User type set to "organization"
- Redirects to organization landing after signup
- Auto-confirm email enabled

**Form Fields**:
- Email (required)
- Password (required, min 6 characters)

**Code Location**: Entire file

---

#### Organization Login (`/organization-login`)
**File**: `src/pages/OrganizationLogin.tsx`

**Purpose**: Existing organization login

**Key Features**:
- Email/password login
- Session management
- Redirect to organization dashboard

**Code Location**: Entire file

---

### 3. Organization Landing/Dashboard (`/organization-landing`)
**File**: `src/pages/OrganizationLanding.tsx`

**Purpose**: Multi-step form for organization registration and job posting

**Steps Overview**:
1. **Organization Registration** (Step 1, Lines 230-312)
2. **Job Details** (Step 2, Lines 314-477)
3. **Pre-Assessment Questions** (Step 3, Lines 479-550)
4. **Success/Link Generation** (Step 4, Lines 552-597)

#### Step 1: Organization Information
**Fields**:
- Organization Name * (required)
- Legal Document URL (optional)
- Website Link (optional)
- Company Description (optional, textarea)
- Business Address * (required, textarea)
- Contact Number * (required)
- Contact Person * (required)

**Database Table**: `organization_details`

**Code Lines**: 244-303

**How to Edit**:
- Add/remove fields: Modify `OrganizationFormData` interface (lines 15-31)
- Change validation: Update `rules` prop in FormField
- Modify layout: Edit the form structure in the JSX

---

#### Step 2: Job Posting Details
**Fields**:
- Job Title * (required)
- Job Description * (required, textarea)
- Required Skills * (required, comma-separated)
- Experience Required (optional)
- Qualification (optional)
- Key Responsibilities (optional, textarea)
- Employment Type (optional)
- Location (optional)

**Database Table**: `job_posts`

**Code Lines**: 329-448

**How to Edit**:
- Modify job fields in the interface (lines 15-31)
- Update form validation rules in each FormField
- Change layout by modifying grid structure (line 420)

---

#### Step 3: Pre-Assessment Questions
**Purpose**: Add up to 5 custom questions for candidates

**Features**:
- Dynamic question addition (max 5)
- Remove questions individually
- Questions saved to `job_posts.pre_assessment_questions` array

**Code Lines**: 479-550

**Key Functions**:
- `addQuestion()` - Line 128
- `removeQuestion(index)` - Line 134
- `updateQuestion(index, value)` - Line 138

**How to Edit**:
- Change max questions: Update condition in `addQuestion` (line 129)
- Modify question UI: Edit the mapping section (lines 494-527)

---

#### Step 4: Success & Link Generation
**Purpose**: Display generated application link

**Features**:
- Shows unique job application URL
- Copy-to-clipboard functionality
- Option to post another job

**Code Lines**: 552-597

**Generated Link Format**: `{domain}/cv-upload?job={job_id}`

---

### 4. Candidate Authentication

#### Candidate Signup (`/candidate-signup`)
**File**: `src/pages/CandidateSignup.tsx`

**Purpose**: New candidate registration

**Key Features**:
- Email/password signup
- User type set to "candidate"
- Redirects to candidate landing

**Code Location**: Entire file

---

#### Candidate Login (`/candidate-login`)
**File**: `src/pages/CandidateLogin.tsx`

**Purpose**: Existing candidate login

**Key Features**:
- Email/password authentication
- Session persistence
- Redirect to candidate dashboard

**Code Location**: Entire file

---

### 5. Candidate Landing (`/candidate-landing`)
**File**: `src/pages/CandidateLanding.tsx`

**Purpose**: Candidate dashboard after login

**Key Features**:
- View available job postings
- Access to submitted applications
- Continue to interview process

**Important Note**: When "Continue to Interview" is clicked, candidates are shown a message that they will receive an invitation email with a login link valid for 5 days.

**Code Location**: Entire file

---

### 6. CV Upload Page (`/cv-upload`)
**File**: `src/pages/CVUpload.tsx`

**Purpose**: Candidate job application submission

**Key Features**:
- Fetch job details from URL parameter (`?job={id}`)
- Display job information
- CV file upload
- Answer pre-assessment questions
- Submit application

**Form Fields**:
- Full Name (required)
- Email (required)
- CV Upload (required, file input)
- Pre-assessment answers (dynamic based on job)

**Database Table**: `applications`

**Code Location**: Entire file

**Application Submission**:
- Lines showing the submission logic
- Stores CV URL, candidate info, and answers
- Shows success message about email invitation

**How to Edit**:
- Modify form fields in the form structure
- Change file upload handling
- Update success message text

---

### 7. AI Interview Page (`/ai-interview`)
**File**: `src/pages/AIInterview.tsx`

**Purpose**: AI-powered video interview interface

**Key Features**:
- Background: Same as main landing page (`selectraBg`)
- SELECTRA logo displayed prominently
- AI avatar for interviewer
- Video/audio recording
- Real-time AI questions and responses

**Design Elements**:
- Background image: `selectraBg` (line with backgroundImage style)
- Logo: `selectraLogo` centered on pre-interview screen
- AI Avatar: `aiAvatar` during interview

**Code Location**: Entire file

**How to Edit**:
- Change background: Update `selectraBg` import or image file
- Modify logo placement: Edit the logo section in JSX
- Update AI behavior: Modify the interview logic

---

### 8. Interview Complete Page (`/interview-complete`)
**File**: `src/pages/InterviewComplete.tsx`

**Purpose**: Confirmation page after interview completion

**Features**:
- Thank you message
- Next steps information
- Return to dashboard option

**Code Location**: Entire file

---

### 9. Organization Dashboard (`/organization-dashboard`)
**File**: `src/pages/OrganizationDashboard.tsx`

**Purpose**: View and manage job posts and applications

**Key Features**:
- List all job posts by organization
- View applications per job
- Application status tracking

**Code Location**: Entire file

---

### 10. Not Found Page (`/404`)
**File**: `src/pages/NotFound.tsx`

**Purpose**: 404 error page for invalid routes

**Code Location**: Entire file

---

## Database Schema

### Tables Overview

#### 1. `profiles`
Stores user profile information for both candidates and organizations.

**Columns**:
- `id` (uuid, primary key) - References auth.users
- `email` (text)
- `user_type` (enum: 'candidate' | 'organization')
- `created_at` (timestamp)
- `updated_at` (timestamp)

**File Reference**: See in supabase types

---

#### 2. `organization_details`
Stores detailed information about organizations.

**Columns**:
- `id` (uuid, primary key)
- `user_id` (uuid) - References profiles
- `organization_name` (text, required)
- `legal_document_url` (text, optional) - **NEW FIELD**
- `website_link` (text, optional) - **NEW FIELD**
- `company_description` (text, optional) - **NEW FIELD**
- `address` (text, required)
- `contact_number` (text, required)
- `contact_person` (text, required)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Used In**: `src/pages/OrganizationLanding.tsx` (Step 1)

**RLS Policies**:
- Organizations can view/update/insert their own details only

---

#### 3. `job_posts`
Stores job postings created by organizations.

**Columns**:
- `id` (uuid, primary key)
- `organization_id` (uuid) - References profiles
- `job_title` (text, required)
- `job_description` (text, required)
- `required_skills` (text[], required)
- `experience_required` (text)
- `qualification` (text)
- `responsibilities` (text)
- `employment_type` (text)
- `location` (text)
- `pre_assessment_questions` (text[]) - Array of questions
- `application_link` (text, required)
- `status` (text, default: 'active')
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Used In**: 
- `src/pages/OrganizationLanding.tsx` (Step 2 & 3)
- `src/pages/CVUpload.tsx` (Display job details)

**RLS Policies**:
- Anyone can view active jobs
- Organizations can manage their own jobs

---

#### 4. `applications`
Stores candidate applications to job posts.

**Columns**:
- `id` (uuid, primary key)
- `job_post_id` (uuid) - References job_posts
- `candidate_id` (uuid) - References profiles (nullable)
- `candidate_name` (text, required)
- `candidate_email` (text, required)
- `cv_url` (text)
- `status` (text, default: 'pending')
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Used In**: `src/pages/CVUpload.tsx`

**RLS Policies**:
- Anyone can insert applications
- Candidates can view their own
- Organizations can view applications for their jobs

---

#### 5. `interviews`
Stores interview records linked to applications.

**Columns**:
- `id` (uuid, primary key)
- `application_id` (uuid) - References applications
- `interview_type` (text)
- `scheduled_date` (timestamp)
- `status` (text, default: 'scheduled')
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Used In**: `src/pages/AIInterview.tsx`

**RLS Policies**:
- Organizations can manage interviews for their job applications

---

## Authentication Flow

### Organization Flow
1. User visits main page (`/`)
2. Clicks "I'm an Organization" 
3. Redirected to `/organization-signup` or `/organization-login`
4. After signup/login → `/organization-landing`
5. Complete multi-step form:
   - Step 1: Organization details
   - Step 2: Job posting
   - Step 3: Pre-assessment questions
   - Step 4: Get shareable link
6. Access dashboard at `/organization-dashboard`

**Authentication Code**: 
- Signup: `src/pages/OrganizationSignup.tsx`
- Login: `src/pages/OrganizationLogin.tsx`
- Session check: In each page's `useEffect` hook

---

### Candidate Flow
1. User visits main page (`/`)
2. Clicks "I'm a Candidate"
3. Redirected to `/candidate-signup` or `/candidate-login`
4. After signup/login → `/candidate-landing`
5. View jobs and click apply
6. Fill application at `/cv-upload?job={id}`
7. Receive email notification
8. Complete AI interview at `/ai-interview`
9. View completion at `/interview-complete`

**Authentication Code**:
- Signup: `src/pages/CandidateSignup.tsx`
- Login: `src/pages/CandidateLogin.tsx`

---

## Key Components

### UI Components (`src/components/ui/`)
All UI components are from shadcn/ui library:

- **Button** (`button.tsx`) - All buttons across the site
- **Card** (`card.tsx`) - Card containers for forms and content
- **Form** (`form.tsx`) - Form components with validation
- **Input** (`input.tsx`) - Text input fields
- **Textarea** (`textarea.tsx`) - Multi-line text inputs
- **Alert** (`alert.tsx`) - Alert messages
- **Dialog** (`dialog.tsx`) - Modal dialogs
- **Badge** (`badge.tsx`) - Status badges
- **Tabs** (`tabs.tsx`) - Tab navigation
- **Table** (`table.tsx`) - Data tables

**How to Edit Styles**: Modify `src/index.css` for global theme variables

---

### Assets (`src/assets/`)
- `selectra-logo.png` - SELECTRA logo
- `selectra-bg.jpg` - Background image used across pages
- `ai-avatar.png` - AI interviewer avatar

**How to Replace**:
1. Add new image to `src/assets/`
2. Update import in relevant page file
3. Replace the import statement

---

## Editing Guide

### Common Editing Tasks

#### 1. Change Organization Form Fields

**File**: `src/pages/OrganizationLanding.tsx`

**Steps**:
1. Update `OrganizationFormData` interface (lines 15-31)
2. Add default value in `defaultValues` (lines 40-57)
3. Add FormField in Step 1 JSX (lines 244-303)
4. Update database insert in `onSubmitOrgInfo` (lines 96-104)
5. If needed, run database migration to add column

**Example - Adding "Industry" field**:
```typescript
// 1. Update interface
interface OrganizationFormData {
  // ... existing fields
  industry: string;  // Add this
}

// 2. Add default value
defaultValues: {
  // ... existing defaults
  industry: "",  // Add this
}

// 3. Add FormField (after company description)
<FormField
  control={form.control}
  name="industry"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Industry</FormLabel>
      <FormControl>
        <Input placeholder="e.g., Technology, Healthcare" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// 4. Update database insert
.upsert({
  // ... existing fields
  industry: data.industry,  // Add this
})
```

---

#### 2. Modify Pre-Assessment Questions

**File**: `src/pages/OrganizationLanding.tsx`

**Change max questions from 5 to 10**:
```typescript
// Line 129
const addQuestion = () => {
  if (preAssessmentQuestions.length < 10) {  // Change from 5 to 10
    setPreAssessmentQuestions([...preAssessmentQuestions, ""]);
  }
};
```

**Update description text**:
```typescript
// Line 486
<CardDescription>
  Add up to 10 questions for candidates  {/* Change from 5 to 10 */}
</CardDescription>
```

---

#### 3. Change Background or Logo

**Files**: Multiple pages use these assets

**Steps**:
1. Add new image to `src/assets/`
2. Update import in page files:

```typescript
// Example in src/pages/Index.tsx
import selectraBg from "@/assets/your-new-background.jpg";
import selectraLogo from "@/assets/your-new-logo.png";
```

**Pages using selectraBg**:
- `src/pages/Index.tsx`
- `src/pages/OrganizationLanding.tsx`
- `src/pages/AIInterview.tsx`

**Pages using selectraLogo**:
- All major pages

---

#### 4. Modify Job Posting Fields

**File**: `src/pages/OrganizationLanding.tsx`

**Location**: Step 2 (lines 314-477)

**Add new field** (e.g., "Remote Work Option"):
1. Add to interface (line 15-31)
2. Add to defaultValues
3. Add FormField in Step 2
4. Update `onSubmitPreAssessment` to include in insert (lines 153-170)

---

#### 5. Update Email Notification Message

**File**: `src/pages/CVUpload.tsx`

**Find the success message** and update the text about email invitations.

---

#### 6. Customize Color Theme

**File**: `src/index.css`

**Variables to modify**:
```css
:root {
  --primary: /* Main brand color */
  --secondary: /* Secondary color */
  --background: /* Background color */
  --foreground: /* Text color */
  /* ... more variables */
}
```

---

#### 7. Add/Remove Navigation Links

**File**: `src/App.tsx`

**Add new route**:
```typescript
<Route path="/new-page" element={<NewPageComponent />} />
```

**Navigation updates**: Update relevant page files with new links

---

### Database Changes

**When you need to add/modify database columns**:

1. **Run Migration**:
   Use Supabase migration tool through Lovable platform

2. **Update TypeScript Types**:
   Types auto-generate from `src/integrations/supabase/types.ts`

3. **Update Code**:
   Modify relevant page files to use new columns

---

## Important Notes

### Security Considerations
- All database tables have Row-Level Security (RLS) enabled
- Users can only access their own data
- Authentication required for protected routes

### State Management
- Uses React hooks (useState, useEffect)
- Supabase client for data fetching
- React Hook Form for form state

### Styling
- Tailwind CSS for utility classes
- CSS variables for theming (`index.css`)
- Responsive design built-in

---

## File Structure Summary

```
src/
├── pages/
│   ├── Index.tsx                    # Main landing
│   ├── OrganizationSignup.tsx       # Org signup
│   ├── OrganizationLogin.tsx        # Org login
│   ├── OrganizationLanding.tsx      # Org dashboard & job posting
│   ├── OrganizationDashboard.tsx    # Org applications view
│   ├── CandidateSignup.tsx          # Candidate signup
│   ├── CandidateLogin.tsx           # Candidate login
│   ├── CandidateLanding.tsx         # Candidate dashboard
│   ├── CVUpload.tsx                 # Application form
│   ├── AIInterview.tsx              # AI interview screen
│   ├── InterviewComplete.tsx        # Interview completion
│   └── NotFound.tsx                 # 404 page
├── components/
│   └── ui/                          # shadcn components
├── assets/
│   ├── selectra-logo.png
│   ├── selectra-bg.jpg
│   └── ai-avatar.png
├── integrations/
│   └── supabase/
│       ├── client.ts                # Supabase client
│       └── types.ts                 # Database types
├── App.tsx                          # Route configuration
├── main.tsx                         # App entry point
└── index.css                        # Global styles & theme
```

---

## Quick Reference Table

| Feature | File Location | Key Lines |
|---------|--------------|-----------|
| Organization Name Field | `src/pages/OrganizationLanding.tsx` | 244-257 |
| Legal Document Field | `src/pages/OrganizationLanding.tsx` | 259-270 |
| Website Link Field | `src/pages/OrganizationLanding.tsx` | 272-283 |
| Company Description | `src/pages/OrganizationLanding.tsx` | 285-298 |
| Pre-assessment Questions | `src/pages/OrganizationLanding.tsx` | 479-550 |
| Job Title Field | `src/pages/OrganizationLanding.tsx` | 329-342 |
| CV Upload | `src/pages/CVUpload.tsx` | Full file |
| AI Interview Screen | `src/pages/AIInterview.tsx` | Full file |
| Main Landing Hero | `src/pages/Index.tsx` | Full file |
| Theme Colors | `src/index.css` | :root variables |

---

## Support & Maintenance

### To modify this application:
1. Identify the feature/page from this documentation
2. Locate the file using the reference above
3. Find the relevant code section using line numbers
4. Make your changes
5. Test in the preview

### For database changes:
1. Plan your schema modification
2. Use migration tools
3. Update related code files
4. Test data flow

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**Platform**: SELECTRA - AI-Powered Recruitment
