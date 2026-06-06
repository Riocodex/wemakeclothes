# We Make Clothes

A 3D clothing design app built with **React**, **Three.js**, and **Vite**. Users can customize apparel in real time, save designs, and browse a marketplace UI.

## Features

- Drag-to-rotate 3D shirt customizer (color, logo, full print)
- Save designs locally (or to API when backend is connected)
- Marketplace with sample listings and 3D preview
- Responsive layout for mobile and desktop

## Run locally

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

### Optional API (MongoDB)

```bash
cd backend
cp .env.example .env   # add MONGODB_URI + JWT_SECRET
npm install
npm run dev
```

In `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

## Deploy full stack

See **[DEPLOY.md](./DEPLOY.md)** for the complete guide:

1. **MongoDB Atlas** — free database  
2. **Render** — Express API (`backend/`)  
3. **Vercel** — React app (`client/`) with `VITE_API_URL`  
4. **`npm run seed`** — demo marketplace listings  

Frontend-only demo (no env vars) still works locally with browser storage.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, React Three Fiber, Valtio, Tailwind |
| 3D | Three.js, drei, GLB models |
| Backend (optional) | Express, MongoDB, JWT |

## Repo structure

```
client/     React app (deploy this to Vercel)
backend/    Express API (optional)
server/     Legacy DALL·E helper (optional)
```
