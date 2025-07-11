# CMS Application

A comprehensive Content Management System (CMS) for managing employees and their certifications.

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
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # App entry point
│   └── package.json
└── README.md
```

## 🚀 Features

### Frontend
- **Modern UI**: Built with React, TypeScript, and TailwindCSS
- **Responsive Design**: Mobile-friendly interface
- **Nested Navigation**: Employee Management with sub-tabs
- **Real-time Updates**: Live data synchronization with backend
- **CRUD Operations**: Full Create, Read, Update, Delete functionality

### Backend
- **RESTful API**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **File Upload**: Excel file processing with XLSX
- **Data Validation**: Comprehensive input validation
- **Error Handling**: Robust error handling and logging

## 📊 Dashboard Features

### Main Dashboard
- **KPI Cards**: Total employees, certifications, expiring soon, expired
- **Quick Actions**: Add employee, add certification, view reports
- **Recent Activity**: Latest system activities

### Employee Management
- **Employee Dashboard**: Overview statistics and file upload
- **Employee List**: View all employees with certification counts
- **Certifications List**: Detailed employee cards with certifications

## 👥 Employee Management

### Employee Dashboard Tab
- **Statistics Overview**: Real-time KPIs
- **File Upload**: Excel file import functionality
- **Data Visualization**: Charts and metrics

### Employee List Tab
- **Employee Table**: List all employees with certification counts
- **Add Employee**: Create new employees
- **Delete Employee**: Remove employees with confirmation

### Certifications List Tab
- **Employee Cards**: Individual employee cards
- **Certification Management**: Add, edit, delete certifications
- **Status Indicators**: Visual status for certification expiry
- **Inline Editing**: Edit certification details directly

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Backend Setup

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
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"
   PORT=5000
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

3. **Start development server**:
   ```bash
   npm run dev
   ```

## 📁 API Endpoints

### Employee Management
- `GET /api/employees` - Get all employees with certifications
- `POST /api/employees` - Create new employee
- `DELETE /api/employees/:id` - Delete employee

### Certification Management
- `POST /api/certifications` - Add certification to employee
- `PUT /api/certifications/:id` - Update certification
- `DELETE /api/certifications/:id` - Delete certification

### File Upload
- `POST /api/upload` - Upload Excel file with employee data

## 📊 Database Schema

### Employee Model
```prisma
model Employee {
  id             String          @id @default(uuid())
  name           String
  certifications Certification[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}
```

### Certification Model
```prisma
model Certification {
  id           String   @id @default(uuid())
  employeeId   String
  name         String
  expiryDate   DateTime
  employee     Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## 🎨 UI Components

### MainLayout
- **Sidebar Navigation**: Dashboard, Employee Management, Sites, Warehouse
- **Responsive Design**: Mobile-friendly layout
- **Active State**: Visual feedback for current page

### EmployeeNavbar
- **Nested Navigation**: Employee Dashboard, Employee List, Certifications List
- **Tab Switching**: Smooth transitions between tabs
- **Visual Indicators**: Active tab highlighting

### EmployeeCard
- **Employee Information**: Name and certification count
- **Certification List**: All certifications with expiry dates
- **Status Indicators**: Color-coded expiry status
- **CRUD Actions**: Add, edit, delete certifications
- **Inline Editing**: Edit certification details

## 🔧 Development

### Backend Development
- **TypeScript**: Full type safety
- **Prisma**: Type-safe database queries
- **Express**: RESTful API design
- **Multer**: File upload handling
- **XLSX**: Excel file processing

### Frontend Development
- **React 18**: Latest React features
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing

## 📈 Future Enhancements

- **Authentication**: User login and role-based access
- **Reporting**: Advanced analytics and reports
- **Notifications**: Email alerts for expiring certifications
- **Bulk Operations**: Mass import/export functionality
- **Audit Trail**: Track all changes and modifications
- **API Documentation**: Swagger/OpenAPI documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 