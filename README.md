# Arthyaa - Society Management System

A comprehensive society management system with role-based authentication for different user types.

## Features

- **Role-based Authentication**: Admin, Society Admin, and Member roles
- **Member Login**: OTP-based authentication using Firebase
- **Admin/Staff Login**: Email and password authentication
- **Secretary Functionality**: Members can have secretary privileges
- **Modern UI**: Built with Next.js 15, Tailwind CSS, and TypeScript

## User Roles

1. **Admin (Developer)**: System administrator with full access
2. **Society Admin**: Manages individual society operations
3. **Member**: Society members with OTP-based login
   - Can be assigned secretary privileges via `isSecretary` field

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Firebase project for OTP authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arthyaa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/arthyaa_db"
   
   # JWT Secret
   JWT_SECRET="your-super-secret-jwt-key-here"
   
   # Firebase Configuration (Server-side)
   FIREBASE_PROJECT_ID="your-firebase-project-id"
   FIREBASE_PRIVATE_KEY="your-firebase-private-key"
   FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
   
   # Firebase Configuration (Client-side)
   NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # (Optional) Set up initial admin user
   node scripts/setup.js
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Firebase Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)

2. **Enable Phone Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Phone authentication
   - Add your domain to authorized domains

3. **Get Firebase configuration**:
   - Go to Project Settings > General
   - Copy the configuration values to your `.env.local`

4. **Set up reCAPTCHA**:
   - Firebase will automatically handle reCAPTCHA for phone authentication
   - No additional setup required

## Usage

### Login Pages

- **Member Login**: `/` - OTP-based authentication
- **Admin/Staff Login**: `/admin/login` - Email/password authentication
- **Setup**: `/setup` - Create initial admin account

### Default Admin Credentials

After running the setup script:
- **Email**: admin@arthyaa.com
- **Password**: admin123

⚠️ **Important**: Change the default password after first login!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/setup` - Create admin user

### Login Types

**Member Login (OTP)**:
```json
{
  "type": "otp-request",
  "phone": "+919876543210"
}
```

**Admin/Staff Login**:
```json
{
  "type": "email",
  "email": "admin@example.com",
  "password": "password",
  "role": "ADMIN"
}
```

## Database Schema

### User Model
- `id`: Unique identifier
- `email`: Email address (for admin/staff)
- `phone`: Phone number (for members)
- `password`: Hashed password (for admin/staff)
- `role`: User role (ADMIN, SOCIETY_ADMIN, MEMBER)
- `isSecretary`: Boolean flag for member secretary privileges
- `status`: User status (ACTIVE, INACTIVE, SUSPENDED)

### Society Model
- `id`: Unique identifier
- `name`: Society name
- `address`: Society address
- `city`, `state`, `pincode`: Location details

## Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── login/          # Login pages
│   ├── admin/          # Admin dashboard
│   ├── society-admin/  # Society admin dashboard
│   └── member/         # Member dashboard
├── lib/                # Utility libraries
│   ├── auth.ts         # Authentication logic
│   ├── firebase.ts     # Firebase OTP service
│   └── firebase-config.ts # Firebase configuration
└── generated/          # Prisma generated client
```

### Key Features

1. **Firebase OTP Integration**: Seamless phone number verification
2. **Role-based Access Control**: Different dashboards for different roles
3. **Secretary Functionality**: Members can have additional privileges
4. **Modern Authentication**: JWT tokens with secure cookies
5. **Responsive Design**: Mobile-friendly interface

## Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set up production environment variables**

3. **Deploy to your preferred platform** (Vercel, Netlify, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.