# Crypto-Vault

A robust web-based Crypto Exchange Account Manager designed for secure and efficient cryptocurrency account management, with enhanced mobile responsiveness and modern UI design.

## Features

- Comprehensive account monitoring tools
- Flexible export capabilities
- Multiple user roles and exchanges support
- Detailed reports with granular filtering options
- Role-based access control

## Tech Stack

- TypeScript
- Node.js
- PostgreSQL database
- React Query for data fetching
- Tailwind CSS for responsive design
- Authentication with scrypt password hashing

## Deployment Instructions for Render

### 1. Create a PostgreSQL Database

1. In your Render dashboard, create a new PostgreSQL database instance
2. Copy the external connection string (DATABASE_URL)

### 2. Set Up Your Web Service

1. Connect your GitHub repository (Fxturbo4875/Crypto-vault)
2. Use the following settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`

### 3. Configure Environment Variables

Add the following environment variable:
- `DATABASE_URL`: (paste your PostgreSQL connection string from step 1)

### 4. Run Database Migration

After deployment, run the database migration by creating a one-time job:
- **Command**: `npm run db:push`
- **Environment Variables**: Same as your web service

## Local Development

1. Clone the repository
2. Create a `.env` file with your `DATABASE_URL`
3. Install dependencies: `npm install`
4. Push the database schema: `npm run db:push`
5. Start the development server: `npm run dev`

## License

MIT