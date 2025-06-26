# zap.stream Admin UI

A React-based admin interface for managing users on the zap.stream platform.

## Features

- **Dark Modern Theme**: Professional dark UI with purple accent colors
- **User Management**: View, search, and manage users with pagination
- **Admin Actions**: Grant/revoke admin privileges, block/unblock users
- **Credit Management**: Add credits to user accounts with memo support
- **Stream Settings**: Manage default stream settings for users
- **NIP-98 Authentication**: Secure authentication using Nostr HTTP signatures

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd zap-admin
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env` file in the root directory:

```
REACT_APP_API_BASE_URL=https://api.zap.stream
```

### Running the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Authentication

The admin panel requires NIP-98 Nostr HTTP authentication. You need to:

1. Generate a valid NIP-98 authentication event
2. Base64 encode the event
3. Enter the token in the login form

Only users with admin privileges can access the panel.

## Components

### UserList

- Displays paginated list of users
- Search functionality by public key
- Sortable columns (ID, balance, created date)
- Status indicators for admin/blocked users

### UserManagementModal

- Edit user admin status and blocking
- Add credits with memo
- Update stream default settings
- Form validation and error handling

### AuthProvider

- Manages authentication state
- Stores auth token in localStorage
- Provides login/logout functionality

## API Integration

The application integrates with the zap.stream Admin API:

- `GET /api/v1/admin/users` - List users with pagination and search
- `POST /api/v1/admin/users/{id}` - Update user settings

All API calls include proper NIP-98 authentication headers.

## Building for Production

```bash
npm run build
```

This creates a `build` directory with optimized production files.

## Tech Stack

- React 18 with TypeScript
- Material-UI (MUI) for components and theming
- MUI X Data Grid for user table
- Axios for HTTP requests
- date-fns for date formatting

## Security

- All admin operations require proper authentication
- Input validation for all form fields
- Secure token storage in localStorage
- Error handling for failed operations
