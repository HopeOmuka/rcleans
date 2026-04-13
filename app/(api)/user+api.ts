import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { name, email, clerkId } = await request.json();

    if (!email || !clerkId) {
      return Response.json(
        { error: "Email and Clerk ID are required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE clerk_id = ${clerkId} OR email = ${email}
    `;

    if (existingUser.length > 0) {
      // User already exists, return existing user
      return new Response(
        JSON.stringify({
          data: existingUser[0],
          message: "User already exists",
        }),
        {
          status: 200,
        },
      );
    }

    // Create new user
    const response = await sql`
      INSERT INTO users (
        id,
        name,
        email,
        clerk_id,
        profile_image_url
      )
      VALUES (
        ${clerkId},
        ${name || "User"},
        ${email},
        ${clerkId},
        ${null}
      )
      RETURNING id, name, email, clerk_id;
    `;

    return new Response(JSON.stringify({ data: response[0] }), {
      status: 201,
    });
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle duplicate key error
    if (error.code === "23505") {
      return Response.json({ error: "User already exists" }, { status: 409 });
    }

    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return Response.json({ error: "Clerk ID required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const users = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId}
    `;

    if (users.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ data: users[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
