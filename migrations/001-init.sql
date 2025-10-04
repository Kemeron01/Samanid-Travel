CREATE TYPE role_enum AS ENUM ('admin', 'user');


CREATE TABLE "roles" (
  "id" SERIAL PRIMARY KEY,
  "role" role_enum,
  "created_at" timestamp DEFAULT NOW(),
  "deleted_at" timestamp
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "role_id" INT REFERENCES roles(id),
  "full_name" VARCHAR,
  "phone_number" varchar UNIQUE ,
  "email" VARCHAR UNIQUE NOT NULL ,
  "password_hash" TEXT NOT NULL,
  "is_verified" boolean DEFAULT FALSE,
  "created_at" timestamp DEFAULT NOW (),
  "deleted_at" timestamp
);

CREATE TABLE "code_resets" (
  "id" SERIAL PRIMARY KEY,
  "code" varchar,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW(),
);

CREATE TABLE "comments" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INT REFERENCES users(id),
  "message" TEXT,
  "created_at" timestamp DEFAULT NOW(),
  "deleted_at" timestamp
);

CREATE TABLE "tours" (
  "id" SERIAL PRIMARY KEY,
  "from_destination" varchar,
  "to_destination" varchar,
  "price" NUMERIC(10,2),
  "is_active" boolean DEFAULT FALSE,
  "number_of_destinations" integer,
  "tour_highlights" varchar,
  "description" TEXT,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW(),
  "deleted_at" timestamp
);

CREATE TABLE "payments" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INT REFERENCES users(id),
  "amount" NUMERIC(10,2),
  "payment_date" timestamp
);

ALTER TABLE "users" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id");

ALTER TABLE "comments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "payments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
