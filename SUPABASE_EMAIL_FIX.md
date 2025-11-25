# Fix Supabase Email Confirmation for Vercel

## Issue
Email confirmation links redirect to `localhost` instead of your Vercel URL.

## Solution: Update Supabase Settings

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**

### Step 2: Update URLs

**Site URL:**
```
https://social-food-rouge.vercel.app
```

**Redirect URLs** (add both):
```
https://social-food-rouge.vercel.app
https://social-food-rouge.vercel.app/**
```

Click **Save**

### Step 3: Update Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Click **Confirm signup**
3. Find the confirmation URL in the template:
   ```
   {{ .ConfirmationURL }}
   ```
4. Make sure it's using the Site URL you set above

### Step 4: Test

1. Sign up with a new email
2. Check your email
3. Click the confirmation link
4. Should redirect to: `https://social-food-rouge.vercel.app`
5. Sign in with your credentials

## Alternative: Disable Email Confirmation (For Testing)

If you want to skip email confirmation during development:

1. Go to **Authentication** → **Providers** → **Email**
2. Uncheck **"Confirm email"**
3. Click **Save**

Now users can sign in immediately after signup!

## What Changed in the App

✅ After signup, you now see:
```
✅ Account created! Please check your email for a confirmation link.
```

✅ Form clears automatically

✅ Switches to sign-in page after 5 seconds

✅ Better user experience!
