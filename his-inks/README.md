# His Inks Studio

A premium tattoo studio management platform where clients can discover tattoo work, book appointments, pay deposits, communicate with the artist, and manage their tattoo journey.

---

## Technology Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Backend  | Node.js, Express, MongoDB (Mongoose), JWT, Cloudinary   |
| Web      | React, Vite, Tailwind CSS, React Router, Axios          |
| Mobile   | React Native, Expo, React Navigation, Axios             |
| Shared   | packages/ui (components), packages/utils (helpers)      |

---

## Folder Structure

```
his-inks/
├── apps/
│   ├── web/          # React + Vite web application
│   └── mobile/       # Expo React Native mobile app
├── server/           # Node.js + Express backend
├── packages/
│   ├── ui/           # Shared UI components
│   └── utils/        # Shared utility functions
├── docs/             # Documentation
├── package.json      # Root monorepo config (npm workspaces)
└── README.md
```

---

## Installation

From the project root:

```bash
# Install all workspace dependencies
npm install

# Install server dependencies separately (not a workspace)
cd server && npm install
```

---

## Running the Applications

### Backend

```bash
cd server
cp .env.example .env   # fill in your values
npm run dev
```

The API will be available at `http://localhost:5000`.
Health check: `GET http://localhost:5000/api/health`

### Web App

```bash
# From project root
npm run web

# Or from the web directory
cd apps/web
npm run dev
```

The web app will be available at `http://localhost:5173`.

### Mobile App

```bash
# From project root
npm run mobile

# Or from the mobile directory
cd apps/mobile
npm start
```

Scan the QR code with the Expo Go app on your device.

### Run Web + Backend Together

```bash
# From project root
npm run dev
```

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable               | Description                    |
| ---------------------- | ------------------------------ |
| `PORT`                 | Server port (default 5000)     |
| `MONGODB_URI`          | MongoDB connection string      |
| `JWT_SECRET`           | Secret for JWT signing         |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name          |
| `CLOUDINARY_API_KEY`   | Cloudinary API key             |
| `CLOUDINARY_API_SECRET`| Cloudinary API secret          |
| `MPESA_CONSUMER_KEY`   | M-Pesa consumer key            |
| `MPESA_CONSUMER_SECRET`| M-Pesa consumer secret         |
| `MPESA_PASSKEY`        | M-Pesa passkey                 |

---

## Development Status

This repository contains the project **foundation only**. Business features (auth, bookings, payments, portfolio, messaging) are not yet implemented.
