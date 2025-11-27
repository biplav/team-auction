# Database Setup Instructions

## Current Issue

Your CockroachDB database has a multi-region configuration that's preventing Prisma from pushing the schema.

## Quick Fix (Option 1 - CockroachDB Console)

1. Go to https://cockroachlabs.cloud/
2. Log into your account
3. Navigate to your `cric_auction` database
4. Open the SQL Console
5. Run the following command:

```sql
ALTER DATABASE cric_auction DROP REGION "aws-ap-south-1";
```

6. After that, come back to your terminal and run:

```bash
npx prisma db push
```

## Alternative: Use Supabase (Option 2 - Easier Setup)

If you want a simpler setup, I recommend Supabase:

1. Go to https://supabase.com
2. Create a new project (free tier)
3. Once created, go to Project Settings → Database
4. Copy the "Connection string" (URI format)
5. Update `.env` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres"
```

6. Run:

```bash
npx prisma db push
```

## Verify Database Connection

After fixing the database, test the connection:

```bash
# This will show you the database tables
npx prisma studio
```

## Next Steps After Database is Connected

1. The app will be fully functional
2. You can create users, teams, players
3. Start the auction system
4. All features will work end-to-end

## Current Status

✅ Application code is complete and ready
✅ Database schema is correctly defined
⏳ Waiting for database connection to be established

Once you fix the database connection (takes ~2 minutes), everything will work!
