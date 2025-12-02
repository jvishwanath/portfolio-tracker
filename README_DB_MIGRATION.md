# Migrating to a Production Database

This guide explains how to switch from the local SQLite database to a production-grade PostgreSQL database.

You have two main options:
1.  **Supabase (Recommended for Free Tier)**: A managed PostgreSQL service with a generous free tier.
2.  **Google Cloud SQL**: Fully integrated with GCP but costs ~$10/month (no permanent free tier).

---

## Option 1: Supabase (Free)

This is the easiest way to get a free PostgreSQL database that works with your Cloud Run deployment.

### 1. Create a Supabase Project
1.  Go to [supabase.com](https://supabase.com/) and sign up.
2.  Click **New Project**.
3.  Enter a Name (e.g., `Portfolio Tracker`) and a strong Database Password.
4.  Choose a Region close to your Cloud Run region (e.g., US East/West).
5.  Click **Create new project**.

### 2. Get the Connection String
1.  Once the project is ready, go to **Project Settings** (gear icon) -> **Database**.
2.  Under **Connection parameters**, find the **Connection String** section.
3.  Click **URI**.
4.  Copy the string. It looks like:
    `postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
5.  **Important**: Replace `[YOUR-PASSWORD]` in the string with the password you created in step 1.

### 3. Deploy to Cloud Run
Update your deploy command to set the `DATABASE_URL` environment variable.

```bash
# Replace with your actual Supabase connection string
export DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
export PROJECT_ID="your-project-id"

gcloud run deploy portfolio-tracker \
  --image gcr.io/$PROJECT_ID/portfolio-tracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "GEMINI_API_KEY=your_gemini_key" \
  --set-env-vars "DATABASE_URL=$DATABASE_URL"
```

---

## Option 2: Google Cloud SQL (Paid)

Use this if you want to keep everything within Google Cloud and don't mind the cost (~$10/mo).

### 1. Create a Cloud SQL Instance
1.  Go to [Google Cloud Console](https://console.cloud.google.com/) -> **SQL**.
2.  Create a **PostgreSQL** instance.
3.  Choose `f1-micro` (Shared core) for lowest cost.

### 2. Create Database and User
1.  In the instance details, go to **Databases** -> Create `portfolio_tracker`.
2.  Go to **Users** -> Create a user (e.g., `portfolio_user`).

### 3. Configure Cloud Run
1.  Copy the **Connection name** from the Overview page (e.g., `project:region:instance`).
2.  Deploy with the connection name and database URL.

```bash
export INSTANCE_CONNECTION_NAME="project:region:instance"
export DB_USER="portfolio_user"
export DB_PASS="password"
export DB_NAME="portfolio_tracker"

gcloud run deploy portfolio-tracker \
  --image gcr.io/$PROJECT_ID/portfolio-tracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
  --set-env-vars "GEMINI_API_KEY=your_gemini_key" \
  --set-env-vars "DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost/$DB_NAME?host=/cloudsql/$INSTANCE_CONNECTION_NAME"
```

## Important Notes
*   **Data Migration**: Your local `portfolio.db` data is **not** automatically transferred. You start with an empty database.
*   **Supabase**: Since it's external to GCP, ensure your database password is strong. Cloud Run connects over the public internet (encrypted via SSL).
