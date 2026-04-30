# Budget/Bill/Expenses Tracker

A GitHub + Vercel-ready Next.js app for tracking regular payments, scheduled payments, expenses, income, due reminders, recurring bills, and cycle-based monthly budget summaries.

## Features included

- Dashboard with paid income, paid expenses, scheduled expenses, and projected remaining balance.
- Regular Payments Calendar.
- Click a date to add an expense or income.
- Custom category names and icons for food, entertainment, shopping, school, kids, salary, part-time, bonus, investments, and more.
- Expense/income name, amount, category, due date, recurrence, reminder days, and status.
- Due reminder panel based on reminder days before due date.
- On-due actions: Paid, Cancel, Extend 7 days.
- Marking an expense as Paid deducts it from the projected remaining income automatically.
- Scheduled Payments manual list view.
- Custom cycle start and end date for non-1st-of-month salary cycles.
- Premium-ready recommendations and feature flags.

## Premium features recommended

Best first premium features:

1. Unlimited customized expense/income categories and icons.
2. Advanced charts: spending by category, income vs expenses, cashflow forecast, and daily/weekly trend.
3. Month/cycle comparison: spent less or more than previous cycle.
4. Smart reminders: push/email reminders, overdue alerts, and recurring auto-generation.
5. CSV/PDF export.
6. Shared household budget with partner/family access.
7. Savings goals for school, kids, emergency fund, vacation, etc.
8. Cloud sync and backup.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to GitHub + Vercel

1. Create a new GitHub repository.
2. Upload/push this project.
3. In Vercel, choose **Add New Project**.
4. Import the GitHub repo.
5. Framework preset should be **Next.js**.
6. Click **Deploy**.

## Production upgrade path

This demo stores data in React state. For production, add:

- Auth: Clerk, Auth.js, or Supabase Auth.
- Database: Supabase Postgres, Neon, or Vercel Postgres.
- Payments: Stripe subscriptions for premium.
- Notifications: Resend for email reminders; web push for browser/device reminders.
- Cron jobs: Vercel Cron to generate recurring payments and send due reminders.

## Suggested database tables

- users
- categories
- entries
- recurrence_rules
- reminders
- subscriptions
- household_members
