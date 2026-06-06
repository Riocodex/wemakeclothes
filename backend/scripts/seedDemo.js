import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { connectDB } from '../src/config/db.js'
import { Design, Listing, User } from '../src/models/index.js'

dotenv.config()

const DEMO_EMAIL = (process.env.SEED_DEMO_EMAIL || 'demo@wemakeclothes.app').toLowerCase()
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'Demo12345!'
const DEMO_NAME = process.env.SEED_DEMO_NAME || 'Studio Demo'

const samplePreview = (label, color, accent) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
      <rect width="640" height="420" fill="${accent}"/>
      <path d="M225 94h54c14 26 68 26 82 0h54l74 55-50 78-34-18v132H235V209l-34 18-50-78 74-55z" fill="${color}"/>
      <path d="M270 142c28 18 72 18 100 0" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="14" stroke-linecap="round"/>
      <text x="320" y="382" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="800" fill="rgba(0,0,0,.62)">${label}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const SAMPLES = [
  {
    title: 'Sunrise Studio Tee',
    description: 'Warm everyday colorway with a clean front graphic.',
    price: 29,
    sceneTheme: 'light',
    catalogId: 'tshirt_short',
    type: 'tshirt',
    sleeve: 'short',
    colors: { body: '#EFBD48' },
    previewImageUrl: samplePreview('SUNRISE TEE', '#EFBD48', '#E7EEF4'),
  },
  {
    title: 'Night Runner Long Sleeve',
    description: 'Dark long-sleeve base made for bold logo artwork.',
    price: 42,
    sceneTheme: 'dark',
    catalogId: 'tshirt_long',
    type: 'tshirt',
    sleeve: 'long',
    colors: { body: '#232B36' },
    previewImageUrl: samplePreview('NIGHT RUNNER', '#232B36', '#C4D7D1'),
  },
  {
    title: 'Gallery Dress',
    description: 'Minimal dress concept with a soft gallery-ready palette.',
    price: 64,
    sceneTheme: 'light',
    catalogId: 'dress',
    type: 'dress',
    sleeve: 'short',
    colors: { body: '#7C9A92' },
    previewImageUrl: samplePreview('GALLERY DRESS', '#7C9A92', '#F1DED5'),
  },
]

const seed = async () => {
  await connectDB()

  if (!mongoose.connection.readyState) {
    throw new Error('MongoDB is not connected. Set MONGODB_URI before seeding.')
  }

  let seller = await User.findOne({ email: DEMO_EMAIL })
  if (!seller) {
    seller = await User.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash: DEMO_PASSWORD,
    })
    console.log(`Created demo seller: ${DEMO_EMAIL}`)
  } else {
    console.log(`Using existing demo seller: ${DEMO_EMAIL}`)
  }

  let created = 0
  for (const sample of SAMPLES) {
    const existingListing = await Listing.findOne({
      sellerId: seller.id,
      title: sample.title,
      status: 'active',
    })

    if (existingListing) {
      console.log(`Skipping existing listing: ${sample.title}`)
      continue
    }

    const design = await Design.create({
      ownerId: seller.id,
      title: sample.title,
      description: sample.description,
      catalogId: sample.catalogId,
      type: sample.type,
      sleeve: sample.sleeve,
      colors: sample.colors,
      textures: { logo: './me.jpg', full: './me.jpg' },
      layers: [],
      isLogoTexture: false,
      isFullTexture: false,
      sceneTheme: sample.sceneTheme,
      previewImageUrl: sample.previewImageUrl,
    })

    await Listing.create({
      sellerId: seller.id,
      designId: design.id,
      title: sample.title,
      description: sample.description,
      price: sample.price,
      currency: 'USD',
      previewImageUrl: sample.previewImageUrl,
      status: 'active',
    })

    created += 1
    console.log(`Seeded listing: ${sample.title}`)
  }

  console.log(`Seed complete. ${created} new listing(s).`)
  await mongoose.connection.close()
}

seed().catch((error) => {
  console.error('Seed failed:', error.message)
  process.exit(1)
})
