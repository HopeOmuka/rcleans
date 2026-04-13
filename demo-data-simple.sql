-- RCleans Demo Data - Simple Version
-- Run AFTER database-migration.sql

-- 1. Ensure service types exist
INSERT INTO service_types (id, name, description, base_price, price_per_hour, estimated_duration_hours, sort_order) VALUES
('home-cleaning', 'Home Cleaning', 'Regular home cleaning', 25.00, 15.00, 2.0, 1),
('office-cleaning', 'Office Cleaning', 'Commercial office cleaning', 50.00, 20.00, 3.0, 2),
('deep-cleaning', 'Deep Cleaning', 'Thorough deep cleaning', 75.00, 25.00, 4.0, 3),
('move-in-out', 'Move-in/Move-out', 'Move cleaning', 100.00, 30.00, 5.0, 4),
('post-construction', 'Post-Construction', 'Post construction cleanup', 150.00, 35.00, 6.0, 5)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert users
INSERT INTO users (id, name, email, clerk_id, phone, profile_image_url) VALUES
('user-001', 'John Doe', 'john@example.com', 'user_clerk_001', '+254712345678', 'https://i.pravatar.cc/150?img=1'),
('user-002', 'Sarah Johnson', 'sarah@example.com', 'user_clerk_002', '+254798765432', 'https://i.pravatar.cc/150?img=5');

-- 3. Insert cleaners
INSERT INTO cleaners (id, first_name, last_name, email, phone, profile_image_url, rating, total_ratings, specialties, location_lat, location_lng, is_available, completed_jobs, years_experience) VALUES
('cleaner-001', 'James', 'Wilson', 'james@rcleans.com', '+254701111111', 'https://i.pravatar.cc/150?img=11', 4.9, 127, ARRAY['home-cleaning'], -1.2921, 36.8219, true, 156, 5),
('cleaner-002', 'Mary', 'Kamau', 'mary@rcleans.com', '+254702222222', 'https://i.pravatar.cc/150?img=20', 4.8, 98, ARRAY['office-cleaning'], -1.2850, 36.8290, true, 98, 3),
('cleaner-003', 'David', 'Ochieng', 'david@rcleans.com', '+254703333333', 'https://i.pravatar.cc/150?img=12', 4.7, 76, ARRAY['deep-cleaning'], -1.3000, 36.8100, true, 76, 4);

-- 4. Insert services
INSERT INTO services (id, user_id, cleaner_id, service_type_id, location_address, location_lat, location_lng, scheduled_date, estimated_duration, status, total_price, payment_status) VALUES
('service-001', 'user-001', 'cleaner-001', 'home-cleaning', 'Kenyatta Avenue, Nairobi', -1.2921, 36.8219, NOW() + INTERVAL '2 hours', 2.0, 'in_progress', 65.00, 'paid'),
('service-002', 'user-002', 'cleaner-002', 'office-cleaning', 'Westlands, Nairobi', -1.2850, 36.8290, NOW() + INTERVAL '1 day', 3.0, 'matched', 120.00, 'paid'),
('service-003', 'user-001', NULL, 'deep-cleaning', 'Karen, Nairobi', -1.3100, 36.8000, NOW() + INTERVAL '3 days', 4.0, 'requested', 175.00, 'pending');

-- 5. Insert notifications
INSERT INTO notifications (id, user_id, cleaner_id, service_id, type, title, message, is_read) VALUES
('notif-001', 'user-001', 'cleaner-001', 'service-001', 'chat_message', 'New Message', 'Hello! I arrived at your location.', false),
('notif-002', 'user-002', 'cleaner-002', 'service-002', 'chat_message', 'New Message', 'Hi! See you tomorrow.', false),
('notif-003', 'user-001', NULL, 'service-003', 'service_request', 'New Request', 'Your cleaning request has been received.', false);

-- 6. Insert promo codes
INSERT INTO promo_codes (id, code, description, discount_type, discount_value, minimum_order_amount, is_active) VALUES
('promo-001', 'WELCOME20', '20% off', 'percentage', 20.00, 30.00, true),
('promo-002', 'SAVE50', '$50 off', 'fixed_amount', 50.00, 100.00, true);