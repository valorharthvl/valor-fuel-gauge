# Reddit Launch Posts

## INSTRUCTIONS
Post these as genuine text posts, not link posts. Do not include any marketing language, CTAs, or "check it out" energy. Reddit will destroy you for that. These read like a real person sharing something they built. Because that's what it is.

---

## POST 1 — r/ClaudeAI

**Title:**
```
I kept hitting usage walls mid-task so I built a Chrome extension that shows a fuel gauge for Claude
```

**Body:**
```
I run three businesses and use Claude for basically everything — drafting proposals, reviewing documents, summarizing research, writing emails. The one thing that kept destroying my workflow was having zero warning before hitting a usage limit. I'd be deep in a task and just... wall. No gauge, no countdown, nothing.

So I built one.

It's called Valor AI Fuel Gauge. It's a Manifest V3 Chrome extension that puts a visual gauge in your toolbar showing how much usage you have left. Green means go, yellow means slow down, red means you're about to get cut off.

I also added a one-click summarize feature because I was burning credits asking Claude to condense articles for me. Now I just highlight text on any page, click Summarize in the popup, and get 3 sentences back. Uses one credit per summary.

Technical details for anyone who cares:
- Vanilla JavaScript, no frameworks
- API key is AES-256-GCM encrypted in Chrome local storage
- Key never leaves your device
- Uses your own Anthropic API key
- Token tracking is local, not pulling from any Anthropic endpoint (they don't have one)
- Stripe for action pack purchases, server-side verification via Vercel

5 free summary credits on install. Action packs are $9.99 for 50 if you want more.

I'm a veteran and this is my first Chrome extension. Built the entire thing with Claude helping me code it, which felt appropriately meta.

It's on the Chrome Web Store if anyone wants to try it. Happy to answer technical questions or hear feedback on what would make it more useful.
```

---

## POST 2 — r/ChatGPT

**Title:**
```
Built a Chrome extension that tracks your AI usage with a visual fuel gauge — works with Claude, considering GPT support
```

**Body:**
```
I use both ChatGPT and Claude depending on the task, and the one thing that drives me crazy across both platforms is having no clear indicator of how close I am to hitting a usage limit until it's too late.

I finally built something about it. It's a Chrome extension called Valor AI Fuel Gauge. Right now it works with the Anthropic/Claude API — shows a color-coded gauge (green/yellow/red) for your usage status and lets you highlight any text on a page and get a quick AI summary with one click.

The reason I'm posting here: I'm considering adding GPT API support as well. Same gauge concept, same summary feature, just pointed at the OpenAI API instead of Anthropic.

Would that be useful to anyone here? The main value props are:
- Visual fuel gauge so you actually know where you stand before you hit a wall
- One-click page summarization without switching to a chat window
- AES-256 encrypted key storage, everything local, no data collection

If there's enough interest I'll add GPT support in the next update. Currently it's Chrome-only, Edge coming soon.

Built the whole thing as a solo developer. First extension. Feedback welcome, especially on what features would make it worth installing.
```

---

## POSTING NOTES
- Post during weekday mornings EST (9-11 AM) for maximum visibility
- Do NOT post both on the same day. Space them 2-3 days apart.
- Reply to every comment within the first 2 hours. Engagement drives Reddit visibility.
- If anyone asks "is this an ad" — be honest: "Yeah, I built it and I'm sharing it. Happy to answer questions about the code or approach."
- Do not edit the post after submission. Reddit flags edited posts lower.
- If the post gets traction, do NOT add a "thanks for the support, here's a link" edit. Just keep answering questions.
