import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const DEMO_USER_ID = "user_3HMXQSbPrR2fLWRBMjqc0XOowAh";

const DAYS_AGO = (n, h = 0) =>
  new Date(Date.now() - n * 86400000 - h * 3600000).toISOString();

const CLEANERS = [
  {
    id: "cleaner-001",
    first_name: "John",
    last_name: "Kamau",
    email: "john.kamau@rcleans.demo",
    phone: "+254701000001",
    rating: 4.8,
    total_ratings: 320,
    specialties: ["home-cleaning", "office-cleaning", "deep-cleaning"],
    lat: -1.264,
    lng: 36.804,
    completed_jobs: 320,
    years_experience: 6,
    hourly_rate: 20,
    bio: "Reliable and thorough home and office cleaner based in Westlands.",
    languages: ["English", "Swahili"],
    image: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: "cleaner-002",
    first_name: "Mary",
    last_name: "Wanjiku",
    email: "mary.wanjiku@rcleans.demo",
    phone: "+254701000002",
    rating: 4.9,
    total_ratings: 450,
    specialties: ["home-cleaning", "deep-cleaning", "move-in-out"],
    lat: -1.2878,
    lng: 36.789,
    completed_jobs: 450,
    years_experience: 8,
    hourly_rate: 22,
    bio: "Deep cleaning specialist with a keen eye for detail in Kilimani.",
    languages: ["English", "Swahili", "Kikuyu"],
    image: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "cleaner-003",
    first_name: "Peter",
    last_name: "Otieno",
    email: "peter.otieno@rcleans.demo",
    phone: "+254701000003",
    rating: 4.6,
    total_ratings: 210,
    specialties: ["post-construction", "deep-cleaning", "office-cleaning"],
    lat: -1.37,
    lng: 36.739,
    completed_jobs: 210,
    years_experience: 5,
    hourly_rate: 25,
    bio: "Post-construction and heavy-duty cleaning expert serving Lang'ata.",
    languages: ["English", "Swahili", "Dholuo"],
    image: "https://i.pravatar.cc/150?img=13",
  },
  {
    id: "cleaner-004",
    first_name: "Grace",
    last_name: "Achieng",
    email: "grace.achieng@rcleans.demo",
    phone: "+254701000004",
    rating: 4.7,
    total_ratings: 280,
    specialties: ["home-cleaning", "deep-cleaning"],
    lat: -1.318,
    lng: 36.718,
    completed_jobs: 280,
    years_experience: 4,
    hourly_rate: 24,
    bio: "Home cleaning specialist trusted by Karen families.",
    languages: ["English", "Swahili", "Dholuo"],
    image: "https://i.pravatar.cc/150?img=48",
  },
  {
    id: "cleaner-005",
    first_name: "David",
    last_name: "Mwangi",
    email: "david.mwangi@rcleans.demo",
    phone: "+254701000005",
    rating: 4.5,
    total_ratings: 190,
    specialties: ["office-cleaning", "home-cleaning", "post-construction"],
    lat: -1.206,
    lng: 36.826,
    completed_jobs: 190,
    years_experience: 7,
    hourly_rate: 26,
    bio: "Commercial office cleaning specialist covering Runda and Gigiri.",
    languages: ["English", "Swahili", "Kikuyu"],
    image: "https://i.pravatar.cc/150?img=14",
  },
  {
    id: "cleaner-006",
    first_name: "Faith",
    last_name: "Njeri",
    email: "faith.njeri@rcleans.demo",
    phone: "+254701000006",
    rating: 4.4,
    total_ratings: 150,
    specialties: ["home-cleaning", "office-cleaning"],
    lat: -1.22,
    lng: 36.894,
    completed_jobs: 150,
    years_experience: 3,
    hourly_rate: 18,
    bio: "Friendly and efficient cleaner serving Kasarani and Roysambu.",
    languages: ["English", "Swahili", "Kikuyu"],
    image: "https://i.pravatar.cc/150?img=49",
  },
  {
    id: "cleaner-007",
    first_name: "Samuel",
    last_name: "Kipchoge",
    email: "samuel.kipchoge@rcleans.demo",
    phone: "+254701000007",
    rating: 4.8,
    total_ratings: 350,
    specialties: ["deep-cleaning", "move-in-out"],
    lat: -1.304,
    lng: 36.83,
    completed_jobs: 350,
    years_experience: 9,
    hourly_rate: 21,
    bio: "Move-in/move-out and deep cleaning veteran in South B and South C.",
    languages: ["English", "Swahili", "Kalenjin"],
    image: "https://i.pravatar.cc/150?img=15",
  },
  {
    id: "cleaner-008",
    first_name: "Lucy",
    last_name: "Wairimu",
    email: "lucy.wairimu@rcleans.demo",
    phone: "+254701000008",
    rating: 4.3,
    total_ratings: 120,
    specialties: ["home-cleaning", "move-in-out"],
    lat: -1.328,
    lng: 36.917,
    completed_jobs: 120,
    years_experience: 2,
    hourly_rate: 17,
    bio: "Dependable home cleaner serving Embakasi and Pipeline.",
    languages: ["English", "Swahili"],
    image: "https://i.pravatar.cc/150?img=50",
  },
  {
    id: "cleaner-009",
    first_name: "Brian",
    last_name: "Omondi",
    email: "brian.omondi@rcleans.demo",
    phone: "+254701000009",
    rating: 4.6,
    total_ratings: 240,
    specialties: ["home-cleaning", "deep-cleaning", "office-cleaning"],
    lat: -1.456,
    lng: 36.984,
    completed_jobs: 240,
    years_experience: 5,
    hourly_rate: 19,
    bio: "Your trusted cleaner around Mavoko, Athi River and Syokimau.",
    languages: ["English", "Swahili", "Dholuo"],
    image: "https://i.pravatar.cc/150?img=16",
  },
  {
    id: "cleaner-010",
    first_name: "Esther",
    last_name: "Chebet",
    email: "esther.chebet@rcleans.demo",
    phone: "+254701000010",
    rating: 4.9,
    total_ratings: 380,
    specialties: ["home-cleaning", "deep-cleaning", "office-cleaning"],
    lat: -1.273,
    lng: 36.774,
    completed_jobs: 380,
    years_experience: 6,
    hourly_rate: 23,
    bio: "Top-rated cleaner in Lavington and Kileleshwa.",
    languages: ["English", "Swahili", "Kalenjin"],
    image: "https://i.pravatar.cc/150?img=51",
  },
  {
    id: "cleaner-011",
    first_name: "Kevin",
    last_name: "Mutua",
    email: "kevin.mutua@rcleans.demo",
    phone: "+254701000011",
    rating: 4.2,
    total_ratings: 90,
    specialties: ["office-cleaning", "home-cleaning"],
    lat: -1.2921,
    lng: 36.8219,
    completed_jobs: 90,
    years_experience: 2,
    hourly_rate: 16,
    bio: "Quick and flexible cleaner right in the Nairobi CBD.",
    languages: ["English", "Swahili", "Kamba"],
    image: "https://i.pravatar.cc/150?img=17",
  },
];

