# SkillBridge Backend API

Backend API for the SkillBridge tutoring platform built with Node.js, Express, and Prisma ORM connected to Neon PostgreSQL.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Neon PostgreSQL
- **ORM**: Prisma
- **Type Safety**: TypeScript

## Prerequisites

- Node.js >= v18.0.0
- npm or yarn
- A Neon PostgreSQL account

## Getting Started

### 1. Install Dependencies

```bash
npm install
```
```

### 3. Database Setup

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```



Open Prisma Studio to view your data:

```bash
npm run prisma:studio
```

### 4. Start the Server

Development mode (with hot reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run seed` - Seed the database

## API Endpoints

### Health Check
- `GET /health` - Check API status

### Main API
- `GET /api` - API information and available endpoints

### Planned Endpoints

- `/api/auth` - Authentication (register, login, logout)
- `/api/tutors` - Tutor management
- `/api/bookings` - Session bookings
- `/api/reviews` - Tutor reviews
- `/api/categories` - Subject categories
- `/api/admin` - Admin operations

## Database Schema

The database includes the following models:

- **User** - User accounts (students, tutors, admins)
- **TutorProfile** - Extended profile for tutors
- **Category** - Subject categories
- **Booking** - Session bookings
- **Review** - Student reviews of tutors

See [prisma/schema.prisma](./prisma/schema.prisma) for detailed schema.


## Project Structure

```
skillbridge-backend/
├── src/
│   └── index.ts          # Main application entry point
├── prisma/
│   ├── schema.prisma     # Database schema
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Security

- JWT tokens are used for authentication
- Passwords are hashed using bcryptjs
- CORS is configured for the frontend URL
- Environment variables are used for sensitive data
- `.env` files are excluded from version control

## Development Notes

- The API uses TypeScript for type safety
- Prisma provides type-safe database access
- CORS is configured for local frontend development
- Error handling middleware is included
- Development server includes hot reload with tsx

## Database Management

### Neon PostgreSQL

This project uses Neon PostgreSQL as the database provider. Neon offers:
- Serverless Postgres with autoscaling
- Branching for development workflows
- Connection pooling
- Point-in-time restore
- Instant provisioning

### Migrations

Create a new migration:

```bash
npx prisma migrate dev --name description-of-changes
```

Apply migrations to production:

```bash
npx prisma migrate deploy
```

