# 🔑 STRIPE LIVE KEYS SETUP COMMANDS

## Step 1: Update Your .env File
```bash
# Edit your .env file and replace with your actual keys:
NODE_ENV=production
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_LIVE_PUBLISHABLE_KEY
```

## Step 2: Configure Firebase Functions
```bash
# Run this command with your actual keys:
firebase functions:config:set \
  stripe.test_secret_key="sk_test_YOUR_ACTUAL_TEST_SECRET_KEY" \
  stripe.live_secret_key="sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY"
```

## Step 3: Deploy Functions
```bash
firebase deploy --only functions
```

## Step 4: Restart React App
```bash
npm start
```

## Step 5: Test Payment Flow
1. Go to your booking page
2. Select a service and fill out the form
3. Try making a test payment
4. Check Stripe dashboard for the transaction

## 🔄 To Switch Back to Test Mode:
```bash
# Update .env file:
NODE_ENV=development
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
```

## 🚨 SECURITY NOTES:
- Never commit .env files to git
- Keep live keys secure
- Test thoroughly before going live
- Monitor Stripe dashboard for transactions