const PROMOS = [
  {
    code: "WELCOME20",
    description: "20% off your first booking (up to $50)",
    discount_type: "percentage",
    discount_value: 20,
    minimum_order_amount: 25,
    maximum_discount_amount: 50,
    usage_limit: 500,
    applicable_service_types: null,
  },
  {
    code: "CLEAN10",
    description: "10% off any service over $40",
    discount_type: "percentage",
    discount_value: 10,
    minimum_order_amount: 40,
    maximum_discount_amount: null,
    usage_limit: 1000,
    applicable_service_types: null,
  },
  {
    code: "DEEP15",
    description: "15% off deep cleaning",
    discount_type: "percentage",
    discount_value: 15,
    minimum_order_amount: 75,
    maximum_discount_amount: null,
    usage_limit: 300,
    applicable_service_types: ["deep-cleaning"],
  },
  {
    code: "OFFICE10",
    description: "10% off office cleaning",
    discount_type: "percentage",
    discount_value: 10,
    minimum_order_amount: 50,
    maximum_discount_amount: null,
    usage_limit: 300,
    applicable_service_types: ["office-cleaning"],
  },
  {
    code: "NEWUSER5",
    description: "$5 off your first order",
    discount_type: "fixed_amount",
    discount_value: 5,
    minimum_order_amount: 20,
    maximum_discount_amount: null,
    usage_limit: 500,
    applicable_service_types: null,
  },
];

const SAVED_LOCATIONS = [
  {
    name: "Home",
    address: "Mavoko Park, Athi River, Machakos County, Kenya",
    lat: -1.4563,
    lng: 36.9841,
    location_type: "home",
    is_default: true,
  },
  {
    name: "Work",
    address: "Westlands, Nairobi, Kenya",
    lat: -1.264,
    lng: 36.804,
    location_type: "work",
    is_default: false,
  },
  {
    name: "Gym",
    address: "Kilimani, Nairobi, Kenya",
    lat: -1.2878,
    lng: 36.789,
    location_type: "other",
    is_default: false,
  },
];

