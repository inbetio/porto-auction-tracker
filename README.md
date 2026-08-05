# Porto / Norte Auction Tracker

A single-file dashboard (`index.html`) of judicial & insolvency **property auctions** across
Porto, Braga, Aveiro, Coimbra and Viana do Castelo. Open it in any browser.

- **Countdowns** are live (they tick in the browser).
- **Lot data** (which lots exist, current bids) is a **snapshot** — it refreshes only when the
  sweep is re-run and this file is redeployed. Hosting alone does **not** re-scrape the sites.

---

## Is it "always live" and "always tracking"?

| | Status |
|---|---|
| Always **live / accessible** | ✅ yes, once hosted (24/7) |
| Countdowns update live | ✅ yes (in-browser) |
| Lot data **auto-refreshes** | ⚠️ only if you add the auto-refresh job below |

---

## Hosting — pick one

### A. Cloudflare Pages + private repo  ·  *recommended (private · free · git · auto-deploy)*
1. Create a **private** GitHub repo; add `index.html` + this README; push (see Git quick start).
2. Cloudflare dashboard → **Pages** → *Connect to Git* → choose the repo.
   Framework preset: **None** · Build command: *(empty)* · Output directory: `/`. Deploy.
   → live at `your-project.pages.dev` (free subdomain).
3. Make it private: Cloudflare → **Zero Trust → Access → Applications → Add** → your Pages URL →
   policy *Allow* your email (login by one-time code). Now only you can open it.
4. **Update = `git push`.** Pages redeploys automatically.

### B. GitHub Pages  ·  *simplest git route, but NOT truly private on free*
1. Create a repo, add `index.html`, push.
2. Repo → **Settings → Pages** → Source: `main` / `root`. Live at `username.github.io/<repo>`.
3. ⚠️ On the free plan the source (and its data) is **public** — a password gate would be
   cosmetic. Use option A if privacy matters.

### C. tiiny.host  ·  *no git, fastest private*
Drag `index.html` in → set a password (free plan, server-side) → live. Re-drag to update.

---

## Git quick start
```bash
git init
git add index.html README.md
git commit -m "Porto auction tracker"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
To update later: replace `index.html`, then `git add -A && git commit -m "update" && git push`.

---

## Auto-refresh (optional — makes it genuinely self-tracking)

The two biggest sources can be fetched **without a browser**, so a scheduled job can keep the
data current on its own:

- **e-leilões** — public JSON API: `https://www.e-leiloes.pt/api/eventos/<REF>` returns
  `lanceAtual` (current bid), `valorBase`, `valorMinimo`, `dataFim`, `terminado` for each lot.
- **Leilosoc** — the lot data is embedded in each page's `__NEXT_DATA__` JSON
  (`props.pageProps.lots.items[]`), fetchable with a plain HTTP GET.

A **GitHub Action** on a cron (e.g. daily 07:00) can pull these, rebuild the data, and commit →
Cloudflare/GitHub Pages redeploys automatically. The niche platforms (Imoloriente, OneFix,
VLeilões, LeilOn, Bidleiloeira) and the caderneta/certidão reads stay **assisted** — they need a
browser or logins that don't run reliably headless.

> Want this wired up? Ask Claude to generate `.github/workflows/refresh.yml` +
> `scripts/refresh.mjs`, and to split the lot list out of `index.html` into a `data.json` the
> page loads (so the Action only has to rewrite the data, not the layout).

---

*Figures are estimates from asking prices & live bids, not appraisals — verify and view before
bidding. This tool never bids, registers, or pays.*
