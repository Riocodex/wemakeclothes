# We Make Clothes

A full-stack 3D clothing design app built with **React**, **Three.js**, and **Node.js**. Users can customize apparel in real time, save designs to the cloud, list them on a marketplace, and buy other users’ designs.

Good fit for a portfolio project — it combines 3D graphics, auth, and a real API + database.

---

## What this app does

| Feature | Description |
|---------|-------------|
| **3D customizer** | Drag to rotate the shirt, change color, upload logos, switch garment styles |
| **Save designs** | Logged-in users save designs to MongoDB (with canvas preview) |
| **My Designs** | View, edit, delete, and list your saved designs |
| **Marketplace** | Browse all listings; buy, sell, and manage purchases (login required for buy/sell) |
| **3D preview** | Open marketplace listings in a rotatable 3D viewer |

### Guest vs logged-in

| Action | Guest | Logged in |
|--------|-------|-----------|
| Customize clothing | Yes | Yes |
| Browse marketplace (Shop) | Yes | Yes |
| Save designs | No | Yes |
| My Designs | No | Yes |
| List / buy designs | No | Yes |

Logging in or out resets the canvas to the default design so one user’s work never carries over to another.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, React Three Fiber, drei, Valtio, Tailwind |
| 3D | Three.js, `shirt_baked.glb` |
| Backend | Express, JWT auth |
| Database | MongoDB (Mongoose) |

---

## Project structure

```
client/     React frontend (deploy to Vercel)
backend/    Express API + MongoDB (deploy to Render)
server/     Legacy DALL·E helper (optional, for AI image buttons)
```

---

## Run locally

### Frontend only (customize + browse; no cloud save)

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

### Full stack (auth, save, marketplace)

**Terminal 1 — API**

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

**Terminal 2 — Frontend**

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

**Optional — seed demo marketplace listings**

```bash
cd backend
npm run seed
```

---

## Deploy to the web

You need **three services** (Vercel does not deploy the backend for you):

| Piece | Host | Role |
|-------|------|------|
| Frontend | [Vercel](https://vercel.com) | Website users visit |
| API | [Render](https://render.com) | Login, designs, marketplace |
| Database | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Stores users, designs, listings |

### 1. Push to GitHub

```bash
git add .
git commit -m "Your message"
git push origin main
```

### 2. MongoDB Atlas

1. Create a free cluster.
2. Add a database user (username + password).
3. **Network Access** → allow `0.0.0.0/0` (needed for Render).
4. Copy the connection string, e.g.  
   `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/wemakeclothes`

### 3. Deploy API on Render

1. **New** → **Web Service** → connect your repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Environment variables:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Atlas connection string |
   | `JWT_SECRET` | Long random string (32+ characters) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | Your Vercel URL (add after step 4) |

4. Deploy, then in Render **Shell** run: `npm run seed` (demo listings).

### 4. Deploy frontend on Vercel

1. Import the GitHub repo on [vercel.com](https://vercel.com).
2. Root `vercel.json` sets build/output automatically.
3. Add environment variable:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

   Must end with `/api`.

4. Deploy and copy your live URL (e.g. `https://your-app.vercel.app`).

### 5. Connect frontend and backend

1. In Render, set `CLIENT_URL` to your Vercel URL.
2. Redeploy the API.

### 6. Verify

- Marketplace shows listings (after seed).
- Register / login works.
- Save a design → appears in My Designs.
- List for sale → appears in Marketplace Shop.

---

## Environment variables

**Render (`backend`)**

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-long-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-app.vercel.app
```

**Vercel (`client`)**

```env
VITE_API_URL=https://your-api.onrender.com/api
VITE_DALLE_URL=https://wemakeclothes.onrender.com/api/v1/dalle
```

(`VITE_DALLE_URL` is optional — only for AI logo buttons.)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Add your exact Vercel URL to Render `CLIENT_URL` and redeploy the API. |
| Login works, no designs | Ensure `VITE_API_URL` ends with `/api` and redeploy Vercel. |
| Empty marketplace | Run `npm run seed` in `backend` with `MONGODB_URI` set. |
| API slow on first load | Render free tier sleeps after idle; first request may take ~30s. |
| Shirt missing | Confirm `client/public/shirt_baked.glb` is in the repo and deployed. |

---

## Scripts (repo root)

```bash
npm run dev        # Start frontend dev server
npm run dev:api    # Start backend dev server
npm run build      # Production build (client)
npm run preview    # Preview production build locally
```
