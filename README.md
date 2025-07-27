# CMS Application

A comprehensive Content Management System (CMS) for managing employees, sites, certifications, and checklists with role-based access control.

## 🏗️ Project Structure

```
CMS-application/
├── backend/                 # Express.js + TypeScript API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Express middlewares
│   │   ├── utils/          # Utility functions
│   │   ├── prisma/         # Database client
│   │   ├── config/         # Firebase configuration
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── services/      # API services
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # App entry point
│   └── package.json
└── README.md
```

## 🚀 Features

### 🔐 Authentication & Authorization
- **Firebase Authentication**: Secure user login and registration
- **Role-Based Access Control**: Multiple employee roles (Head Office, Supervisor, Foreman, HSE, Electrical)
- **Protected Routes**: Role-specific access to different features

### 🏢 Site Management
- **Site Creation & Management**: Create, edit, and manage construction sites
- **Employee Assignment**: Assign employees to specific sites
- **Site Details**: Comprehensive site information and employee lists
- **Location Tracking**: Site location management

### 👥 Employee Management
- **Employee Profiles**: Complete employee information with roles
- **Certification Management**: Advanced certification system with validity types
- **Role Assignment**: Assign specific roles to employees
- **Employee Dashboard**: Personalized dashboard for each employee

### 📋 Checklist System
- **PDF Checklist Upload**: Upload and manage checklist templates
- **Task Assignment**: Assign checklists to employees at specific sites
- **Status Tracking**: Track completion status of checklists
- **File Management**: Store and retrieve checklist files

### 📜 Certification System
- **Multiple Validity Types**: Lifetime, Fixed Years, and Custom Date certifications
- **Expiry Tracking**: Automatic expiry date calculation
- **Validity Statistics**: Visual representation of certification status
- **Bulk Operations**: Mass import and management of certifications

### 📊 Dashboard & Analytics
- **Main Dashboard**: Overview of all system metrics
- **Employee Dashboard**: Personalized employee activity and tasks
- **Site Dashboard**: Site-specific statistics and employee assignments
- **Real-time Updates**: Live data synchronization

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Firebase project (for authentication and file storage)
- npm or yarn

### Firebase Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)

2. **Enable Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication

3. **Set up Cloud Storage**:
   - Go to Storage > Rules
   - Configure rules for file uploads

4. **Download service account key**:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Save as `backend/firebase-service-account.json`

### Quick Setup (Recommended)

1. **Run the setup script** (Windows PowerShell):
   ```powershell
   .\setup-project.ps1
   ```

2. **Create environment file**:
   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"
   PORT=5000
   NODE_ENV=development
   FIREBASE_PROJECT_ID="your-firebase-project-id"
   FIREBASE_PRIVATE_KEY="your-private-key"
   FIREBASE_CLIENT_EMAIL="your-client-email"
   ```

3. **Set up database**:
   ```bash
   cd backend
   npm run db:generate
   npm run db:push
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"
   PORT=5000
   NODE_ENV=development
   FIREBASE_PROJECT_ID="your-firebase-project-id"
   FIREBASE_PRIVATE_KEY="your-private-key"
   FIREBASE_CLIENT_EMAIL="your-client-email"
   ```

4. **Set up database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   Update `src/firebase.ts` with your Firebase configuration

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 📁 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Employee Management
- `GET /api/employees` - Get all employees with certifications
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/activity` - Get employee activity

### Site Management
- `GET /api/sites` - Get all sites
- `POST /api/sites` - Create new site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site
- `POST /api/sites/:id/assign` - Assign employee to site
- `DELETE /api/sites/:id/assign/:employeeId` - Remove employee from site

### Certification Management
- `POST /api/certifications` - Add certification to employee
- `PUT /api/certifications/:id` - Update certification
- `DELETE /api/certifications/:id` - Delete certification

### Checklist Management
- `GET /api/checklists` - Get all checklists
- `POST /api/checklists` - Create new checklist
- `PUT /api/checklists/:id` - Update checklist
- `DELETE /api/checklists/:id` - Delete checklist
- `POST /api/checklists/upload` - Upload checklist PDF
- `GET /api/checklists/pdf` - Get available checklist PDFs

### File Upload
- `POST /api/upload` - Upload Excel file with employee data
- `POST /api/upload/checklist` - Upload checklist file

## 📊 Database Schema

### Employee Model
```prisma
model Employee {
  id              String          @id @default(uuid())
  name            String
  email           String          @unique
  role            Role
  firebaseUid     String          @unique
  certifications  Certification[]
  siteAssignments SiteEmployee[]
  checklists      Checklist[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}
```

### Certification Model
```prisma
model Certification {
  id           String       @id @default(uuid())
  employeeId   String
  name         String
  expiryDate   DateTime?
  validityType ValidityType @default(CUSTOM_DATE)
  validYears   Int?
  employee     Employee     @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}
```

### Site Model
```prisma
model Site {
  id         String         @id @default(uuid())
  name       String
  location   String
  employees  SiteEmployee[]
  checklists Checklist[]
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
}
```

### Checklist Model
```prisma
model Checklist {
  id          String          @id @default(uuid())
  siteId      String
  employeeId  String
  type        String
  status      ChecklistStatus @default(PENDING)
  completedAt DateTime?
  fileUrl     String?
  site        Site            @relation(fields: [siteId], references: [id])
  employee    Employee        @relation(fields: [employeeId], references: [id])
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

## 🎨 UI Components

### Authentication
- **Login/Register Forms**: Firebase authentication integration
- **Protected Routes**: Role-based access control
- **User Context**: Global user state management

### Site Management
- **SiteCard**: Individual site display with employee count
- **CreateSiteModal**: Add new sites with location
- **EditSiteModal**: Modify existing site information
- **SiteDetailsModal**: Comprehensive site information and employee management

### Employee Management
- **EmployeeLayout**: Employee-specific navigation
- **EmployeeDashboard**: Personalized employee dashboard with activity feed
- **EmployeeCard**: Employee information with certifications
- **EmployeeRoleModal**: Role assignment interface
- **EmployeeSidebar**: Employee-specific navigation menu

### Checklist System
- **EmployeeChecklists**: Available checklists for employees
- **EmployeeTasks**: Task management and completion tracking
- **BulkOperations**: Mass operations for checklists

### Dashboard Components
- **ValidityStatistics**: Certification expiry visualization
- **SearchBar**: Global search functionality
- **MainLayout**: Main application layout with navigation

## 🔧 Development

### Backend Development
- **TypeScript**: Full type safety
- **Prisma**: Type-safe database queries
- **Express**: RESTful API design
- **Firebase Admin**: Authentication and file storage
- **Multer**: File upload handling
- **XLSX**: Excel file processing

### Frontend Development
- **React 18**: Latest React features
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Firebase**: Authentication and real-time features
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing
- **Context API**: Global state management

## 📈 Key Features

### 🔐 Security
- Firebase Authentication
- Role-based access control
- Protected API endpoints
- Secure file uploads

### 📊 Analytics
- Real-time dashboard statistics
- Certification validity tracking
- Employee activity monitoring
- Site performance metrics

### 🔄 Workflow Management
- Site assignment workflow
- Checklist completion tracking
- Task management system
- Bulk operations support

### 📱 User Experience
- Responsive design
- Real-time updates
- Intuitive navigation
- Modern UI/UX

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 