---
name: internal-link-audit
description: Audit and rebuild a site's internal linking so dormant pages become eligible to rank and every content page routes to revenue. Produces a topic map, an internal-link ledger, an orphan list, a link-concentration report, and a money-page routing audit. Use for any internal linking, site architecture, or topic clustering task — triggers include "internal linking", "internal link audit", "orphan pages", "pillar page", "content cluster", "topic map", "link ledger", "money page links", "site architecture", "anchor text audit", "link concentration", "which pages aren't ranking", "we have 200 blog posts doing nothing", or when a client's content library is large and underperforming. Reports eligibility (does the page rank at all, for how many queries), never promised position movement.
---

# Internal Link Audit

## What this skill claims, and what it does not

Internal links are a **threshold effect, not a lift effect**. The evidence supports:

- Internal links affect **whether** a page ranks at all, and **how many queries** it ranks for.
- Internal links have **no measurable relationship with position** once a page is already ranking (ρ = −0.012, p = 0.55, n = 2,696 ranking pages).

So the promise is *eligibility*, never *position*. Never tell a client this work will move them up the page. Tell them it puts pages they already paid for into the game, and routes readers to what they sell.

Read `references/evidence.md` before quoting any statistic to a client. It grades every published claim this skill is built on — several widely repeated ones do not hold.

**The framing that sells and is true:** most pages aren't losing, they were never entered. 64.6% of pages have no external backlink at all, so internal links are the only lever available on two-thirds of a site.

## Where this sits in the SEO workflow

This skill is not "before" or "after" a general SEO route — it **splits it in two**, and sits in the middle as a filter.

1. **SEO route first, for data acquisition only.** Site audit crawl, Semrush/Ahrefs pull, Search Console connection, competitor set. This skill consumes those outputs; it does not duplicate them. Do not run the on-page or article-optimization part of the SEO route yet.
2. **This skill second.** Its step 4 (qualify before you link) decides which pages are kept, consolidated, or retired. That verdict is the gate for everything downstream.
3. **SEO route again, for on-page and article optimization** — but only on pages that survived qualification.

The reason for the order is cost. Optimizing an article before the link audit means spending hours on pages that step 4 is about to consolidate or delete. The qualification verdict is what stops that waste, so it has to land before any content work starts.

Two exceptions:

- **Sitemap generation runs after this skill**, always. Consolidation and retirement change the URL set, so a sitemap built beforehand is stale on delivery.
- **AEO / answer-engine work is independent** and can run at any point. It doesn't depend on the internal link graph and this skill doesn't touch it.

## Before starting

Confirm with the user:

