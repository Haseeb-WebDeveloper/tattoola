# 🚨 **URGENT: Supabase Database Setup for Tattoola**

## **CRITICAL ERROR DETECTED** ❌

Your database is **MISSING ALL TABLES**! The TypeScript errors show that none of the required tables exist in your Supabase database.

## **IMMEDIATE ACTION REQUIRED** 🚨

**You MUST run these SQL commands in your Supabase Dashboard SQL Editor RIGHT NOW:**

## 1. **Create the Database Schema** (Copy & paste this EXACTLY)

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('ADMIN', 'ARTIST', 'TATTOO_LOVER');
CREATE TYPE admin_level AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR');
CREATE TYPE work_arrangement AS ENUM ('STUDIO_OWNER', 'STUDIO_EMPLOYEE', 'FREELANCE');
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO');

-- Create users table (matches your Prisma schema)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    avatar VARCHAR,
    bio TEXT,
    phone VARCHAR,
    country VARCHAR,
    province VARCHAR,
    municipality VARCHAR,
    instagram VARCHAR,
    tiktok VARCHAR,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    role user_role DEFAULT 'TATTOO_LOVER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create artist_profiles table
CREATE TABLE artist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    certificate_url VARCHAR,
    portfolio_complete BOOLEAN DEFAULT false,
    years_experience INTEGER,
    specialties TEXT[],
    business_name VARCHAR,
    studio_address VARCHAR,
    province VARCHAR,
    municipality VARCHAR,
    location VARCHAR,
    city VARCHAR,
    country VARCHAR,
    instagram VARCHAR,
    website VARCHAR,
    phone VARCHAR,
    work_arrangement work_arrangement,
    is_studio_owner BOOLEAN DEFAULT false,
    minimum_price DECIMAL,
    hourly_rate DECIMAL,
    cover_photo VARCHAR,
    cover_video VARCHAR,
    main_style_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tattoo_styles table
CREATE TABLE tattoo_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create provinces table
CREATE TABLE provinces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR UNIQUE NOT NULL,
    code VARCHAR UNIQUE,
    country VARCHAR DEFAULT 'Italy',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create municipalities table
CREATE TABLE municipalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    province_id UUID REFERENCES provinces(id) ON DELETE CASCADE,
    postal_code VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_favorite_styles table
CREATE TABLE user_favorite_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    style_id UUID REFERENCES tattoo_styles(id) ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    UNIQUE(user_id, style_id)
);
```

## 2. **Set Up Row Level Security (RLS)**

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tattoo_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_styles ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for artist_profiles
CREATE POLICY "Artists can insert their own profile" ON artist_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artists can view their own profile" ON artist_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Artists can update their own profile" ON artist_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read access to reference tables
CREATE POLICY "Anyone can view tattoo styles" ON tattoo_styles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view provinces" ON provinces
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view municipalities" ON municipalities
    FOR SELECT USING (is_active = true);

-- Create policies for user_favorite_styles
CREATE POLICY "Users can manage their favorite styles" ON user_favorite_styles
    FOR ALL USING (auth.uid() = user_id);
```

## 3. **Create Database Functions**

```sql
-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'TATTOO_LOVER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

## 4. **Insert Sample Data**

```sql
-- Insert some tattoo styles
INSERT INTO tattoo_styles (name, description, is_active) VALUES
('3D', '3D and realistic tattoos', true),
('Abstract', 'Abstract and artistic designs', true),
('Anime', 'Anime and manga inspired tattoos', true),
('Black & Grey', 'Black and grey tattoos', true),
('Blackwork', 'Bold black tattoos', true),
('Color', 'Colorful tattoos', true),
('Geometric', 'Geometric patterns and designs', true),
('Japanese', 'Traditional Japanese style', true),
('Minimalist', 'Simple and minimal designs', true),
('Neo Traditional', 'Modern take on traditional styles', true),
('New School', 'Cartoon-like and vibrant', true),
('Old School', 'Classic traditional tattoos', true),
('Portrait', 'Portrait and realistic faces', true),
('Realism', 'Photorealistic tattoos', true),
('Script', 'Text and lettering', true),
('Tribal', 'Tribal and cultural designs', true),
('Watercolor', 'Watercolor effect tattoos', true);

