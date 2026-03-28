# Cottage Visit Calendar

A private visit-planning app for one guest cottage, designed for deployment on Vercel with Supabase and Resend.

## What it does
- Shared-password guest access
- Separate admin password
- Calendar from March 27, 2026 to October 30, 2026
- Public statuses: Available, Requested, Unavailable
- Guest request form
- Requested dates expire after 7 days
- Admin controls to mark requested or unavailable and delete requests
- Email notifications to both admins when a request is submitted

## Setup
1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql`.
3. Create a Resend account and verify a sending domain or sender.
4. Copy `.env.example` to `.env.local` and fill in the values.
5. Install dependencies with `npm install`.
6. Run locally with `npm run dev`.
7. Deploy to Vercel.

## Environment variables
See `.env.example`.

## Notes
- Shared and admin passwords are environment variables, not hard-coded.
- The guest-facing page never shows names.
- The admin area is unlocked by a separate password inside the app.
- Google Calendar sync can be added after initial deployment.
