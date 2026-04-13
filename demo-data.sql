-- =========================================
-- RCleans Demo Data
-- Run this AFTER the main migration
-- =========================================

-- =========================================
-- 0. ENSURE SERVICE TYPES EXIST
-- =========================================
INSERT INTO service_types (id, name, description, base_price, price_per_hour, estimated_duration_hours, sort_order) VALUES
('home-cleaning', 'Home Cleaning', 'Regular home cleaning services including dusting, vacuuming, and surface cleaning', 25.00, 15.00, 2.0, 1),
('office-cleaning', 'Office Cleaning', 'Commercial office cleaning for workspaces and common areas', 50.00, 20.00, 3.0, 2),
('deep-cleaning', 'Deep Cleaning', 'Thorough deep cleaning including appliances, baseboards, and detailed cleaning', 75.00, 25.00, 4.0, 3),
('move-in-out', 'Move-in/Move-out', 'Cleaning services for moving in or out of a property', 100.00, 30.00, 5.0, 4),
('post-construction', 'Post-Construction', 'Cleaning after construction or renovation work', 150.00, 35.00, 6.0, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_addons (name, description, price, estimated_duration_minutes, sort_order) VALUES
('Inside Fridge', 'Clean inside refrigerator', 15.00, 30, 1),
('Inside Oven', 'Clean inside oven', 25.00, 45, 2),
('Window Cleaning', 'Clean interior windows', 20.00, 30, 3),
('Carpet Shampoo', 'Deep clean carpets', 30.00, 60, 4),
('Laundry Service', 'Wash and fold laundry', 15.00, 45, 5)
ON CONFLICT DO NOTHING;

-- =========================================
-- 1. INSERT SAMPLE USERS (Customers)
-- =========================================
DELETE FROM service_ratings;
DELETE FROM service_addon_selections;
DELETE FROM notifications;
DELETE FROM services;
DELETE FROM saved_locations;
DELETE FROM users;

INSERT INTO users (id, name, email, clerk_id, phone, profile_image_url) VALUES
('user-001', 'John Doe', 'john@example.com', 'user_clerk_001', '+254712345678', 'https://i.pravatar.cc/150?img=1'),
('user-002', 'Sarah Johnson', 'sarah@example.com', 'user_clerk_002', '+254798765432', 'https://i.pravatar.cc/150?img=5'),
('user-003', 'Michael Brown', 'michael@example.com', 'user_clerk_003', '+254723456789', 'https://i.pravatar.cc/150?img=3'),
('user-004', 'Emily Davis', 'emily@example.com', 'user_clerk_004', '+254711223344', 'https://i.pravatar.cc/150?img=9');

-- =========================================
-- 2. INSERT SAMPLE CLEANERS
-- =========================================
DELETE FROM cleaner_availability;
DELETE FROM cleaners;

INSERT INTO cleaners (id, first_name, last_name, email, phone, profile_image_url, rating, total_ratings, specialties, location_lat, location_lng, is_available, completed_jobs, years_experience, bio, languages, background_check_status, insurance_status) VALUES
('cleaner-001', 'James', 'Wilson', 'james@rcleans.com', '+254701111111', 'https://i.pravatar.cc/150?img=11', 4.9, 127, ARRAY['home-cleaning', 'deep-cleaning'], -1.2921, 36.8219, true, 156, 5, 'Professional cleaner with 5 years experience.', ARRAY['English', 'Swahili'], 'approved', 'approved'),
('cleaner-002', 'Mary', 'Kamau', 'mary@rcleans.com', '+254702222222', 'https://i.pravatar.cc/150?img=20', 4.8, 98, ARRAY['home-cleaning', 'office-cleaning'], -1.2850, 36.8290, true, 98, 3, 'Detail-oriented cleaner.', ARRAY['English', 'Swahili'], 'approved', 'approved'),
('cleaner-003', 'David', 'Ochieng', 'david@rcleans.com', '+254703333333', 'https://i.pravatar.cc/150?img=12', 4.7, 76, ARRAY['office-cleaning', 'post-construction'], -1.3000, 36.8100, true, 76, 4, 'Expert in commercial spaces.', ARRAY['English', 'Swahili'], 'approved', 'approved'),
('cleaner-004', 'Grace', 'Njoroge', 'grace@rcleans.com', '+254704444444', 'https://i.pravatar.cc/150?img=25', 4.9, 203, ARRAY['home-cleaning', 'move-in-out', 'deep-cleaning'], -1.2780, 36.8350, true, 203, 7, 'Top-rated cleaner.', ARRAY['English', 'Swahili'], 'approved', 'approved'),
('cleaner-005', 'Peter', 'Kiprotich', 'peter@rcleans.com', '+254705555555', 'https://i.pravatar.cc/150?img=15', 4.6, 45, ARRAY['home-cleaning'], -1.3100, 36.8000, true, 45, 2, 'Friendly and efficient.', ARRAY['English', 'Swahili'], 'approved', 'approved'),
('cleaner-006', 'Ann', 'Wambui', 'ann@rcleans.com', '+254706666666', 'https://i.pravatar.cc/150?img=32', 4.8, 89, ARRAY['office-cleaning', 'home-cleaning'], -1.2880, 36.8450, true, 89, 4, 'Very organized.', ARRAY['English', 'Swahili'], 'approved', 'approved');

-- =========================================
-- 3. INSERT SAMPLE SAVED LOCATIONS
-- =========================================
INSERT INTO saved_locations (id, user_id, name, address, latitude, longitude, location_type, is_default) VALUES
('loc-001', 'user-001', 'Home', 'Kenyatta Avenue, Nairobi', -1.2921, 36.8219, 'home', true),
('loc-002', 'user-001', 'Office', 'Westlands Business Centre, Nairobi', -1.2850, 36.8290, 'work', false),
('loc-003', 'user-002', 'Home', 'Kilimani, Nairobi', -1.3000, 36.8100, 'home', true),
('loc-004', 'user-002', 'Gym', 'Fitness First, Riverside', -1.2780, 36.8350, 'other', false),
('loc-005', 'user-003', 'Home', 'Karen, Nairobi', -1.3100, 36.8000, 'home', true),
('loc-006', 'user-003', 'Work', 'Industrial Area, Nairobi', -1.2880, 36.8450, 'work', false);

-- =========================================
-- 4. INSERT SAMPLE SERVICES (Bookings)
-- =========================================
INSERT INTO services (id, user_id, cleaner_id, service_type_id, location_address, location_lat, location_lng, scheduled_date, estimated_duration, status, total_price, payment_status, created_at, started_at, completed_at) VALUES
('service-001', 'user-001', 'cleaner-001', 'home-cleaning', 'Kenyatta Avenue, Nairobi', -1.2921, 36.8219, NOW() + INTERVAL '2 hours', 2.0, 'in_progress', 65.00, 'paid', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', NULL),
('service-002', 'user-002', 'cleaner-002', 'office-cleaning', 'Westlands Business Centre, Nairobi', -1.2850, 36.8290, NOW() + INTERVAL '1 day', 3.0, 'matched', 120.00, 'paid', NOW() - INTERVAL '2 hours', NULL, NULL),
('service-003', 'user-003', 'cleaner-004', 'deep-cleaning', 'Karen, Nairobi', -1.3100, 36.8000, NOW() + INTERVAL '3 days', 4.0, 'requested', 175.00, 'pending', NOW(), NULL, NULL),
('service-004', 'user-001', 'cleaner-003', 'move-in-out', 'Kilimani, Nairobi', -1.3000, 36.8100, NOW() - INTERVAL '5 days', 5.0, 'completed', 250.00, 'paid', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days' - INTERVAL '2 hours', NOW() - INTERVAL '5 days'),
('service-005', 'user-004', 'cleaner-005', 'home-cleaning', 'Lavington, Nairobi', -1.2780, 36.8350, NOW() - INTERVAL '10 days', 2.0, 'completed', 65.00, 'paid', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days' - INTERVAL '1 hour', NOW() - INTERVAL '10 days');

-- =========================================
-- 5. INSERT SAMPLE NOTIFICATIONS (Including Chat Messages)
-- =========================================
INSERT INTO notifications (id, user_id, cleaner_id, service_id, type, title, message, is_read, created_at) VALUES
-- Service notifications
('notif-001', 'user-001', 'cleaner-001', 'service-001', 'service_started', 'Cleaner Started', 'Your cleaner has arrived and started the service.', false, NOW() - INTERVAL '30 minutes'),
('notif-002', 'user-002', 'cleaner-002', 'service-002', 'service_matched', 'Cleaner Assigned', 'Mary Kamau has been assigned to your office cleaning.', false, NOW() - INTERVAL '2 hours'),
('notif-003', 'user-001', NULL, 'service-004', 'service_completed', 'Service Completed', 'Your move-in/out cleaning has been completed.', true, NOW() - INTERVAL '5 days'),
-- Chat messages for service-001
('notif-004', 'user-001', 'cleaner-001', 'service-001', 'chat_message', 'New Message', 'Hello! I just arrived at your location.', false, NOW() - INTERVAL '45 minutes'),
('notif-005', 'user-001', 'cleaner-001', 'service-001', 'chat_message', 'New Message', 'Hi James! I will be there in 10 minutes.', false, NOW() - INTERVAL '40 minutes'),
('notif-006', 'user-001', 'cleaner-001', 'service-001', 'chat_message', 'New Message', 'Great! I will start preparing the area.', false, NOW() - INTERVAL '35 minutes'),
-- Chat messages for service-002
('notif-007', 'user-002', 'cleaner-002', 'service-002', 'chat_message', 'New Message', 'Hi Sarah! Looking forward to cleaning your office tomorrow.', false, NOW() - INTERVAL '1 hour'),
('notif-008', 'user-002', 'cleaner-002', 'service-002', 'chat_message', 'New Message', 'Great! Please bring extra supplies for the carpet.', false, NOW() - INTERVAL '30 minutes'),
('notif-009', 'user-002', 'cleaner-002', 'service-002', 'chat_message', 'New Message', 'Sure thing! I will bring everything we need.', false, NOW() - INTERVAL '15 minutes');

-- =========================================
-- 6. INSERT SAMPLE RATINGS
-- =========================================
INSERT INTO service_ratings (id, service_id, user_id, cleaner_id, rating, review_title, review_text, is_public) VALUES
('rating-001', 'service-004', 'user-001', 'cleaner-003', 5, 'Excellent Service!', 'Grace did an amazing job!', true),
('rating-002', 'service-005', 'user-004', 'cleaner-005', 4, 'Good Job', 'Would recommend!', true);

-- =========================================
-- 7. INSERT CLEANER AVAILABILITY
-- =========================================
INSERT INTO cleaner_availability (id, cleaner_id, day_of_week, start_time, end_time, is_available) VALUES
-- James Wilson (cleaner-001) - Mon-Sat
('avail-001', 'cleaner-001', 1, '08:00', '18:00', true),
('avail-002', 'cleaner-001', 2, '08:00', '18:00', true),
('avail-003', 'cleaner-001', 3, '08:00', '18:00', true),
('avail-004', 'cleaner-001', 4, '08:00', '18:00', true),
('avail-005', 'cleaner-001', 5, '08:00', '18:00', true),
('avail-006', 'cleaner-001', 6, '09:00', '14:00', true),
-- Mary Kamau (cleaner-002) - Mon-Fri
('avail-007', 'cleaner-002', 1, '07:00', '17:00', true),
('avail-008', 'cleaner-002', 2, '07:00', '17:00', true),
('avail-009', 'cleaner-002', 3, '07:00', '17:00', true),
('avail-010', 'cleaner-002', 4, '07:00', '17:00', true),
('avail-011', 'cleaner-002', 5, '07:00', '17:00', true),
-- Grace Njoroge (cleaner-004) - Every day
('avail-012', 'cleaner-004', 0, '08:00', '20:00', true),
('avail-013', 'cleaner-004', 1, '08:00', '20:00', true),
('avail-014', 'cleaner-004', 2, '08:00', '20:00', true),
('avail-015', 'cleaner-004', 3, '08:00', '20:00', true),
('avail-016', 'cleaner-004', 4, '08:00', '20:00', true),
('avail-017', 'cleaner-004', 5, '08:00', '20:00', true),
('avail-018', 'cleaner-004', 6, '08:00', '20:00', true);

-- =========================================
-- 8. INSERT PROMO CODES
-- =========================================
DELETE FROM promo_codes;
INSERT INTO promo_codes (id, code, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, valid_until, is_active) VALUES
('promo-001', 'WELCOME20', '20% off your first cleaning', 'percentage', 20.00, 30.00, 50.00, 1000, NOW() + INTERVAL '90 days', true),
('promo-002', 'SAVE50', '$50 off deep cleaning', 'fixed_amount', 50.00, 100.00, 50.00, 500, NOW() + INTERVAL '60 days', true),
('promo-003', 'FREE100', '$100 off for new users', 'fixed_amount', 100.00, 150.00, 100.00, 200, NOW() + INTERVAL '30 days', true);

-- =========================================
-- 9. VERIFY DATA
-- =========================================
SELECT 'Users: ' || COUNT(*) FROM users
UNION ALL SELECT 'Cleaners: ' || COUNT(*) FROM cleaners
UNION ALL SELECT 'Services: ' || COUNT(*) FROM services
UNION ALL SELECT 'Saved Locations: ' || COUNT(*) FROM saved_locations
UNION ALL SELECT 'Notifications: ' || COUNT(*) FROM notifications
UNION ALL SELECT 'Promo Codes: ' || COUNT(*) FROM promo_codes;