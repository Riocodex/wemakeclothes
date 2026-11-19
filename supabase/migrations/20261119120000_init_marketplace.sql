-- We Make Clothes marketplace schema.
-- Maps Mongo users, designs, listings, and purchases onto Postgres + Supabase Auth.
-- HTTP JSON stays camelCase in the Express layer; columns are snake_case.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('buyer', 'seller', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.catalog_id AS ENUM (
    'tshirt_short',
    'tshirt_long',
    'shirt',
    'vest',
    'blouse',
    'dress',
    'bikini'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.scene_theme AS ENUM ('dark', 'light', 'neutral');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.currency_code AS ENUM ('USD', 'EUR', 'GBP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'removed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  email text NOT NULL UNIQUE CHECK (char_length(email) BETWEEN 1 AND 160),
  avatar_url text NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'buyer',
  legacy_mongo_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  catalog_id public.catalog_id NOT NULL DEFAULT 'tshirt_short',
  type text NOT NULL DEFAULT 'tshirt',
  sleeve text NOT NULL DEFAULT 'short',
  colors jsonb NOT NULL DEFAULT '{"body":"#EFBD48"}'::jsonb,
  textures jsonb NOT NULL DEFAULT '{"logo":"./me.jpg","full":"./me.jpg"}'::jsonb,
  layers jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_logo_texture boolean NOT NULL DEFAULT true,
  is_full_texture boolean NOT NULL DEFAULT false,
  scene_theme public.scene_theme NOT NULL DEFAULT 'dark',
  preview_image_url text NOT NULL DEFAULT '',
  source_design_id uuid REFERENCES public.designs (id) ON DELETE SET NULL,
  legacy_mongo_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  design_id uuid REFERENCES public.designs (id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  price numeric NOT NULL CHECK (price >= 1),
  currency public.currency_code NOT NULL DEFAULT 'USD',
  status public.listing_status NOT NULL DEFAULT 'active',
  preview_image_url text NOT NULL DEFAULT '',
  sold_at timestamptz,
  legacy_mongo_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  listing_id uuid NOT NULL UNIQUE REFERENCES public.listings (id) ON DELETE RESTRICT,
  original_design_id uuid REFERENCES public.designs (id) ON DELETE SET NULL,
  copied_design_id uuid REFERENCES public.designs (id) ON DELETE SET NULL,
  price numeric NOT NULL CHECK (price >= 1),
  currency public.currency_code NOT NULL DEFAULT 'USD',
  payment_status public.payment_status NOT NULL DEFAULT 'paid',
  legacy_mongo_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchases_not_self CHECK (buyer_id <> seller_id)
);

CREATE INDEX IF NOT EXISTS designs_owner_id_idx ON public.designs (owner_id);
CREATE INDEX IF NOT EXISTS designs_owner_created_at_idx ON public.designs (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS designs_source_design_id_idx ON public.designs (source_design_id);

CREATE INDEX IF NOT EXISTS listings_seller_id_idx ON public.listings (seller_id);
CREATE INDEX IF NOT EXISTS listings_design_id_idx ON public.listings (design_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON public.listings (status);
CREATE INDEX IF NOT EXISTS listings_status_created_at_idx ON public.listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_seller_status_idx ON public.listings (seller_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS listings_one_active_per_seller_design_idx
  ON public.listings (seller_id, design_id)
  WHERE status = 'active' AND design_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS purchases_buyer_id_idx ON public.purchases (buyer_id);
CREATE INDEX IF NOT EXISTS purchases_seller_id_idx ON public.purchases (seller_id);
CREATE INDEX IF NOT EXISTS purchases_buyer_created_at_idx ON public.purchases (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_seller_created_at_idx ON public.purchases (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_payment_status_idx ON public.purchases (payment_status);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS designs_set_updated_at ON public.designs;
CREATE TRIGGER designs_set_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS listings_set_updated_at ON public.listings;
CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS purchases_set_updated_at ON public.purchases;
CREATE TRIGGER purchases_set_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Role cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_role ON public.profiles;
CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    lower(NEW.email),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(NEW.email, '@', 1)
    ),
    'buyer',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Atomic purchase: copies the design to the buyer, writes one purchase, marks the listing sold.
CREATE OR REPLACE FUNCTION public.purchase_listing(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid := auth.uid();
  v_listing public.listings%ROWTYPE;
  v_design public.designs%ROWTYPE;
  v_copy public.designs%ROWTYPE;
  v_purchase public.purchases%ROWTYPE;
  v_seller public.profiles%ROWTYPE;
BEGIN
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Listing not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_listing.seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'You cannot buy your own listing' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.purchases WHERE listing_id = v_listing.id) THEN
    RAISE EXCEPTION 'Listing not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_design
  FROM public.designs
  WHERE id = v_listing.design_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing design not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.designs (
    owner_id,
    title,
    description,
    catalog_id,
    type,
    sleeve,
    colors,
    textures,
    layers,
    is_logo_texture,
    is_full_texture,
    scene_theme,
    preview_image_url,
    source_design_id
  ) VALUES (
    v_buyer_id,
    v_listing.title || ' purchase',
    v_design.description,
    v_design.catalog_id,
    v_design.type,
    v_design.sleeve,
    v_design.colors,
    v_design.textures,
    v_design.layers,
    v_design.is_logo_texture,
    v_design.is_full_texture,
    v_design.scene_theme,
    v_design.preview_image_url,
    v_design.id
  )
  RETURNING * INTO v_copy;

  INSERT INTO public.purchases (
    buyer_id,
    seller_id,
    listing_id,
    original_design_id,
    copied_design_id,
    price,
    currency,
    payment_status
  ) VALUES (
    v_buyer_id,
    v_listing.seller_id,
    v_listing.id,
    v_design.id,
    v_copy.id,
    v_listing.price,
    v_listing.currency,
    'paid'
  )
  RETURNING * INTO v_purchase;

  UPDATE public.listings
  SET status = 'sold',
      sold_at = now()
  WHERE id = v_listing.id
  RETURNING * INTO v_listing;

  SELECT * INTO v_seller
  FROM public.profiles
  WHERE id = v_listing.seller_id;

  RETURN jsonb_build_object(
    'purchase', to_jsonb(v_purchase),
    'copied_design', to_jsonb(v_copy),
    'listing', to_jsonb(v_listing),
    'seller', to_jsonb(v_seller)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_listing(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_listing(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_listing(uuid) TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS designs_select_own_or_listed ON public.designs;
CREATE POLICY designs_select_own_or_listed
  ON public.designs
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.listings
      WHERE listings.design_id = designs.id
        AND listings.status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM public.purchases
      WHERE purchases.copied_design_id = designs.id
        AND purchases.buyer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.purchases
      WHERE purchases.original_design_id = designs.id
        AND (
          purchases.buyer_id = auth.uid()
          OR purchases.seller_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS designs_insert_own ON public.designs;
CREATE POLICY designs_insert_own
  ON public.designs
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS designs_update_own ON public.designs;
CREATE POLICY designs_update_own
  ON public.designs
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS designs_delete_own ON public.designs;
CREATE POLICY designs_delete_own
  ON public.designs
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS listings_select_active_or_own ON public.listings;
CREATE POLICY listings_select_active_or_own
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.purchases
      WHERE purchases.listing_id = listings.id
        AND purchases.buyer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS listings_insert_own ON public.listings;
CREATE POLICY listings_insert_own
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.designs
      WHERE designs.id = listings.design_id
        AND designs.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS listings_update_own ON public.listings;
CREATE POLICY listings_update_own
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS listings_delete_own ON public.listings;
CREATE POLICY listings_delete_own
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS purchases_select_participants ON public.purchases;
CREATE POLICY purchases_select_participants
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.is_admin()
  );

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.designs FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.listings FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.purchases FROM PUBLIC, anon;

REVOKE ALL ON TABLE public.profiles FROM authenticated;
REVOKE ALL ON TABLE public.designs FROM authenticated;
REVOKE ALL ON TABLE public.listings FROM authenticated;
REVOKE ALL ON TABLE public.purchases FROM authenticated;

GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.designs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.listings TO authenticated;
GRANT SELECT ON TABLE public.purchases TO authenticated;

GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.designs TO service_role;
GRANT ALL ON TABLE public.listings TO service_role;
GRANT ALL ON TABLE public.purchases TO service_role;

COMMENT ON TABLE public.profiles IS 'Marketplace users. Passwords live in auth.users, never in this table or API responses.';
COMMENT ON TABLE public.designs IS 'Saved customizer designs. POST /api/designs inserts here only; it does not create listings or purchases.';
COMMENT ON TABLE public.listings IS 'Marketplace listings. A listing is purchased at most once (unique purchases.listing_id).';
COMMENT ON TABLE public.purchases IS 'Completed purchases. Direct INSERT is revoked; rows are created by purchase_listing().';
COMMENT ON FUNCTION public.purchase_listing(uuid) IS 'Authenticated buyers only. Rejects anon, own listings, and non-active listings. Copies the design to the buyer.';
