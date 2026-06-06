# Full-stack deployment guide

Deploy **We Make Clothes** with:

| Service | Host | Cost |
|---------|------|------|
| Frontend (React/Vite) | [Vercel](https://vercel.com) | Free |
| API (Express) | [Render](https://render.com) | Free tier |
| Database | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Free tier |

---

## Step 1 — MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → add a user with password.
3. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) for Render.
4. **Database** → **Connect** → **Drivers** → copy the connection string.
5. Replace `<password>` and set the database name, e.g.  
   `mongodb+srv://user:pass@cluster.mongodb.net/wemakeclothes`

---

## Step 2 — Deploy API on Render

1. Push this repo to GitHub.
2. [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
3. Connect the repo.
4. Settings:

   | Field | Value |
   |-------|-------|
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/health` |

5. **Environment variables:**

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | Long random string (32+ chars) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | Your Vercel URL (add after Step 3), e.g. `https://threejjs.vercel.app` |

6. Deploy and copy the API URL, e.g. `https://wemakeclothes-api.onrender.com`.

7. **Seed demo marketplace listings** (Render Shell or local with `MONGODB_URI` set):

   ```bash
   cd backend
   npm run seed
   ```

   Demo seller (for reference only): `demo@wemakeclothes.app` / `Demo12345!`

---

## Step 3 — Deploy frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import the GitHub repo.
2. `vercel.json` at the repo root sets build/output automatically.
3. **Environment variable:**

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

4. Deploy.

5. Copy your Vercel URL and add it to Render **`CLIENT_URL`** (comma-separate multiple origins if needed), then redeploy the API.

---

## Step 4 — Verify full stack

1. Open the Vercel URL → **Marketplace** → seeded listings should load from MongoDB.
2. **Account** → register a new user → login.
3. **Create Design** → customize → **Save Design**.
4. **My Designs** → **List on marketplace**.
5. Log out / use another account → **Buy** a listing → check **Purchases**.

---

## Environment summary

### Render (`backend`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-long-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-app.vercel.app
```

### Vercel (`client`)

```env
VITE_API_URL=https://your-api.onrender.com/api
VITE_DALLE_URL=https://wemakeclothes.onrender.com/api/v1/dalle
```

### Local full-stack dev

```bash
# terminal 1
cd backend && cp .env.example .env   # fill MONGODB_URI + JWT_SECRET
npm install && npm run dev

# terminal 2
cd client && cp .env.example .env
npm install && npm run dev
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Add exact Vercel URL to Render `CLIENT_URL` and redeploy API. `*.vercel.app` is also allowed automatically. |
| Login works, designs empty | Confirm `VITE_API_URL` ends with `/api` and you redeployed Vercel after setting it. |
| Empty marketplace | Run `npm run seed` in `backend` with `MONGODB_URI` set. |
| API sleeps (free tier) | First request after idle may take ~30s on Render free tier. |
| AI buttons fail | Optional — set `VITE_DALLE_URL` or deploy the `server/` DALL·E helper separately. |

---

## Optional — custom domain

- **Vercel:** Settings → Domains → add `clothes.yourdomain.com`
- **Render:** Settings → Custom Domain → add `api.yourdomain.com`
- Update `CLIENT_URL` and `VITE_API_URL` to match.
