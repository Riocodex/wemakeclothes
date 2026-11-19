import dotenv from 'dotenv'
import mongoose from 'mongoose'
import pg from 'pg'

import { randomUUID } from 'node:crypto'

import { createServiceClient } from '../src/config/supabase.js'
import { Design, Listing, Purchase, User } from '../src/models/index.js'

dotenv.config()

const REQUIRED_RUNTIME = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const REQUIRED_IMPORT = ['MONGODB_URI', 'DATABASE_URL', ...REQUIRED_RUNTIME]

const missing = (names) => names.filter((name) => !process.env[name])

const mongoId = (value) => {
  if (!value) return null
  if (typeof value === 'object' && value._id) return value._id.toString()
  return value.toString()
}

const asDate = (value) => (value ? new Date(value) : new Date())

const columnSet = async (client, schema, table) => {
  const { rows } = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2`,
    [schema, table]
  )
  return new Set(rows.map((row) => row.column_name))
}

const insertAuthUser = async (client, user, userId) => {
  const columns = await columnSet(client, 'auth', 'users')
  const values = {
    instance_id: '00000000-0000-0000-0000-000000000000',
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    encrypted_password: user.passwordHash,
    email_confirmed_at: asDate(user.createdAt),
    raw_app_meta_data: { provider: 'email', providers: ['email'] },
    raw_user_meta_data: { name: user.name, legacy_mongo_id: mongoId(user._id) },
    created_at: asDate(user.createdAt),
    updated_at: asDate(user.updatedAt),
    confirmation_token: '',
    recovery_token: '',
    email_change: '',
    email_change_token_new: '',
    email_change_token_current: '',
    phone_change: '',
    phone_change_token: '',
    reauthentication_token: '',
    is_sso_user: false,
    is_anonymous: false,
  }

  const insertColumns = Object.keys(values).filter((column) => columns.has(column))
  const insertValues = insertColumns.map((column) => values[column])
  const placeholders = insertColumns.map((_, index) => `$${index + 1}`)

  await client.query(
    `INSERT INTO auth.users (${insertColumns.join(', ')})
     VALUES (${placeholders.join(', ')})
     ON CONFLICT (id) DO NOTHING`,
    insertValues
  )

  const identityColumns = await columnSet(client, 'auth', 'identities')
  if (identityColumns.size === 0) return

  const identityValues = {
    id: userId,
    user_id: userId,
    provider_id: identityColumns.has('provider_id') ? user.email : userId,
    identity_data: { sub: userId, email: user.email },
    provider: 'email',
    last_sign_in_at: asDate(user.createdAt),
    created_at: asDate(user.createdAt),
    updated_at: asDate(user.updatedAt),
  }

  const identityInsertColumns = Object.keys(identityValues).filter((column) => identityColumns.has(column))
  const identityInsertValues = identityInsertColumns.map((column) => identityValues[column])
  const identityPlaceholders = identityInsertColumns.map((_, index) => `$${index + 1}`)

  await client.query(
    `INSERT INTO auth.identities (${identityInsertColumns.join(', ')})
     VALUES (${identityPlaceholders.join(', ')})
     ON CONFLICT DO NOTHING`,
    identityInsertValues
  )
}

const existingIdByMongo = async (supabase, table, legacyMongoId) => {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('legacy_mongo_id', legacyMongoId)
    .maybeSingle()

  if (error) throw error
  return data?.id || null
}

const importUsers = async ({ client, supabase, users }) => {
  const userMap = new Map()

  for (const user of users) {
    const legacyId = mongoId(user._id)
    let userId = await existingIdByMongo(supabase, 'profiles', legacyId)

    if (!userId) {
      const { rows } = await client.query('SELECT id FROM auth.users WHERE email = $1 LIMIT 1', [user.email])
      userId = rows[0]?.id || randomUUID()
      await insertAuthUser(client, user, userId)
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: user.name,
        email: user.email,
        avatar_url: user.avatarUrl || '',
        role: user.role || 'buyer',
        legacy_mongo_id: legacyId,
        created_at: asDate(user.createdAt).toISOString(),
        updated_at: asDate(user.updatedAt).toISOString(),
      })

    if (error) throw error
    userMap.set(legacyId, userId)
    console.log(`Imported user ${user.email}`)
  }

  return userMap
}

const importDesigns = async ({ supabase, designs, userMap }) => {
  const designMap = new Map()

  for (const design of designs) {
    const legacyId = mongoId(design._id)
    const ownerId = userMap.get(mongoId(design.ownerId))
    if (!ownerId) {
      throw new Error(`Missing owner for design ${legacyId}`)
    }

    let designId = await existingIdByMongo(supabase, 'designs', legacyId)
    const payload = {
      owner_id: ownerId,
      title: design.title,
      description: design.description || '',
      catalog_id: design.catalogId,
      type: design.type || 'tshirt',
      sleeve: design.sleeve || 'short',
      colors: design.colors || { body: '#EFBD48' },
      textures: design.textures || { logo: './me.jpg', full: './me.jpg' },
      layers: design.layers || [],
      is_logo_texture: design.isLogoTexture ?? true,
      is_full_texture: design.isFullTexture ?? false,
      scene_theme: design.sceneTheme || 'dark',
      preview_image_url: design.previewImageUrl || '',
      source_design_id: null,
      legacy_mongo_id: legacyId,
      created_at: asDate(design.createdAt).toISOString(),
      updated_at: asDate(design.updatedAt).toISOString(),
    }

    if (designId) {
      const { error } = await supabase.from('designs').update(payload).eq('id', designId)
      if (error) throw error
    } else {
      const { data, error } = await supabase.from('designs').insert(payload).select('id').single()
      if (error) throw error
      designId = data.id
    }

    designMap.set(legacyId, designId)
  }

  for (const design of designs) {
    const sourceMongoId = mongoId(design.sourceDesignId)
    if (!sourceMongoId) continue
    const sourceId = designMap.get(sourceMongoId)
    if (!sourceId) continue
    const { error } = await supabase
      .from('designs')
      .update({ source_design_id: sourceId })
      .eq('id', designMap.get(mongoId(design._id)))
    if (error) throw error
  }

  console.log(`Imported ${designMap.size} designs`)
  return designMap
}

const importListings = async ({ supabase, listings, userMap, designMap }) => {
  const listingMap = new Map()

  for (const listing of listings) {
    const legacyId = mongoId(listing._id)
    const sellerId = userMap.get(mongoId(listing.sellerId))
    const designId = designMap.get(mongoId(listing.designId)) || null
    if (!sellerId) {
      throw new Error(`Missing seller for listing ${legacyId}`)
    }

    let listingId = await existingIdByMongo(supabase, 'listings', legacyId)
    const payload = {
      seller_id: sellerId,
      design_id: designId,
      title: listing.title,
      description: listing.description || '',
      price: listing.price,
      currency: listing.currency || 'USD',
      status: listing.status || 'active',
      preview_image_url: listing.previewImageUrl || '',
      sold_at: listing.soldAt ? asDate(listing.soldAt).toISOString() : null,
      legacy_mongo_id: legacyId,
      created_at: asDate(listing.createdAt).toISOString(),
      updated_at: asDate(listing.updatedAt).toISOString(),
    }

    if (listingId) {
      const { error } = await supabase.from('listings').update(payload).eq('id', listingId)
      if (error) throw error
    } else {
      const { data, error } = await supabase.from('listings').insert(payload).select('id').single()
      if (error) throw error
      listingId = data.id
    }

    listingMap.set(legacyId, listingId)
  }

  console.log(`Imported ${listingMap.size} listings`)
  return listingMap
}

const importPurchases = async ({ supabase, purchases, userMap, designMap, listingMap }) => {
  let count = 0

  for (const purchase of purchases) {
    const legacyId = mongoId(purchase._id)
    const existing = await existingIdByMongo(supabase, 'purchases', legacyId)
    const payload = {
      buyer_id: userMap.get(mongoId(purchase.buyerId)),
      seller_id: userMap.get(mongoId(purchase.sellerId)),
      listing_id: listingMap.get(mongoId(purchase.listingId)),
      original_design_id: designMap.get(mongoId(purchase.originalDesignId)) || null,
      copied_design_id: designMap.get(mongoId(purchase.copiedDesignId)) || null,
      price: purchase.price,
      currency: purchase.currency || 'USD',
      payment_status: purchase.paymentStatus || 'paid',
      legacy_mongo_id: legacyId,
      created_at: asDate(purchase.createdAt).toISOString(),
      updated_at: asDate(purchase.updatedAt).toISOString(),
    }

    if (!payload.buyer_id || !payload.seller_id || !payload.listing_id) {
      throw new Error(`Missing purchase relations for ${legacyId}`)
    }

    if (existing) {
      const { error } = await supabase.from('purchases').update(payload).eq('id', existing)
      if (error) throw error
    } else {
      const { error } = await supabase.from('purchases').insert(payload)
      if (error) throw error
    }
    count += 1
  }

  console.log(`Imported ${count} purchases`)
}

const main = async () => {
  const unset = missing(REQUIRED_IMPORT)
  if (unset.length > 0) {
    console.error('Mongo import did not run. Missing environment variable names:')
    for (const name of unset) {
      console.error(`- ${name}`)
    }
    console.error('No MongoDB data was read or written. No Supabase rows were changed.')
    process.exit(1)
  }

  const supabase = createServiceClient()
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

  await mongoose.connect(process.env.MONGODB_URI)
  await client.connect()

  try {
    const users = await User.find().select('+passwordHash')
    const designs = await Design.find()
    const listings = await Listing.find()
    const purchases = await Purchase.find()

    console.log(
      `Read ${users.length} users, ${designs.length} designs, ${listings.length} listings, ${purchases.length} purchases from MongoDB (read-only).`
    )

    const userMap = await importUsers({ client, supabase, users })
    const designMap = await importDesigns({ supabase, designs, userMap })
    const listingMap = await importListings({ supabase, listings, userMap, designMap })
    await importPurchases({ supabase, purchases, userMap, designMap, listingMap })

    console.log('Import finished. MongoDB collections were not deleted or modified.')
  } finally {
    await client.end()
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('Import failed:', error.message)
  process.exit(1)
})
