# Site Management Frontend

A comprehensive React frontend for the CMS site management system, built with TypeScript, Tailwind CSS, and React Router.

## Features

- ✅ **Site Dashboard** - Overview of all sites with statistics
- ✅ **Site Creation** - Modal form for creating new sites
- ✅ **Site Cards** - Visual representation of sites with key metrics
- ✅ **Site Details Modal** - Comprehensive site management interface
- ✅ **Employee Assignment** - Assign and remove employees from sites
- ✅ **Checklist Management** - Create and track site-specific checklists
- ✅ **Status Updates** - Mark checklists as pending or completed
- ✅ **Responsive Design** - Works on desktop and mobile devices

## Components

### 1. SiteManagement (Page)
Main page component that displays:
- Site statistics dashboard
- Grid of site cards
- Create site functionality
- Site details modal integration

### 2. SiteCard
Individual site card component showing:
- Site name and location
- Employee count
- Pending and completed checklist counts
- Recent checklists preview
- Delete functionality

### 3. CreateSiteModal
Modal for creating new sites with:
- Site name input
- Location input
- Form validation
- Loading states
- Error handling

### 4. SiteDetailsModal
Comprehensive modal for site management with tabs:
- **Overview Tab**: Site statistics and information
- **Employees Tab**: View, assign, and remove employees
- **Checklists Tab**: Create and manage checklists

## API Integration

The frontend integrates with the backend API through the `siteAPI` object:

```typescript
// Site operations
siteAPI.getSites()
siteAPI.createSite(data)
siteAPI.getSiteById(id)
siteAPI.deleteSite(id)

// Employee operations
siteAPI.assignEmployee(siteId, employeeId)
siteAPI.removeEmployee(siteId, employeeId)

// Checklist operations
siteAPI.createChecklist(siteId, data)
siteAPI.getSiteChecklists(siteId)
siteAPI.updateChecklistStatus(checklistId, data)
```

## Data Types

### Site
```typescript
interface Site {
  id: string
  name: string
  location: string
  employees: SiteEmployee[]
  checklists: Checklist[]
  createdAt: string
  updatedAt: string
}
```

### SiteEmployee
```typescript
interface SiteEmployee {
  id: string
  siteId: string
  employeeId: string
  assignedAt: string
  employee: {
    id: string
    name: string
    email: string
    role: 'HEAD_OFFICE' | 'SUPERVISOR' | 'FOREMAN' | 'HSE' | 'ELECTRICAL'
  }
}
```

### Checklist
```typescript
interface Checklist {
  id: string
  siteId: string
  employeeId: string
  type: string
  status: 'PENDING' | 'COMPLETED'
  completedAt: string | null
  fileUrl: string | null
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    name: string
    email: string
    role: string
  }
}
```

## Usage

### Navigation
The site management page is accessible via the sidebar navigation at `/sites`.

### Creating a Site
1. Click the "Add Site" button
2. Fill in the site name and location
3. Click "Create Site"

### Managing Site Details
1. Click on any site card
2. Use the tabs to navigate between:
   - Overview: Site statistics
   - Employees: Assign/remove employees
   - Checklists: Create/manage checklists

### Assigning Employees
1. Open site details modal
2. Go to "Employees" tab
3. Click "Assign Employee"
4. Select an available employee
5. Click "Assign"

### Creating Checklists
1. Open site details modal
2. Go to "Checklists" tab
3. Click "Create Checklist"
4. Select an assigned employee
5. Enter checklist type
6. Click "Create"

## Styling

The components use Tailwind CSS for styling with:
- Responsive grid layouts
- Hover effects and transitions
- Color-coded status indicators
- Modal overlays
- Form styling

## Error Handling

- Form validation for required fields
- API error messages displayed to users
- Loading states during API calls
- Confirmation dialogs for destructive actions

## Future Enhancements

1. **File Upload** - Add file attachment support for checklists
2. **Real-time Updates** - WebSocket integration for live updates
3. **Advanced Filtering** - Filter sites by status, location, etc.
4. **Bulk Operations** - Bulk assign employees or create checklists
5. **Export Functionality** - Export site reports to PDF/Excel
6. **Mobile App** - React Native version for field workers

## Dependencies

- React 18+
- TypeScript
- React Router DOM
- Axios for API calls
- Tailwind CSS for styling

## Development

To run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Make sure the backend API is running on `http://localhost:5000` for full functionality. 