const SERVICES = [
  {
    id: "demo-svc-001",
    cleaner_id: "cleaner-002",
    service_type_id: "deep-cleaning",
    location_address: "Lavington, Nairobi, Kenya",
    lat: -1.273,
    lng: 36.774,
    estimated_duration: 4.0,
    total_price: 100.0,
    status: "completed",
    payment_status: "paid",
    rating: 5,
    review: "Mary did an incredible deep clean of our apartment. Spotless!",
    created_at: DAYS_AGO(20, 3),
    started_at: DAYS_AGO(20, 2),
    completed_at: DAYS_AGO(20),
  },
  {
    id: "demo-svc-002",
    cleaner_id: "cleaner-001",
    service_type_id: "home-cleaning",
    location_address: "Westlands, Nairobi, Kenya",
    lat: -1.264,
    lng: 36.804,
    estimated_duration: 2.0,
    total_price: 30.0,
    status: "completed",
    payment_status: "paid",
    rating: 4,
    review: "Great job, John was punctual and thorough.",
    created_at: DAYS_AGO(12, 3),
    started_at: DAYS_AGO(12, 2),
    completed_at: DAYS_AGO(12),
  },
  {
    id: "demo-svc-003",
    cleaner_id: "cleaner-005",
    service_type_id: "office-cleaning",
    location_address: "Nairobi CBD, Kenya",
    lat: -1.2921,
    lng: 36.8219,
    estimated_duration: 3.0,
    total_price: 60.0,
    status: "completed",
    payment_status: "paid",
    rating: 5,
    review: "Our office has never looked better. Highly recommended.",
    created_at: DAYS_AGO(5, 3),
    started_at: DAYS_AGO(5, 2),
    completed_at: DAYS_AGO(5),
  },
  {
    id: "demo-svc-004",
    cleaner_id: "cleaner-007",
    service_type_id: "move-in-out",
    location_address: "Kilimani, Nairobi, Kenya",
    lat: -1.2878,
    lng: 36.789,
    estimated_duration: 5.0,
    total_price: 150.0,
    status: "cancelled",
    payment_status: "pending",
    rating: null,
    review: null,
    created_at: DAYS_AGO(2, 5),
    cancelled_at: DAYS_AGO(2, 4),
    cancellation_reason: "Client changed plans",
  },
];

const RATINGS = [
  {
    service_id: "demo-svc-001",
    cleaner_id: "cleaner-002",
    rating: 5,
    review_text: "Mary did an incredible deep clean of our apartment. Spotless!",
    review_title: "Amazing deep clean",
    created_at: DAYS_AGO(19),
  },
  {
    service_id: "demo-svc-002",
    cleaner_id: "cleaner-001",
    rating: 4,
    review_text: "Great job, John was punctual and thorough.",
    review_title: "Punctual and thorough",
    created_at: DAYS_AGO(11),
  },
  {
    service_id: "demo-svc-003",
    cleaner_id: "cleaner-005",
    rating: 5,
    review_text: "Our office has never looked better. Highly recommended.",
    review_title: "Best office cleaning",
    created_at: DAYS_AGO(4),
  },
];

const NOTIFICATIONS = [
  {
    id: "notif-001",
    user_id: DEMO_USER_ID,
    service_id: "demo-svc-003",
    type: "service_completed",
    title: "Service completed",
    message: "Your office cleaning by David Mwangi has been completed.",
    created_at: DAYS_AGO(5),
  },
  {
    id: "notif-002",
    user_id: DEMO_USER_ID,
    service_id: "demo-svc-001",
    type: "rating_received",
    title: "Thanks for your review",
    message: "You rated your deep cleaning service 5 stars. Thank you!",
    created_at: DAYS_AGO(19),
  },
];

