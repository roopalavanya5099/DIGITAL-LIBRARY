# Digital Library

Simple full-stack starter for a digital library application.

Structure:

- `backend/` - Node.js + Express API with MongoDB (Mongoose)
- `frontend/` - placeholder for a frontend app (React/Vue/etc.)

Getting started (backend):

1. Copy `.env` values into `backend/.env` and set `MONGO_URI` and `JWT_SECRET`.
2. Install dependencies and start the server:

```bash
cd digital-library/backend
npm install
npm run dev
```

API endpoints are mounted in `server.js` under `/api/auth`, `/api/books`, and `/api/issues`.
