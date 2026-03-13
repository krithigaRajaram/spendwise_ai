# SpendWise AI

An intelligent personal finance tracker that automatically parses bank transaction emails using AI, categorizes expenses, and provides monthly spending reports.

---

## Features

- **AI-Powered Email Parsing** — Connects to Gmail and automatically extracts transactions from HDFC and Yes Bank alert emails using GPT-4o-mini
- **Smart Categorization** — Automatically categorizes transactions (Food, Travel, Shopping, Groceries, Subscription, Investment, Transfer)
- **Merchant Learning** — Maps merchants to categories so future transactions are auto-categorized
- **Manual Transactions** — Add, edit, and delete transactions manually
- **Monthly Reports** — Visual pie chart breakdown of expenses by category for any month
- **Multi-Bank Support** — HDFC Bank and Yes Bank (extensible to other banks)
- **Dark / Light Mode** — Theme toggle built into the UI
- **Responsive UI** — Works on desktop and mobile

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| PostgreSQL | Primary database |
| Prisma ORM | Database access and migrations |
| Redis + BullMQ | Background job queue for email processing |
| JWT | Authentication |
| Google Gmail API | OAuth2 Gmail integration |
| GitHub Models (GPT-4o-mini) | AI email parsing |

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | Frontend framework |
| React Router | Client-side routing |
| Tailwind CSS | Styling |
| shadcn/ui | UI component library |
| Recharts | Charts and data visualization |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerized local development |

---

## Project Structure

```
expense_tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   └── gmail/
│   │   ├── parsers/
│   │   │   ├── ai.parser.js
│   │   │   └── hdfc.parser.js
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── workers/
│   │       └── email.worker.js
│   └── .env.docker
├── frontend/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       └── services/
└── docker/
    └── docker-compose.yml
```

---

## Setup & Installation

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- A Google Cloud project with Gmail API enabled
- A GitHub account (for GitHub Models API access)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/expense_tracker.git
cd expense_tracker
```

### 2. Configure environment variables

Create `backend/.env.docker` with the following:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/expense_tracker
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/gmail/callback
FRONTEND_URL=http://localhost:5173
GITHUB_TOKEN=your_github_models_token
```

> See [Environment Variables](#environment-variables) section for details on obtaining each value.

### 3. Start the application

```bash
docker-compose -f docker/docker-compose.yml up --build -d
```

This starts 4 containers:
- `expense_api` — Express backend on port 3000
- `expense_worker` — BullMQ email processing worker
- `expense_postgres` — PostgreSQL on port 5433
- `expense_redis` — Redis on port 6379

### 4. Run database migrations

```bash
docker exec -it expense_api npx prisma db push
docker exec -it expense_api npx prisma generate
docker exec -it expense_worker npx prisma generate
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Environment Variables

| Variable | Description | How to obtain |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Pre-configured for Docker setup |
| `REDIS_HOST` | Redis hostname | Pre-configured for Docker setup |
| `JWT_SECRET` | Secret key for JWT signing | Any random string |
| `GMAIL_CLIENT_ID` | Google OAuth2 Client ID | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials |
| `GMAIL_CLIENT_SECRET` | Google OAuth2 Client Secret | Same as above |
| `GMAIL_REDIRECT_URI` | OAuth2 redirect URI | Set to `http://localhost:3000/gmail/callback` for local dev |
| `FRONTEND_URL` | Frontend base URL | `http://localhost:5173` for local dev |
| `GITHUB_TOKEN` | GitHub Models API token | [GitHub Settings](https://github.com/settings/tokens) → Personal Access Tokens |

### Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Gmail API**
4. Create OAuth2 credentials (Web application type)
5. Add `http://localhost:3000/gmail/callback` as an authorized redirect URI
6. Add your Gmail account as a test user under OAuth consent screen

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Login and receive JWT token |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/transactions` | Get all transactions (supports `?month=&year=`) |
| POST | `/transactions` | Create a manual transaction |
| PUT | `/transactions/:id` | Update a transaction category |
| DELETE | `/transactions/:id` | Delete a transaction |
| GET | `/transactions/summary` | Get income/expense summary (supports `?month=&year=`) |

### Gmail
| Method | Endpoint | Description |
|---|---|---|
| GET | `/gmail/auth` | Start Gmail OAuth flow |
| GET | `/gmail/callback` | OAuth2 callback (handled by Google redirect) |
| POST | `/gmail/fetch` | Trigger email fetch and processing |

---

## How It Works

1. User connects their Gmail account via OAuth2
2. Backend fetches bank alert emails from the last 1 month
3. Each email is queued in Redis via BullMQ
4. The worker processes each email — strips HTML, sends clean text to GPT-4o-mini
5. AI extracts: amount, type (INCOME/EXPENSE), merchant, category, date
6. Transaction is saved to PostgreSQL
7. If a merchant mapping exists, the saved category is overridden with the learned category

---

## Supported Banks

| Bank | Sender Domain |
|---|---|
| HDFC Bank | `alerts@hdfcbank.net`, `alerts@hdfcbank.bank.in` |
| Yes Bank | `alerts@yes.bank.in` |

> Adding support for a new bank requires updating `bankDetector.js` with the bank's sender domain.

---

## License

MIT
