# SkillBridge Backend API

Backend API for the SkillBridge tutoring platform built with Node.js, Express, and Prisma ORM connected to Neon PostgreSQL.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Neon PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
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

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database - Neon PostgreSQL
DATABASE_URL="your-neon-database-url"

# Neon MCP Server (Optional - for AI-assisted database management)
NEON_API_KEY="your-neon-api-key"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# Server
PORT=5000
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
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

Seed the database (optional):

```bash
npm run seed
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

## Neon MCP Server Integration

This project includes Neon MCP Server configuration for AI-assisted database management. This allows you to interact with your database using natural language through AI assistants like Claude Code.

### Setup

1. Get your Neon API key from the [Neon Console](https://console.neon.tech/app/settings/api-keys)
2. Add it to your `.env` file as `NEON_API_KEY`
3. The MCP configuration is already set up in [mcp.json](./mcp.json)

For detailed setup instructions and usage examples, see [MCP_SETUP.md](./MCP_SETUP.md).

## Project Structure

```
skillbridge-backend/
├── src/
│   └── index.ts          # Main application entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding script
├── mcp.json              # MCP server configuration
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── MCP_SETUP.md          # Neon MCP Server documentation
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

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test your changes thoroughly
4. Submit a pull request

## License

ISC
