# Axis Fire India - Lead Management System

React + Vite frontend, Node/Express API, Firebase Authentication and Firestore persistence.

## Setup

1. Create a Firebase project and enable **Email/Password Authentication** and **Cloud Firestore**.
2. Create a Firebase Web App and a Firebase Admin service account.
3. Copy `.env.example` to `.env`.
4. Fill the Firebase web values and either set `FIREBASE_SERVICE_ACCOUNT_JSON` or download the Admin SDK JSON to a local ignored path such as `secrets/firebase-admin.json` and set `FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-admin.json`.
5. Set `ADMIN_PASSWORD`, `HIMANI_PASSWORD`, `CHANDRA_PASSWORD`, and `VANSH_PASSWORD` in `.env`. The admin username defaults to `axisfireindia`.
6. Run `npm install` and then `npm run seed:firebase` once.
7. Start the app with `npm run dev` and open `http://localhost:5173`.

The seed command creates these Firebase Authentication accounts and matching Firestore `users` profiles:

- Admin: `axisfireindia`
- Employees: `himani`, `chandra`, `vansh`

Passwords are only read from `.env`, never sent to the browser or stored in Firestore. The browser signs in with Firebase Auth and sends the ID token to the Node API. The API verifies that token with Firebase Admin before every protected request. Employee lead queries are scoped by `assignedTo` on the server.

## Production

Build the React client with `npm run build`, set `NODE_ENV=production`, and run `npm start`. The Express server serves the generated `dist` folder. Deploy `firestore.rules` so direct client reads remain disabled; all data access goes through the role-checked Node API.

The current vertical slice includes authenticated role-aware dashboards, employee-only lead scoping, Firestore-backed lead updates and activity entries, batch queries, `.xlsx`/CSV parsing endpoint, and admin CSV export. The remaining operational modules should be added on the same API boundary rather than querying Firestore directly from React.
