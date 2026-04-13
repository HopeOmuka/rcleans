-- =========================================
-- RCleans Database Schema
-- On-Demand Cleaning Service Platform
-- =========================================

-- =========================================
-- 1. USERS TABLE
-- =========================================
-- Note: User authentication is handled by Clerk
-- This table stores additional user information
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk user ID
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    clerk_id TEXT NOT NULL UNIQUE,
    phone TEXT,
    profile_image_url TEXT,
    preferred_language TEXT DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 2. SERVICE TYPES TABLE
-- =========================================
-- Defines different types of cleaning services offered
CREATE TABLE IF NOT EXISTS service_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    price_per_hour DECIMAL(10,2) NOT NULL CHECK (price_per_hour >= 0),
    estimated_duration_hours DECIMAL(3,1) NOT NULL CHECK (estimated_duration_hours > 0),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 3. CLEANERS TABLE
-- =========================================
-- Professional cleaners who provide services
CREATE TABLE IF NOT EXISTS cleaners (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    profile_image_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_ratings INTEGER DEFAULT 0,
    specialties TEXT[] DEFAULT '{}', -- Array of service type IDs they specialize in
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    is_available BOOLEAN DEFAULT true,
    completed_jobs INTEGER DEFAULT 0,
    years_experience INTEGER DEFAULT 1 CHECK (years_experience >= 0),
    hourly_rate DECIMAL(8,2),
    bio TEXT,
    languages TEXT[] DEFAULT '{"English"}',
    background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
    insurance_status TEXT DEFAULT 'pending' CHECK (insurance_status IN ('pending', 'approved', 'rejected')),
    license_number TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    bank_account_details JSONB, -- Encrypted/stored securely
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 4. SERVICES TABLE
-- =========================================
-- Service bookings/requests
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cleaner_id TEXT REFERENCES cleaners(id) ON DELETE SET NULL,
    service_type_id TEXT NOT NULL REFERENCES service_types(id),
    location_address TEXT NOT NULL,
    location_lat DECIMAL(10,8) NOT NULL,
    location_lng DECIMAL(11,8) NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    estimated_duration DECIMAL(4,1) NOT NULL CHECK (estimated_duration > 0), -- in hours
    actual_duration DECIMAL(4,1), -- in hours (filled after completion)
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'matched', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'refunded')),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_method TEXT, -- 'card', 'wallet', etc.
    stripe_payment_intent_id TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    matched_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 5. SERVICE RATINGS TABLE
-- =========================================
-- Separate table for ratings and reviews
CREATE TABLE IF NOT EXISTS service_ratings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cleaner_id TEXT NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_title TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(service_id, user_id) -- One rating per service per user
);

-- =========================================
-- 6. CLEANER AVAILABILITY TABLE
-- =========================================
-- Cleaner working hours and availability
CREATE TABLE IF NOT EXISTS cleaner_availability (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cleaner_id TEXT NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (start_time < end_time),
    UNIQUE(cleaner_id, day_of_week)
);