1. **Which site**, and do we have crawl access (Screaming Frog / Sitebulb / Ahrefs Site Audit) or CMS export?
2. **Which pages are money pages** — pages that produce a signup, a lead, a booking, or a sale. If the user can't name them, stop and establish them first. Everything downstream depends on this.
3. **The competitive set** — 5–10 direct competitors. Required for benchmarking; see step 3.
4. **Rank data source** — Search Console (preferred, it's their own data), Ahrefs, Semrush, or DataForSEO.

Never proceed on a capped or partial crawl. See step 1.

## The procedure

Steps 1–3 are diagnosis. Steps 4–7 are the work. Run in order; each depends on the one before.

### 1. Full crawl, no cap

Crawl **every live page**. Record for every internal link: source URL, destination URL, anchor text, and DOM position / container (nav, footer, sidebar, body, related-module).

A capped crawl is wrong in a specific and predictable direction — it invents orphans and undercounts inbound links on every page it touches. If the tool caps out, raise the cap or segment the crawl by directory. Do not report orphan rates from a truncated crawl.

### 2. Strip the template layer

Two passes:

- **Pass A — frequency.** Remove every link whose destination appears on **≥30% of pages**. (Published work uses ≥50%; that is too generous and leaves sidebar and related-post modules in the data.)
- **Pass B — anchor uniformity.** Among surviving destinations with ≥10 inbound links, flag any where a single anchor string accounts for >80% of links. Inspect: these are almost always template links Pass A missed. Remove confirmed ones.

Pass B is a **detector, not a task**. Do not "fix" uniform anchors by rewriting them into varied keyword-rich anchors — the published finding that varied anchors lift rankings is very likely residual template contamination, and naive anchor variation is a real over-optimization risk. See `references/evidence.md`.

What survives both passes is the contextual link graph: linking somebody chose to write. Every number after this point uses only that set.

### 3. Establish the client's own benchmark

Run steps 1–2 across the competitive set. Every threshold in the final report comes from **this** data, not from published medians.

This matters more than it sounds. The most-cited internal-linking numbers come from 38 B2B SaaS sites whose top-linked pages were mostly documentation. A wealth advisor, a medical practice, and a DTC brand have no documentation tree. Telling a client they fail a SaaS benchmark is worse than saying nothing.

Record per competitor: median contextual inbound links per page, orphan rate, top-5% link concentration, and share of content pages linking to a money page in body copy.

### 4. Qualify before you link

Classify every page: **keep / consolidate / retire**.

Retire or consolidate: thin pages, duplicates, outdated posts, and cannibalising pairs (two pages targeting the same intent). Linking to a page that shouldn't exist spends attention on the wrong inventory.

No published playbook includes this step, because the tools that sell these playbooks push fixes to a CMS and have no way to make this judgement. It is the highest-leverage step in the list.

### 5. Name the money pages, map upward

Build the **topic map** (`assets/topic-map.csv`). One row per page planned or kept:

Topic · page role (pillar / supporting / money / study / author) · question the page answers · URL · parent pillar · destination money page · owner · status.

The map is a client-legible deliverable in its own right. Lead the readout with it.

### 6. Clear the orphans, then hit four

**Orphans first.** Zero-inbound-contextual-link pages are the cheapest activation available — a page with no internal links and no backlinks has no route in at all. Published rates: orphans ranked 11.1% of the time vs 23.3% for linked pages.

**Then bring every priority page to four contextual inbound links.** The observed gradient:

| Contextual inbound links | Share of pages ranking |
|---|---|
| 0 | 10.8% |
| 1 | 12.3% |
| 2–3 | 15.5% |
| 4–10 | 25.7% |
| 11–30 | 31.1% |

Four is a **working target from observational data, not a formula**. People link to pages they already believe in, so some of this gradient is reverse causality. State that caveat in the deliverable — it costs nothing and it is the difference between a defensible report and a sales sheet.

Write every planned link into the **link ledger** (`assets/link-ledger.csv`) before implementing: source, destination, anchor, reason a reader needs the destination, owner, status, last checked.

### 7. Route the body copy to revenue

At least one in-article link from every qualifying content page to a relevant money page, placed where a reader would actually want it.

The median site has **zero** blog pages linking to a money page from body copy. This is the widest gap between what's easy and what's done. It improves conversion whether or not it moves rankings, which makes it the one step that pays under every interpretation of the evidence.

### 8. Concentration check

Report the share of contextual links held by the top 5% of pages, and name the top 20 destinations. On a typical site 20 pages hold half of all links.

Review those 20 before adding more: are they genuine priorities, or pages that simply appear everywhere and survived the filter? Falling concentration over time is the signal that the tail is being activated.

## Reporting

Report these, monthly. **Position is deliberately absent.**

| Metric | Definition |
|---|---|
| Eligibility rate | Share of live pages ranking for ≥1 query. The headline number. |
| Queries per ranking page | Median. The clearest secondary effect of contextual links. |
| Orphan count | Absolute, from a complete crawl. Should trend to zero. |
| Revenue route coverage | Share of content pages with ≥1 body link to a money page. |
| Concentration | Top-5% share of contextual links. Falling is good. |
| Money-page sessions and conversions | The only outcome that pays. |

Deliverables: topic map, link ledger, orphan list, concentration report, money-page routing audit, benchmark comparison against the client's own competitive set.

## Guardrails

- Never promise position movement from internal linking. The evidence does not support it.
- Never quote SaaS benchmarks to a non-SaaS client. Generate the benchmark in step 3.
- Never report orphan rates from a capped crawl.
- Never rewrite anchors to be "varied" as an optimization task. Uniformity is a diagnostic signal about template contamination.
- Never skip step 4. Linking thin pages is worse than leaving them orphaned.
- When citing a statistic, check it against `references/evidence.md` first. Several commonly repeated claims are graded *doesn't hold* there.
