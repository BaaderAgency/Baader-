# Evidence grading

Every claim this skill is built on, graded against the evidence as published. Check here before quoting any number to a client.

**Sources.** Two observational studies by @borjafat, August 2026.
**Study A** — topical authority: 41 commercial searches, ~12 competitors each, matched against a keyword index.
**Study B** — internal linking: 534,888 internal links, 38 B2B SaaS sites, 16,960 pages, matched against DataForSEO US organic.

Both articles end in a CTA for the same product — a tool that crawls a site, separates template from contextual links, finds orphans, and pushes fixes to a CMS. That doesn't disqualify the work. It does explain which findings got a confident frame and which got a hedge, and it explains why neither playbook contains a "is this page worth linking to" step.

Neither study has been independently replicated. Both are observational throughout — every directional finding is consistent with reverse causality.

---

## Holds — safe to cite

| Claim | Source | Note |
|---|---|---|
| Median site has zero blog pages linking to a money page from body copy | A | Descriptive count. The most actionable fact in either study. |
| 64.6% of pages have no external site linking to them | B | Direct count. For most pages backlinks aren't the lever, because there are none. |
| Internal links have ~zero relationship with position once a page ranks (ρ = −0.012, p = 0.55) | B | Cleanly reported null. The foundation of this skill's framing. |
| Template links barely separate ranking from non-ranking pages (0.510 AUC) vs body links (0.612) | B | Right comparison, honestly reported. Note 0.612 is *modest* discrimination — cite it as a real but small signal, not a strong one. |
| Two-thirds to 86% of internal links are template, nav or footer | A + B | 67.8% and 86%. The gap is definitional (different filters), not a contradiction. |
| Statistics pages and author bylines earn links, not rankings | A | 2.13× and 2.19× referring domains, no independent ranking lift. Correctly caveated by the author. |

## Directional — cite with the caveat attached

| Claim | Source | Why it needs a caveat |
|---|---|---|
| 4+ contextual inbound links → 24.7% rank rate vs 12.2% | B | Consistent inside 27 of 33 sites, which is a real robustness check. But people link to pages they already believe in — the arrow plausibly runs both ways, and the author says so. Use 4 as a working target, never as a causal claim. |
| Link concentration: 20 pages hold half of all internal links; top 5% hold 68.1% | B | Believable, but the top-linked pages were 191 documentation and 137 landing pages. That's a SaaS shape. Regenerate for the client's vertical. |

## Unreliable — do not cite

| Claim | Source | Problem |
|---|---|---|
| 23.2% of pages are orphans (32.9% full sample) | B | A 500-page crawl cap on sites averaging ~446 pages means most crawls are truncated. Truncation manufactures orphans *and* undercounts inbound links across all buckets. The 32.9% figure is unusable; the author flags the orphan number but not the link-count buckets, which have the same problem. |
| Covering a second topic costs nothing measurable | A | A null presented as a finding. 62 matched pairs at a 60% win rate is not significant, and sites that can staff five topics are better-resourced sites. Absence of a detected penalty is not evidence of no penalty. |

## Doesn't hold — actively correct this if a client repeats it

**"Varied anchor text lifts ranking rate to 42.2% from 17.3%."** (Study B)

The largest gap in either article and the least caveated. The template filter only removes links whose destination appears on ≥50% of pages — a sidebar or related-posts module hitting 40% survives it, and produces exactly the observed signature: ~59 links, one anchor string. So "identical anchor" is most likely a *residual template detector*, and "varied anchors" a proxy for "genuinely linked from many different articles by many different writers."

Practical consequence: this skill uses anchor uniformity as a **diagnostic**, and never as a rewrite task. Telling a client to go vary their anchors produces keyword-stuffed anchor text, which is a real over-optimization risk with no supporting evidence.

**"Topic depth beats backlinks; backlinks stop mattering once depth is controlled."** (Study A)

Two independent failures:

1. *Circularity.* "Topic depth" is defined as how many searches the site already appears for on that topic — then used to predict where it ranks for a search on that topic. The predictor is the outcome measured a second way. Controlling for it absorbs backlinks by construction, which is exactly what was observed (0.174 → 0.020).
2. *Range restriction.* Every site sampled was already in the top 12 for a commercial search, so they all have substantial backlink profiles. Measuring the effect of backlinks inside a pool pre-selected on backlinks understates it severely. The group where links would visibly matter — sites that never reach page one — was excluded by design.

The defensible version: *among sites that already have enough links to compete, more links is not the differentiator.* Real, useful, much smaller.

**"43,300 AI mentions in 3 months."** (Study B headline)

Appears in the headline and nowhere in the article. The study is entirely Google organic via DataForSEO and contains no AI-mention data of any kind. Do not repeat, and do not copy the pattern.

---

## The contradiction neither article resolves

Study A argues coverage and internal structure drive **position**. Study B finds internal links have no measurable relationship with position at all once a page ranks — only with whether it ranks, and how many queries it ranks for. Same author, days apart, never reconciled.

Reconciled, they describe a **threshold effect**: internal links get a page into the game, and don't win it. That is the foundation of this skill, and the reason the reporting section excludes position.

## Open questions our own crawl should settle

1. Does the four-link threshold survive outside B2B SaaS? Financial advice, medical and service-business sites have no documentation tree and a fraction of the page count.
2. What is the real revenue-route baseline per vertical? If Study A's "zero" replicates in wealth management and medical, that becomes our number, from our data.
3. Does the anchor-text gap collapse under the tighter ≥30% + uniformity filter? If it does, we've corrected a published finding — that's the publishable asset.
4. Does orphan clearance precede money-page conversion lift, with what lag? Nobody has published this, and it's the only version of the argument a client actually cares about.
