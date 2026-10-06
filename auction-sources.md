# Portuguese auction sources — full roster behind martelo.pt
**Audited 6 Oct 2026.** Ground truth = martelo's own `filter-source` dropdown cross-checked against a nationwide API pull (20 districts × 5 asset types, 2,895 live events).

## Headline findings

1. **18 auction houses, not 9.** Martelo's *Sobre* page says it aggregates "9 fontes" and names e-leilões, Citius, AT, OneFix, BidLeiloeira, Leiloeira do Lena, Leilosoc, INLEX and Avalibérica. That page is out of date — the live system carries **18 distinct private houses**.
2. **Martelo is NOT a complete substitute for direct scraping.** Verified two ways:
   - Leilosoc: martelo 39 imóveis vs Leilosoc's own site "39 lotes disponíveis" → **complete**.
   - OneFix: martelo 15 imóveis vs OneFix's own `/tipo_verbas/1/Imoveis` showing **40 live property lots, all with running countdowns, and pagination beyond that** → **martelo is missing at least 25**.
   - LeilOAtrium: martelo shows **0 live events**, but the site has live lots right now → **not being ingested at all**.
3. **Avalibérica's property lots are on a different domain.** `avaliberica.pt` is the general auction site; the Imóveis nav points to **`auctionsesales.pt`**, a separate property portal with its own stock and pagination. Martelo appears to read the former.
4. **L.C. Premium runs four separate channels** — `/pt/electronic-auctions`, `/pt/live-auctions`, **`/pt/sealed-bid` (carta fechada)** and `/pt/private-sales`. Martelo's 16 lots look like one channel only. The sealed-bid channel is directly relevant to the Carta Fechada tab.
5. **None of these domains are reachable from the cloud container.** Every host returns `000`; the agent proxy answers **403 to CONNECT** (egress policy). All scraping must run through Chrome on your machine. This is a hard constraint, not a transient failure.

## The 18 houses

| # | Slug | Name | Host | Live imóveis | Lot URL pattern | Property listing entry |
|---|------|------|------|-----|-----------------|------------------------|
| 1 | `eleiloes` | e-Leilões | e-leiloes.pt | **864** | `/evento/<REF>` | public JSON API `/api/eventos/<REF>` |
| 2 | `leilosoc` | Leilosoc | leilosoc.com | 39 | `/pt-PT/lot/<id>` | `/pt-PT/category/5-imoveis/` |
| 3 | `lcpremium` | L.C. Premium | lcpremium.pt | 16 | `/pt/electronic-auctions/<slug>` | 4 channels (see above) |
| 4 | `onefix` | OneFix | onefix-leiloeiros.pt | 15 *(40+ real)* | `/verba/<id>/<slug>` | `/tipo_verbas/1/Imoveis` |
| 5 | `exclusivagora` | Exclusivagora | exclusivagora.com | 12 | — | — |
| 6 | `avaliberica` | Avalibérica | avaliberica.pt → **auctionsesales.pt** | 11 | `/imovel/<slug>/<id>` | `/imoveis` |
| 7 | `solventium` | Solventium | solventium.pt | 10 | — | — |
| 8 | `bidleiloeira` | BidLeiloeira | bidleiloeira.pt | 9 | `/<slug>-<hash>` | — |
| 9 | `capital` | Capital Leiloeira | capital-leiloeira.pt | 9 | `/index.php…` | — |
| 10 | `leilosil` | Leilosil | leilosil.pt | 9 | `/pt/auction/lot…` | — |
| 11 | `lena` | Leiloeira do Lena | leiloeiradolena.com | 8 | `/leilao/<id>` | — |
| 12 | `leilon` | LeilOn | leilon.pt | 6 | `/pt/auction/lot…` | — |
| 13 | `imoloriente` | Imoloriente | imoloriente.pt | 6 | `/bolsa-de-negocios/<tipo>/<slug>` | — |
| 14 | `leiloversatil` | LeiloVersatil | leiloversatil.pt | 3 | — | — |
| 15 | `leilovalor` | LeiloValor | leilovalor.com | 2 | `/index.php…` | — |
| 16 | `viaserumos` | Vias & Rumos | viaserumos.pt | 2 | `/verba/<id>/` | — |
| 17 | `inlex` | INLEX | inlexleiloeira.pt | 1 | `/verba/<id>/<slug>` | — |
| 18 | `leiloatrium` | LeilOAtrium | leiloatrium.pt | **0 in martelo / live on site** | `/product/<slug>/` (WooCommerce) | — |

*Live imóveis = count in martelo's feed on 6 Oct 2026, nationwide, `tipo` matching "Imóvel/Imóveis".*

## Platform families — fewer scrapers than houses

Several houses run the same engine, so one parser covers several:

- **`/verba/<id>/<slug>`** → OneFix, INLEX, Vias & Rumos *(3 houses, 1 scraper)*
- **`/pt/auction/lot…`** → LeilOn, Leilosil *(2 houses, 1 scraper)*
- **`/index.php` legacy PHP** → Capital Leiloeira, LeiloValor, Avalibérica main site
- **WooCommerce `/product/`** → LeilOAtrium
- **Bespoke** → Leilosoc, L.C. Premium, BidLeiloeira, Imoloriente, Lena, Solventium, Exclusivagora, LeiloVersatil

Realistically **~11 parsers** cover all 18 houses.

## Two public registers martelo gates behind Pro

- **Citius** — court editais. Already handled separately (declarativos register for the Carta Fechada tab, executivos for penhoras).
- **Autoridade Tributária — fiscal sales.** Martelo monitors it; it is **not** in the public feed. Host is `vendas.portaldasfinancas.gov.pt`, but the root and the obvious action paths 404 — the entry point needs mapping in a dedicated session. **We currently do not look at AT sales at all.** Tax-seizure property is a separate supply of judicial stock from a different creditor, and it is the one register entirely absent from the tracker.

## Recommended sweep order

1. **e-Leilões API** — 864 of ~1,030 live property lots. Already automated, keep as primary.
2. **OneFix direct** (`/tipo_verbas/1/Imoveis`) — the single biggest martelo blind spot found.
3. **Leilosoc** (`/pt-PT/category/5-imoveis/`) — martelo is complete here, so this is only a backstop.
4. **auctionsesales.pt** — Avalibérica's real property stock.
5. **L.C. Premium `/pt/sealed-bid`** — feeds the Carta Fechada tab.
6. **LeilOAtrium** — not ingested by martelo at all.
7. Remaining 12 via martelo, re-verified against source sites quarterly.
8. **AT portal** — map the entry path, then add as a new register.

## Standing caveats

- Martelo's `tipo`/`subtipo` flags are unreliable; the **descrição text** is the only trustworthy basis for rejecting quotas, usufrutos, meações and nua-propriedade.
- `source_url` is null for e-leilões rows in the feed — build those from the reference.
- Counts above are a single-day snapshot and will drift.
