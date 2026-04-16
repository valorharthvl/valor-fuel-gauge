# Microsoft Edge Add-ons Store — Submission Guide

## Pre-requisites

1. A Microsoft account (personal or business)
2. Register as a developer at https://partner.microsoft.com/dashboard/microsoftedge/overview
3. One-time registration fee: $19 USD (individual) or free (company with existing Partner Center account)
4. The same .zip file you submitted to Chrome Web Store

## Create Your .zip Package

Use the exact same extension files. Edge accepts Chrome Manifest V3 extensions without modification.

```bash
cd ~/valor-fuel-gauge
zip -r valor-fuel-gauge-edge.zip manifest.json background.js popup.html popup.js popup.css options.html options.js storage.js api.js content.js checkout-listener.js icons/ -x "*.git*" -x "vercel/*" -x "*.env" -x "screenshot*" -x "privacy.html" -x "CLAUDE.md" -x "*.md"
```

## Submission Steps

### Step 1 — Sign In
Go to https://partner.microsoft.com/dashboard/microsoftedge/overview and sign in.

### Step 2 — Create New Extension
Click **"Create new extension"** then **"Upload new package"**.

Upload `valor-fuel-gauge-edge.zip`.

### Step 3 — Extension Listing

Fill out the following fields exactly:

**Extension name:**
```
Valor AI Fuel Gauge
```

**Short description (132 char max):**
```
Monitor your Claude AI usage in real time with a visual fuel gauge and run quick AI summaries with action pack credits.
```

**Full description:**
```
Valor AI Fuel Gauge gives Claude AI users a real-time visual dashboard for tracking their API usage and running quick AI-powered actions.

FEATURES:
- Circular fuel gauge showing your Claude usage percentage remaining
- Color-coded: green above 50%, yellow 25-50%, red below 25%
- One-click AI text summarization on any web page
- Action pack credit system with 5 free credits on install
- Buy additional 50-credit action packs for $1.99
- AES-256 encrypted local storage for your API key
- Your API key never leaves your device

HOW IT WORKS:
1. Install the extension and enter your Anthropic API key in Settings
2. The fuel gauge immediately shows your usage status
3. Highlight text on any page and click Summarize for an instant AI summary
4. Each summary uses one action credit
5. Buy more credits when you run out

PRIVACY FIRST:
- API key encrypted with AES-256-GCM, stored locally only
- No browsing data collected
- No DOM scraping of any website
- Stripe handles all payment processing
- We never see your credit card details

Built by Valor Hart LLC.
```

**Category:**
```
Productivity
```

**Language:**
```
English (United States)
```

### Step 4 — Store Listing Assets

**Extension icon:** Upload `icons/icon128.png` (128x128)

**Screenshots:** Upload the same three 1280x800 PNG screenshots from the Chrome Web Store submission.

**Promotional tile (optional, 440x280):** Skip for now or upload if you have one.

### Step 5 — Privacy Policy

**Privacy policy URL:**
```
https://valorhartllc.com/privacy
```

**Does your extension access personal information?**
```
Yes — API key stored locally (encrypted), email optionally provided by user
```

**Does your extension use remote code?**
```
No
```

**Does your extension access personal data or content provided by the user?**
```
Yes — User-selected text is sent to Anthropic API for summarization (only when user clicks Summarize)
```

### Step 6 — Certification Notes

In the "Notes for certification" field:
```
This extension uses the Anthropic API for AI text summarization. The user provides their own API key which is encrypted and stored locally. The extension makes API calls directly from the browser to api.anthropic.com. Payment processing is handled via Stripe checkout hosted on our Vercel backend at valor-checkout.vercel.app. No user data is collected or stored on our servers.
```

### Step 7 — Pricing
Select **Free** (the extension is free; action packs are purchased through Stripe, not the Edge store).

### Step 8 — Age Rating
Select **Everyone**.

### Step 9 — Submit
Click **"Publish"**.

## Timeline
Edge Add-ons review typically takes 3-7 business days. You will receive an email when approved or if changes are requested.

## Post-Approval
Your extension will be live at:
```
https://microsoftedge.microsoft.com/addons/detail/valor-ai-fuel-gauge/[your-extension-id]
```
