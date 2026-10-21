# Social Finder

An installable web app (PWA) that finds people on social networks. Type a full
name or a username and it gives you ready-made links for 16 networks, which you
can open, copy or share.

- **Full name**: people-search links on Facebook, Instagram, LinkedIn, X, TikTok,
  YouTube, Threads, Reddit, VK, Odnoklassniki, Pinterest, GitHub, Twitch and Medium.
  Telegram and Snapchat have no name search, so they get a Google search limited to that site.
  Optional "extra words" (city, school, company) narrow the search.
- **Username**: direct profile links (for example `instagram.com/name`). Typing `@name`
  or pasting a profile link switches to this mode automatically.
- **Google all-in-one**: one Google search across every selected network.
- **Copy all / Share**: sends the whole list in one message.
- **Recent searches** and **which networks to show** are saved on the device.
- Works offline, installs to the home screen, and appears in the phone's share
  menu once installed (sharing text into it starts a search).

No backend, no tracking. The app only builds links.

## Run locally

```bash
node serve.js
```

Then open http://localhost:5173.

## Put it online

Any static host works (GitHub Pages, Netlify, Cloudflare Pages, Vercel). Upload
every file in this folder except `serve.js`, `tools/` and `.claude/`. It must be
served over HTTPS so it can install and work offline.

## Changing things

- Add or edit networks in `networks.js`.
- After changing any app file, bump `VERSION` in `sw.js` so installed copies update.
- Regenerate the PNG icons with `tools/make-icons.ps1 -OutDir icons` (Windows).
