# `research/` — where written-up research goes

**Retired 2026-10-04 as a role, kept as a convention.** This was the lane of a third, read-only research
agent; the multi-agent layer is gone and one agent works in this checkout now. The format below still applies
whenever research is written up — findings land in this folder, not scattered through source or spec prose.

A research pass still does not edit source, specs, tasks or notes: it writes a file here and reports. For
what the project is, the owner's own words and the non-negotiables, read
`specs/001-premium-rtl-storefront/spec.md` (and §1–§3 of `notes/parallel-agent-plan.md`, retired as
instructions but still the clearest statement of intent).

## What a good deliverable looks like

One file per question: `<slug>.md`, e.g. `rtl-luxury-references.md`. Every claim carries its evidence:

```
**Finding:** <the thing you concluded>
**Evidence:** <URL / spec section / measured number / quoted text, with date>
**Confidence:** high | medium | low  — and what would change it
**Affects:** <T-id or file, if anything>
```

Three rules that matter more than the format:

1. **Distinguish what you read from what you inferred.** If a page says X and you concluded Y, say both, and
   label the second one. An inference dressed as a citation is the failure mode of this job.
2. **Say "I could not find it."** An empty answer is a real answer. Do not fill a gap with something
   plausible. The two agents here have each been burned by a confident claim that turned out to be a guess.
3. **Contradictions are the most valuable thing you can bring back.** If a source disagrees with something
   written in `notes/`, in a spec, or in a code comment — especially if it contradicts the owner — that goes
   at the top of your file, not in a footnote.

## Where the work lands

Report the file name and the three findings that matter most, in the reply. There has been no board to post
`DONE` on since 2026-10-04 — what survives gets promoted into `specs/001-premium-rtl-storefront/notes/`, and
chatter stays out of the repo.

## The four questions, in the order they are worth most

One file each: `competitor-grounds.md`, `pointer-coarse-reliability.md`, `listing-entrance-lcp.md`,
`oxblood-on-ivory.md`.

1. **What do the actual competitors do about ground?** Persian RTL electronics retail — Digikala, Technolife,
   MeghdadIT, X-store, and any Iranian brand storefront you can reach. Specifically: does the page hold one
   dark ground, alternate light and dark chapters, or go light with dark accents? The pair needs to know
   whether "dark page with paper chapters" is a convention in this market or something we invented. Screenshots
   and URLs, and describe what each is doing rather than what it feels like.
2. **Does `@media (pointer: coarse)` actually fire on the devices this shop's customers use?** Android Chrome,
   Samsung Internet, iOS Safari, and Android builds without Google services. Any documented case of a phone
   reporting `fine`, or a touchscreen laptop reporting `coarse` and getting 44px controls it does not want?
   T093 moved the entire touch-target policy onto that query; the question is what it misses.
3. **Entrance choreography for a server-rendered listing that must not delay LCP** (T113). Current,
   browser-supported practice — CSS-only keyframes on first paint, `@starting-style`, View Transitions — and
   the documented ways each causes a flash of hidden content or a worse LCP. The products are in the served
   HTML, so a JS-gated reveal would throw that property away.
4. **Saturated dark red as text on warm ivory.** `#640211` on `#f4f1ea` measures 11.94:1, which passes
   everything WCAG asks. What do readability sources say beyond the ratio — halation on warm grounds,
   chromatic aberration at small sizes, long-form versus display? If the evidence is "fine for headings, wrong
   for body", that changes T116's type scale and the partner needs to hear it before the next chapter lands.

## Things NOT to research

- Whether to make the site light-themed. **Settled by the owner: no** (2026-09-23), and *use white somewhere*
  **also settled: yes, as paper chapters inside the dark page** (2026-09-24). Do not reopen either.
- Whether the AI-polished shop photograph is honest. **Settled: the owner chose it over the provenance
  objection on 2026-09-24.** The record is `notes/owner-decisions.md` §2. Do not relitigate it; if you find
  a *legal* exposure (not a taste one), that is new and worth a board message.
- Anything that requires running a build, installing a dependency, or touching the dev server on :3000 — two
  other agents are using it.