-- =========================================
-- 7. SAVED LOCATIONS TABLE
-- =========================================
-- User's frequently used locations
CREATE TABLE IF NOT EXISTS saved_locations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Home', 'Work', 'Gym', etc.
    address TEXT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    location_type TEXT DEFAULT 'other' CHECK (location_type IN ('home', 'work', 'other')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- =========================================
-- 8. NOTIFICATIONS TABLE
-- =========================================
-- Push notifications and in-app messages
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    cleaner_id TEXT REFERENCES cleaners(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('service_request', 'service_matched', 'service_started', 'service_completed', 'payment_received', 'rating_received', 'system_message')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data for deep linking
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (user_id IS NOT NULL OR cleaner_id IS NOT NULL)
);

-- =========================================
-- 9. PROMO CODES TABLE
-- =========================================
-- Discount codes and promotions
CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    applicable_service_types TEXT[], -- NULL means all service types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 10. SERVICE ADD-ONS TABLE
-- =========================================
-- Additional services that can be added to bookings
CREATE TABLE IF NOT EXISTS service_addons (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL CHECK (price >= 0),
    estimated_duration_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 11. SERVICE ADD-ON SELECTIONS TABLE
-- =========================================
-- Links services to selected add-ons
CREATE TABLE IF NOT EXISTS service_addon_selections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    addon_id TEXT NOT NULL REFERENCES service_addons(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    price_at_time DECIMAL(8,2) NOT NULL, -- Store price at time of booking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(service_id, addon_id)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Cleaners indexes
CREATE INDEX IF NOT EXISTS idx_cleaners_available ON cleaners(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_cleaners_location ON cleaners(location_lat, location_lng) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_cleaners_rating ON cleaners(rating DESC);
CREATE INDEX IF NOT EXISTS idx_cleaners_specialties ON cleaners USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_cleaners_email ON cleaners(email);

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_cleaner_id ON services(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_scheduled_date ON services(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location_lat, location_lng);

-- Ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_service_id ON service_ratings(service_id);
CREATE INDEX IF NOT EXISTS idx_ratings_cleaner_id ON service_ratings(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON service_ratings(rating);

-- Availability indexes
CREATE INDEX IF NOT EXISTS idx_availability_cleaner_day ON cleaner_availability(cleaner_id, day_of_week);

-- Saved locations indexes
CREATE INDEX IF NOT EXISTS idx_saved_locations_user ON saved_locations(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_cleaner ON notifications(cleaner_id) WHERE cleaner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read) WHERE is_read = false;

-- =========================================
-- TRIGGERS FOR UPDATED_AT
-- =========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cleaners_updated_at BEFORE UPDATE ON cleaners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_types_updated_at BEFORE UPDATE ON service_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_ratings_updated_at BEFORE UPDATE ON service_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_locations_updated_at BEFORE UPDATE ON saved_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- SAMPLE DATA INSERTION
-- =========================================

-- Insert default service types
INSERT INTO service_types (id, name, description, base_price, price_per_hour, estimated_duration_hours, sort_order) VALUES
('home-cleaning', 'Home Cleaning', 'Regular home cleaning services including dusting, vacuuming, and surface cleaning', 25.00, 15.00, 2.0, 1),
('office-cleaning', 'Office Cleaning', 'Commercial office cleaning for workspaces and common areas', 50.00, 20.00, 3.0, 2),
('deep-cleaning', 'Deep Cleaning', 'Thorough deep cleaning including appliances, baseboards, and detailed cleaning', 75.00, 25.00, 4.0, 3),
('move-in-out', 'Move-in/Move-out', 'Cleaning services for moving in or out of a property', 100.00, 30.00, 5.0, 4),
('post-construction', 'Post-Construction', 'Cleaning after construction or renovation work', 150.00, 35.00, 6.0, 5)
ON CONFLICT (id) DO NOTHING;

-- Insert sample service add-ons
INSERT INTO service_addons (name, description, price, estimated_duration_minutes, sort_order) VALUES
('Inside Fridge', 'Clean inside refrigerator', 15.00, 30, 1),
('Inside Oven', 'Clean inside oven', 25.00, 45, 2),
('Window Cleaning', 'Clean interior windows', 20.00, 30, 3),
('Carpet Shampoo', 'Deep clean carpets', 30.00, 60, 4),
('Laundry Service', 'Wash and fold laundry', 15.00, 45, 5)
ON CONFLICT DO NOTHING;

-- =========================================
-- USEFUL VIEWS
-- =========================================

-- Cleaner earnings view
CREATE OR REPLACE VIEW cleaner_earnings AS
SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    COUNT(s.id) as total_services,
    COALESCE(SUM(s.total_price), 0) as total_earnings,
    AVG(sr.rating) as avg_rating,
    COUNT(sr.id) as total_ratings,
    c.completed_jobs,
    c.is_available
FROM cleaners c
LEFT JOIN services s ON c.id = s.cleaner_id AND s.status = 'completed'
LEFT JOIN service_ratings sr ON s.id = sr.service_id
GROUP BY c.id, c.first_name, c.last_name, c.email, c.completed_jobs, c.is_available;

-- Service statistics view
CREATE OR REPLACE VIEW service_statistics AS
SELECT
    COUNT(*) as total_services,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_services,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_services,
    COUNT(CASE WHEN status = 'requested' THEN 1 END) as pending_services,
    AVG(CASE WHEN status = 'completed' THEN total_price END) as avg_service_price,
    SUM(total_price) as total_revenue,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_completion_hours
FROM services;

-- =========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================
-- Note: Enable RLS if using Supabase or similar
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- etc.

-- Example RLS policies (uncomment and modify as needed):

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id);

-- Cleaners can only see their own data
CREATE POLICY "Cleaners can view own data" ON cleaners
    FOR SELECT USING (auth.uid()::text = id);

-- Users can view their own services
CREATE POLICY "Users can view own services" ON services
    FOR SELECT USING (auth.uid()::text = user_id);

-- Cleaners can view their assigned services
CREATE POLICY "Cleaners can view assigned services" ON services
    FOR SELECT USING (auth.uid()::text = cleaner_id);


-- =========================================
-- FUNCTIONS
-- =========================================

-- Function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
BEGIN
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2) * SIN(dlng/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- Function to update cleaner rating after new rating
CREATE OR REPLACE FUNCTION update_cleaner_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cleaners
    SET
        rating = (
            SELECT AVG(rating)
            FROM service_ratings
            WHERE cleaner_id = NEW.cleaner_id
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM service_ratings
            WHERE cleaner_id = NEW.cleaner_id
        )
    WHERE id = NEW.cleaner_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cleaner rating
CREATE TRIGGER update_cleaner_rating_trigger
    AFTER INSERT OR UPDATE ON service_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_cleaner_rating();

-- =========================================
-- DATA VALIDATION CONSTRAINTS
-- =========================================

-- Ensure scheduled_date is in the future
ALTER TABLE services ADD CONSTRAINT check_scheduled_date_future
    CHECK (scheduled_date IS NULL OR scheduled_date > NOW());

-- Ensure completed_at is after started_at
ALTER TABLE services ADD CONSTRAINT check_completion_after_start
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at > started_at);

-- =========================================
-- FINAL NOTES
-- =========================================
/*
This schema provides a complete foundation for the RCleans platform including:

1. User management and authentication (via Clerk)
2. Cleaner profiles and availability
3. Service types and add-ons
4. Service booking and tracking
5. Ratings and reviews system
6. Payment processing (Stripe integration)
7. Notifications system
8. Promo codes and discounts
9. Saved locations
10. Performance indexes and constraints

To use this schema:
1. Run this entire script in your Neon/PostgreSQL database
2. Update your application code to match the table structures
3. Test all CRUD operations
4. Add any additional business logic as needed

Remember to:
- Set up proper backup procedures
- Monitor performance and add indexes as needed
- Implement proper security measures
- Set up monitoring and alerting
*/