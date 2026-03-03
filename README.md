# CFA Quiz

A comprehensive quiz application for CFA (Chartered Financial Analyst) exam preparation with tracking, streaks, and performance analytics.

## Features

- **User Authentication**: Login and registration
- **Quiz System**: 
  - Random quizzes
  - Subject-based quizzes (10 CFA subjects)
  - Level-based quizzes (Level 1, 2, 3)
  - Wrong answers review quiz
- **Results & Tracking**:
  - Quiz results with score
  - Wrong answers tracking
  - Performance analytics
  - Streak tracking (daily activity)
- **Reminders**: Schedule reminders for reviewing wrong answers
- **Performance Dashboard**: Track performance over time

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 15
- **Authentication**: JWT tokens

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts
- `subjects` - 10 CFA subjects
- `levels` - 3 CFA levels
- `questions` - Quiz questions
- `answers` - Answer options for questions
- `quiz_sessions` - Quiz attempts
- `quiz_answers` - User answers for each quiz
- `wrong_answers` - Tracking of incorrect answers
- `streaks` - Daily activity streaks
- `reminders` - Scheduled reminders
- `performance` - Performance tracking

## Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (optional)
- PostgreSQL 15+ (if not using Docker)

### Local Development

1. **Install dependencies**:
```bash
npm install
```

2. **Setup database**:
```bash
# Using Docker Compose (recommended)
docker compose up -d db

# Or use existing PostgreSQL instance
# Create database and run schema
psql -U postgres -d cfaquiz -f database/schema.sql
```

3. **Environment variables**:
Create a `.env.local` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cfaquiz
DB_USER=postgres
DB_PASSWORD=postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

4. **Run development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Docker Setup

1. **Start all services**:
```bash
docker compose up -d
```

2. **View logs**:
```bash
docker compose logs -f
```

3. **Stop services**:
```bash
docker compose down
```

## Project Structure

```
cfaquiz/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── quiz/          # Quiz endpoints
│   │   ├── wrong-answers/ # Wrong answers endpoints
│   │   ├── streak/        # Streak endpoints
│   │   ├── reminders/     # Reminders endpoints
│   │   └── performance/   # Performance endpoints
│   ├── dashboard/         # Dashboard page
│   ├── quiz/              # Quiz page
│   ├── results/           # Results page
│   ├── wrong-answers/     # Wrong answers page
│   └── performance/       # Performance page
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   └── ui/                # UI components
├── lib/                   # Utility libraries
│   ├── db.ts             # Database connection
│   ├── types.ts          # TypeScript types
│   ├── hooks/            # React hooks
│   └── utils/            # Utility functions
├── database/              # Database files
│   └── schema.sql        # Database schema
└── docker-compose.yml     # Docker configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Quiz
- `POST /api/quiz/create` - Create a new quiz session
- `POST /api/quiz/submit` - Submit quiz answers

### Wrong Answers
- `GET /api/wrong-answers` - Get wrong answers
- `POST /api/wrong-answers` - Mark answer as reviewed

### Streak
- `GET /api/streak` - Get user streak

### Reminders
- `GET /api/reminders` - Get pending reminders
- `POST /api/reminders` - Create reminders

### Performance
- `GET /api/performance` - Get performance data

### Subjects & Levels
- `GET /api/subjects` - Get all subjects
- `GET /api/levels` - Get all levels

## Development

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Notes

- The database schema includes 10 default CFA subjects and 3 levels
- Questions need to be added to the database for the quiz to work
- Authentication uses JWT tokens stored in localStorage
- Streaks are automatically updated when quizzes are completed
