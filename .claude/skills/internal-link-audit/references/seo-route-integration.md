# Wiring into Route H-SEO

Paste the block below into `H-SEO/SKILL.md`, in whatever section handles routing or "which capability to use." It encodes the sequencing so the SEO route hands off at the right moment instead of running end-to-end and wasting work.

Local path on Jesse's machine: `/Users/baader/Documents/Baader Orchestration Hub/Routes/H-SEO`

---

## Handoff: internal linking and page qualification

Route H-SEO does not handle internal link architecture, orphan detection, or page qualification. The `internal-link-audit` skill does, and it runs **in the middle of this route**, not before or after it.

**When any of these apply, stop and hand off:**

- The request involves internal linking, orphan pages, pillar/cluster structure, topic maps, link concentration, anchor text audits, or site architecture
- The client has a large content library that is underperforming ("200 blog posts doing nothing")
- A full-site audit has surfaced pages that rank for nothing
- Work is about to begin on on-page optimization for more than a handful of pages

**Order of operations on any full-site engagement:**

1. **H-SEO — data acquisition only.** Site audit crawl, Semrush/Ahrefs pull, Search Console connection, competitor set. Stop here. Do not start on-page or article optimization.
2. **Hand off to `internal-link-audit`.** It consumes the data from step 1 rather than re-collecting it. Its step 4 produces a keep / consolidate / retire verdict for every page.
3. **Return to H-SEO for on-page and article optimization** — but only on pages that survived qualification.

**Why the order matters:** optimizing an article before qualification means paying for work on pages that are about to be consolidated or retired. The qualification verdict is the gate that prevents that, so it must land before content work begins.

**Two exceptions:**

- **Sitemap generation always runs after `internal-link-audit`.** Consolidation and retirement change the URL set; a sitemap built earlier is stale on delivery.
- **AEO / GEO / answer-engine work is independent.** It does not depend on the internal link graph and can run at any point in the sequence.

**Reporting boundary:** `internal-link-audit` reports eligibility (does a page rank at all, for how many queries) and never promises position movement. Do not merge its metrics into a position-based H-SEO report — the underlying evidence does not support internal linking as a position lever.
