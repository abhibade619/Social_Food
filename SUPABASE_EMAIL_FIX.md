# Supabase Email Confirmation Setup Guide

## Issue: Email Confirmation Not Working Properly

### Problem
After signing up, users receive a confirmation email, but clicking the link doesn't properly redirect them back to the app for sign-in.

### Solution: Configure Supabase Email Settings

## Step 1: Update Site URL in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ytvztxblqrslybyufxmu`
3. Go to **Authentication** → **URL Configuration**
4. Update the following:

**Site URL:**
```
https://your-app-name.vercel.app
```
(Replace with your actual Vercel deployment URL)

**Redirect URLs (Add these):**
```
https://your-app-name.vercel.app
https://your-app-name.vercel.app/**
http://localhost:5173
http://localhost:5173/**
```

## Step 2: Configure Email Templates

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Update the confirmation URL to:

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

Or use the default which should work:
```html
{{ .ConfirmationURL }}
```

## Step 3: Disable Email Confirmation (Optional - For Testing)

If you want users to sign in immediately without email confirmation:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **OFF** "Confirm email"
3. Save changes

**Note**: This is less secure but better for development/testing.

## Step 4: Update Auth Flow in App

The app already handles auth properly, but make sure users understand:
- After signup, check email for confirmation link
- Click the confirmation link
- Return to the app and sign in with your credentials

## Step 5: Add Auth Callback Handler (Optional)

If you want automatic sign-in after email confirmation, you can add a callback route. For now, the manual sign-in flow is simpler and more reliable.

## Recommended Settings for Production

**For Production (Secure):**
- ✅ Enable email confirmation
- ✅ Set proper Site URL to your Vercel domain
- ✅ Add all redirect URLs

**For Development (Easy Testing):**
- ❌ Disable email confirmation temporarily
- ✅ Allow localhost URLs

## Testing the Fix

1. Update Supabase settings as above
2. Try signing up with a new email
3. If email confirmation is enabled:
   - Check your email
   - Click confirmation link
   - Return to app and sign in
4. If email confirmation is disabled:
   - Sign up and immediately sign in

## Current App Behavior

The app is correctly configured to:
- Show signup/signin forms
- Handle authentication state
- Redirect to main app after successful login

The issue is purely on the Supabase configuration side, not the app code.