async function seedCleaners() {
  let inserted = 0;
  for (const c of CLEANERS) {
    const res = await sql`
      INSERT INTO cleaners (
        id, first_name, last_name, email, phone, profile_image_url,
        rating, total_ratings, specialties, location_lat, location_lng,
        is_available, completed_jobs, years_experience, hourly_rate, bio,
        languages, background_check_status, insurance_status
      ) VALUES (
        ${c.id}, ${c.first_name}, ${c.last_name}, ${c.email}, ${c.phone},
        ${c.image}, ${c.rating}, ${c.total_ratings}, ${c.specialties},
        ${c.lat}, ${c.lng}, true, ${c.completed_jobs}, ${c.years_experience},
        ${c.hourly_rate}, ${c.bio}, ${c.languages},
        'approved', 'approved'
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;
    inserted += res.length;
  }
  console.log(`cleaners: ${inserted} inserted (${CLEANERS.length - inserted} existing)`);

  for (const c of CLEANERS) {
    for (let dow = 0; dow <= 6; dow++) {
      const off = c.id === "cleaner-003" && dow === 0;
      const off2 = c.id === "cleaner-008" && dow === 0;
      await sql`
        INSERT INTO cleaner_availability (cleaner_id, day_of_week, start_time, end_time, is_available)
        VALUES (${c.id}, ${dow}, '08:00', '18:00', ${!off && !off2})
        ON CONFLICT (cleaner_id, day_of_week) DO NOTHING;
      `;
    }
  }
  console.log(`cleaner_availability: ${CLEANERS.length * 7} rows ensured`);
}

async function seedPromos() {
  let inserted = 0;
  for (const p of PROMOS) {
    const res = await sql`
      INSERT INTO promo_codes (
        code, description, discount_type, discount_value,
        minimum_order_amount, maximum_discount_amount,
        usage_limit, applicable_service_types,
        valid_from, valid_until
      ) VALUES (
        ${p.code}, ${p.description}, ${p.discount_type}, ${p.discount_value},
        ${p.minimum_order_amount}, ${p.maximum_discount_amount},
        ${p.usage_limit}, ${p.applicable_service_types},
        NOW(), NOW() + INTERVAL '1 year'
      )
      ON CONFLICT (code) DO NOTHING
      RETURNING code;
    `;
    inserted += res.length;
  }
  console.log(`promo_codes: ${inserted} inserted (${PROMOS.length - inserted} existing)`);
}

async function seedSavedLocations() {
  let inserted = 0;
  for (const l of SAVED_LOCATIONS) {
    const res = await sql`
      INSERT INTO saved_locations (user_id, name, address, latitude, longitude, location_type, is_default)
      VALUES (${DEMO_USER_ID}, ${l.name}, ${l.address}, ${l.lat}, ${l.lng}, ${l.location_type}, ${l.is_default})
      ON CONFLICT (user_id, name) DO NOTHING
      RETURNING id;
    `;
    inserted += res.length;
  }
  console.log(`saved_locations: ${inserted} inserted`);
}

async function seedServices() {
  let inserted = 0;
  for (const s of SERVICES) {
    const res = await sql`
      INSERT INTO services (
        id, user_id, cleaner_id, service_type_id, location_address,
        location_lat, location_lng, scheduled_date, estimated_duration,
        total_price, status, payment_status, rating, review,
        created_at, started_at, completed_at, cancelled_at, cancellation_reason
      ) VALUES (
        ${s.id}, ${DEMO_USER_ID}, ${s.cleaner_id}, ${s.service_type_id},
        ${s.location_address}, ${s.lat}, ${s.lng}, NULL,
        ${s.estimated_duration}, ${s.total_price}, ${s.status},
        ${s.payment_status}, ${s.rating ?? null}, ${s.review ?? null},
        ${s.created_at}, ${s.started_at ?? null}, ${s.completed_at ?? null},
        ${s.cancelled_at ?? null}, ${s.cancellation_reason ?? null}
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;
    inserted += res.length;
  }
  console.log(`services: ${inserted} inserted (${SERVICES.length - inserted} existing)`);

  for (const r of RATINGS) {
    await sql`
      INSERT INTO service_ratings (service_id, user_id, cleaner_id, rating, review_text, review_title, created_at)
      VALUES (${r.service_id}, ${DEMO_USER_ID}, ${r.cleaner_id}, ${r.rating}, ${r.review_text}, ${r.review_title}, ${r.created_at})
      ON CONFLICT (service_id, user_id) DO NOTHING;
    `;
  }
  console.log("service_ratings: 3 rows ensured");

  const cleanerById = Object.fromEntries(CLEANERS.map((c) => [c.id, c]));
  for (const r of RATINGS) {
    const c = cleanerById[r.cleaner_id];
    if (!c) continue;
    await sql`
      UPDATE cleaners
      SET rating = ${c.rating}, total_ratings = ${c.total_ratings}
      WHERE id = ${r.cleaner_id};
    `;
  }
  console.log("cleaners: seeded rating values restored after rating triggers");
}

async function seedNotifications() {
  let inserted = 0;
  for (const n of NOTIFICATIONS) {
    const res = await sql`
      INSERT INTO notifications (id, user_id, service_id, type, title, message, created_at)
      VALUES (${n.id}, ${n.user_id}, ${n.service_id}, ${n.type}, ${n.title}, ${n.message}, ${n.created_at})
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;
    inserted += res.length;
  }
  console.log(`notifications: ${inserted} inserted`);
}

async function touchUser() {
  await sql`
    UPDATE users SET phone = '+254712345678', updated_at = NOW()
    WHERE id = ${DEMO_USER_ID};
  `;
  console.log("users: demo user phone set");
}

async function main() {
  await seedCleaners();
  await seedPromos();
  await seedSavedLocations();
  await seedServices();
  await seedNotifications();
  await touchUser();
  console.log("\nSeed complete.");
}

main().catch((e) => {
  console.error("SEED ERROR:", e);
  process.exit(1);
});
