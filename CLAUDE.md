# Valor AI Fuel Gauge — Project Context

## What This Is
A Manifest V3 Chrome extension that shows Claude AI and ChatGPT users their real-time usage status and allows quick AI summary actions through a paid action pack system.

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
- Stripe for $1.99 action pack purchases
- Vercel for backend API endpoints
- Resend for onboarding emails
- Anthropic API for Claude summary actions
- OpenAI API for ChatGPT usage tracking

## Credentials
All credentials are in ~/valor-fuel-gauge/.env
- ANTHROPIC_API_KEY is live and set
- OPENAI_API_KEY placeholder until user sets it in options page
- All others are placeholder until their build step

## Known Issues and Lessons Learned
- Anthropic API requires header "anthropic-dangerous-direct-browser-access: true" on all direct browser API calls or returns 401
- Anthropic does not have a dedicated usage endpoint. Use local token tracking in Chrome storage instead.
- OpenAI does not have a simple usage endpoint accessible with just an API key. Use local token tracking in Chrome storage instead.
- The options page API key input must accept minimum 200 characters. Full Anthropic keys are approximately 108 characters.
- API keys cannot be retrieved from the Anthropic console after creation. Full key lives in .env file only.
- Do not use the messages endpoint for usage checking. Track usage locally.
- Correct Anthropic model string for validation calls is claude-haiku-4-5-20251001. Do not use claude-haiku-20240307 as it returns 404.
- Anthropic API requires credits loaded in the account at console.anthropic.com Plans and Billing before any API calls succeed regardless of key validity.
- OpenAI key validation uses gpt-4o-mini with max_tokens 1 for minimal cost.
- Chrome Web Store requires every declared permission to be actively used. Remove notifications and alarms if not called in code. Violation reference Purple Potassium.
- Chrome Web Store zip must be created from inside the ~/valor-fuel-gauge directory with files at root level. Never zip from the parent directory.
- Extension name changed to "Claude & ChatGPT AI Usage Tracker – Valor Fuel Gauge" for Chrome Web Store SEO optimization.

## Completed Steps
- Step 1: File structure and manifest complete and loading in Chrome
- Step 2: Popup UI complete with circular gauge, color coding, action pack credits display
- Step 3: Options page complete with AES-256 encrypted local storage for API key
- Step 4: Claude usage polling complete, live data displaying in popup gauge
- Step 5: Action pack metering complete. 5 free credits on install, real balance displaying in popup, GET_CREDITS and DEDUCT_CREDIT message handlers working.
- Step 6: Quick summary action complete. Modular actions registry built. Selected text capture working. Anthropic API returning clean summaries. Credits decrementing correctly.
- Step 7: Stripe checkout flow complete. Vercel backend live at valor-checkout.vercel.app. Server side payment verification working. 20 credits delivered to extension automatically after purchase. End to end tested and confirmed working.
- v1.1: Dual platform support added. Claude and ChatGPT gauges side by side. OpenAI API key encryption and storage. Options page updated with both key sections.

## Stripe Configuration
- Product: Valor Action Pack (prod_ULXuYmDvMrE0gX)
- Price: $1.99 USD one-time (price_1TMqoHE6uEPM3uMoUzX1ATdC)
- Credits per purchase: 20
- Automatic tax: enabled
- Checkout hosted via Vercel at valor-checkout.vercel.app

## Current Step
Post-launch v1.1: Extension submitted to Chrome Web Store. ChatGPT support added. Preparing for Product Hunt launch and Edge Add-ons submission.

## Branch
claude/valor-ai-fuel-gauge-R9Wwa
