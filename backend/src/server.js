import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import { connectDB } from './config/db.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import './models/index.js'
import authRoutes from './routes/authRoutes.js'
import designRoutes from './routes/designRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'We Make Clothes marketplace API',
    status: 'ok',
  })
})

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/designs', designRoutes)

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`Marketplace API running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Server failed to start:', error.message)
    process.exit(1)
  }
}

startServer()
