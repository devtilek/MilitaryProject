# Kassa Expense Tracker

Kassa is a responsive Expense Tracker CRUD application for the Industry Practice Project. It uses HTML, CSS and JavaScript on the frontend, Node.js and Express.js on the backend, and MongoDB with Mongoose for the database.

## Features

- User sign up and login
- JWT protected profile/dashboard
- Password hashing with bcrypt
- Transaction CRUD through `/resource`
- Search, type filtering, payment-method filtering and pagination
- Related MongoDB collections: users, categories, transactions and budgets
- Joi backend validation and custom frontend validation
- Global Express error handling
- Responsive design for desktop, tablet and mobile
- Light/dark mode
- Local storage for theme and recent filter preferences

## Install Node.js on Windows

1. Open [https://nodejs.org](https://nodejs.org).
2. Download the LTS version for Windows.
3. Run the installer with default options.
4. Open PowerShell and check:

```powershell
node -v
npm -v
```

## Setup

From the project root:

```powershell
cd outputs\expense-tracker
npm run setup
npm run setup-env
```

Edit `backend\.env`:

```env
PORT=5000
MONGO_URI=your_real_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5500
SERVE_FRONTEND=false
```

Start backend:

```powershell
npm run dev
```

Open `frontend/index.html` with VS Code Live Server or another static server on port `5500`.

## API Summary

Base URL: `http://localhost:5000`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/register` | No | Create user account |
| POST | `/login` | No | Log in and receive JWT |
| GET | `/profile` | Yes | Get user profile and financial stats |
| POST | `/resource` | Yes | Create transaction |
| GET | `/resource?search=food&type=expense&page=1&limit=10` | Yes | List transactions with search, filters and pagination |
| PUT | `/resource/:id` | Yes | Update transaction |
| DELETE | `/resource/:id` | Yes | Delete transaction |
| POST | `/categories` | Yes | Create income/expense category |
| GET | `/categories` | Yes | List categories |
| POST | `/budgets` | Yes | Create monthly budget |
| GET | `/budgets` | Yes | List budgets |

Protected requests require:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Deployment on Render

1. Create a MongoDB Atlas database and copy the connection string.
2. Push this project to GitHub.
3. Create a Render Web Service.
4. Set root directory to `backend`.
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=7d`
   - `SERVE_FRONTEND=true`
   - `CLIENT_URL=https://your-render-app.onrender.com`
8. Deploy and paste the public link into `REPORT.md`.


