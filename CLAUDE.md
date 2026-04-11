# Valor AI Fuel Gauge — Project Context

## What This Is
A Manifest V3 Chrome extension that shows Claude AI users their real-time usage status and allows quick AI summary actions through a paid action pack system.

## Rules That Never Change
- Vanilla JavaScript only. No frameworks, no libraries, no dependencies.
- No DOM scraping of any AI platform under any circumstances.
- No user data transmitted anywhere except Supabase and Vercel backend.
- Minimal Chrome permissions: storage, notifications, activeTab only.
- Complete copy and paste ready files only. No partial snippets. Every file delivered in full every time.
- All terminal commands must be Chromebook Linux compatible.
- Always push to branch: claude/valor-ai-fuel-gauge-R9Wwa
- After delivering files always provide exact terminal commands to push to the branch.
- When diagnosing bugs, always review the complete console output and full error details before proposing a fix. Do not propose fixes based on partial information.

## Current Stack
- Chrome Extension Manifest V3
- Vanilla JavaScript only
- Supabase for action pack ledger and user records
- Stripe for $9.99 action pack purchases
- Vercel for backend API endpoints
- Resend for onboarding emails
- Anthropic API for quick summary actions

## Credentials
All credentials are in ~/valor-fuel-gauge/.env
- ANTHROPIC_API_KEY is live and set
- All others are placeholder until their build step

## Known Issues and Lessons Learned
- Anthropic API requires header "anthropic-dangerous-direct-browser-access: true" on all direct browser API calls or returns 401
- Anthropic does not have a dedicated usage endpoint. Use local token tracking in Chrome storage instead.
- The options page API key input must accept minimum 200 characters. Full Anthropic keys are approximately 108 characters.
- API keys cannot be retrieved from the Anthropic console after creation. Full key lives in .env file only.
- Do not use the messages endpoint for usage checking. Track usage locally.
- Correct Anthropic model string for validation calls is claude-haiku-4-5-20251001. Do not use claude-haiku-20240307 as it returns 404.
- Anthropic API requires credits loaded in the account at console.anthropic.com Plans and Billing before any API calls succeed regardless of key validity.

## Completed Steps
- Step 1: File structure and manifest complete and loading in Chrome
- Step 2: Popup UI complete with circular gauge, color coding, action pack credits display
- Step 3: Options page complete with AES-256 encrypted local storage for API key
- Step 4: Claude usage polling complete, live data displaying in popup gauge

## Current Step
Step 5: Action pack metering. 5 free actions on install tracked in Chrome storage. User sees credit balance in popup. Credits decrement when actions are used.

## Branch
claude/valor-ai-fuel-gauge-R9Wwa