-- Insert Italian provinces (sample)
INSERT INTO provinces (name, code, country) VALUES
('Agrigento', 'AG', 'Italy'),
('Alessandria', 'AL', 'Italy'),
('Ancona', 'AN', 'Italy'),
('Aosta', 'AO', 'Italy'),
('Arezzo', 'AR', 'Italy'),
('Ascoli Piceno', 'AP', 'Italy'),
('Asti', 'AT', 'Italy'),
('Avellino', 'AV', 'Italy'),
('Bari', 'BA', 'Italy'),
('Barletta-Andria-Trani', 'BT', 'Italy'),
('Belluno', 'BL', 'Italy'),
('Benevento', 'BN', 'Italy'),
('Bergamo', 'BG', 'Italy'),
('Biella', 'BI', 'Italy'),
('Bologna', 'BO', 'Italy'),
('Bolzano', 'BZ', 'Italy'),
('Brescia', 'BS', 'Italy'),
('Brindisi', 'BR', 'Italy'),
('Cagliari', 'CA', 'Italy'),
('Caltanissetta', 'CL', 'Italy'),
('Campobasso', 'CB', 'Italy'),
('Caserta', 'CE', 'Italy'),
('Catania', 'CT', 'Italy'),
('Catanzaro', 'CZ', 'Italy'),
('Chieti', 'CH', 'Italy'),
('Como', 'CO', 'Italy'),
('Cosenza', 'CS', 'Italy'),
('Cremona', 'CR', 'Italy'),
('Crotone', 'KR', 'Italy'),
('Cuneo', 'CN', 'Italy'),
('Enna', 'EN', 'Italy'),
('Fermo', 'FM', 'Italy'),
('Ferrara', 'FE', 'Italy'),
('Firenze', 'FI', 'Italy'),
('Foggia', 'FG', 'Italy'),
('Forlì-Cesena', 'FC', 'Italy'),
('Frosinone', 'FR', 'Italy'),
('Genova', 'GE', 'Italy'),
('Gorizia', 'GO', 'Italy'),
('Grosseto', 'GR', 'Italy'),
('Imperia', 'IM', 'Italy'),
('Isernia', 'IS', 'Italy'),
('La Spezia', 'SP', 'Italy'),
('L''Aquila', 'AQ', 'Italy'),
('Latina', 'LT', 'Italy'),
('Lecce', 'LE', 'Italy'),
('Lecco', 'LC', 'Italy'),
('Livorno', 'LI', 'Italy'),
('Lodi', 'LO', 'Italy'),
('Lucca', 'LU', 'Italy'),
('Macerata', 'MC', 'Italy'),
('Mantova', 'MN', 'Italy'),
('Massa-Carrara', 'MS', 'Italy'),
('Matera', 'MT', 'Italy'),
('Messina', 'ME', 'Italy'),
('Milano', 'MI', 'Italy'),
('Modena', 'MO', 'Italy'),
('Monza e della Brianza', 'MB', 'Italy'),
('Napoli', 'NA', 'Italy'),
('Novara', 'NO', 'Italy'),
('Nuoro', 'NU', 'Italy'),
('Oristano', 'OR', 'Italy'),
('Padova', 'PD', 'Italy'),
('Palermo', 'PA', 'Italy'),
('Parma', 'PR', 'Italy'),
('Pavia', 'PV', 'Italy'),
('Perugia', 'PG', 'Italy'),
('Pesaro e Urbino', 'PU', 'Italy'),
('Pescara', 'PE', 'Italy'),
('Piacenza', 'PC', 'Italy'),
('Pisa', 'PI', 'Italy'),
('Pistoia', 'PT', 'Italy'),
('Pordenone', 'PN', 'Italy'),
('Potenza', 'PZ', 'Italy'),
('Prato', 'PO', 'Italy'),
('Ragusa', 'RG', 'Italy'),
('Ravenna', 'RA', 'Italy'),
('Reggio Calabria', 'RC', 'Italy'),
('Reggio Emilia', 'RE', 'Italy'),
('Rieti', 'RI', 'Italy'),
('Rimini', 'RN', 'Italy'),
('Roma', 'RM', 'Italy'),
('Rovigo', 'RO', 'Italy'),
('Salerno', 'SA', 'Italy'),
('Sassari', 'SS', 'Italy'),
('Savona', 'SV', 'Italy'),
('Siena', 'SI', 'Italy'),
('Siracusa', 'SR', 'Italy'),
('Sondrio', 'SO', 'Italy'),
('Sud Sardegna', 'SU', 'Italy'),
('Taranto', 'TA', 'Italy'),
('Teramo', 'TE', 'Italy'),
('Terni', 'TR', 'Italy'),
('Torino', 'TO', 'Italy'),
('Trapani', 'TP', 'Italy'),
('Trento', 'TN', 'Italy'),
('Treviso', 'TV', 'Italy'),
('Trieste', 'TS', 'Italy'),
('Udine', 'UD', 'Italy'),
('Varese', 'VA', 'Italy'),
('Venezia', 'VE', 'Italy'),
('Verbano-Cusio-Ossola', 'VB', 'Italy'),
('Vercelli', 'VC', 'Italy'),
('Verona', 'VR', 'Italy'),
('Vibo Valentia', 'VV', 'Italy'),
('Vicenza', 'VI', 'Italy'),
('Viterbo', 'VT', 'Italy');
```

## 5. **Environment Variables**

Make sure you have these in your `.env.local` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 6. **Test the Setup**

After running these SQL commands, try to register a user again. The database should now:

1. ✅ Allow user profile creation
2. ✅ Handle the UserRole enum properly
3. ✅ Create the proper relationships
4. ✅ Respect RLS policies

## 🚨 **Critical Steps to Take Now:**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the SQL commands above in order**
4. **Test user registration**

This should fix both the permission error and the UserRole reference error.
