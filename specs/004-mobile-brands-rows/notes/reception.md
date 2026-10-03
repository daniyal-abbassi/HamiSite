# Reception: SC-011

**Status: not measured. Blocked on human reviewers.**

SC-011 reads: *"At least 7 of 10 reviewers judge the section more premium and considered than its
current form, and fewer than 2 of 10 judge it busier."* It is a claim about what ten people think.
Nothing in this repository can produce that, and an agent answering on their behalf would be exactly
the kind of invented evidence Constitution I and FR-02x forbid — a number that looks measured. So the
table below is empty on purpose, and the instrument is written out so the run takes ten minutes rather
than requiring a redesign of the task.

## The instrument

Show the two images side by side, unlabelled, in randomised order, and ask two questions per pair.
Both are already captured at the same 360px width and the same scroll position, so the comparison is
like for like:

| | file | what it is |
|---|---|---|
| Before | [`baseline/brands-360.png`](../baseline/brands-360.png) | The T001 baseline: wordmark wall of nine Latin names, eight of them `disabled`, one story card showing Apple |
| After | [`baseline/brands-us2-rest-360.png`](../baseline/brands-us2-rest-360.png) | The shipped section at rest: six rows, ordinal, mark, Persian name, product count, expand control |

A third image is available if the reviewer wants to see the section answering rather than resting:
[`baseline/brands-us2-emphasis-360.png`](../baseline/brands-us2-emphasis-360.png).

**Questions, in Persian, one of three answers each:**

1. کدام‌یک از این دو، حس «فروشگاه معتبرتر و باسلیقه‌تر» را بیشتر می‌دهد؟ — *اولی / دومی / تفاوتی ندارد*
2. کدام‌یک شلوغ‌تر است؟ — *اولی / دومی / تفاوتی ندارد*

Pass requires ≥ 7 of 10 choosing the second image on question 1, and ≤ 1 choosing the new section as
busier on question 2.

## Results

| # | Reviewer | More premium | Busier |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |

**Verdict:** not yet recorded.

## What is known without the panel

The measurements in [validation.md](./validation.md) settle everything SC-011 is *not* about: the
section is uniform at 115px per row, its resting geometry is unchanged by interaction, nothing animates
unseen, reduced motion loses no content, all twelve accessible names are Persian, and every one of the
six destinations returns only that brand's products.

Two things a reviewer should be told, because they are judgement calls the measurements cannot settle
and an owner may want reversed:

- **The section is ~250px taller on a phone than the version it replaced.** Reserving the story space
  at a fixed height is what feature 004's research decision D5 requires; the alternative — letting the
  row grow — is what FR-011 forbids. The height is the price of that constraint, and 115px rows leave
  air under the resting name.
- **The three written stories were shortened to one clause each** (89/84/75 characters → 48/38/40) so
  they fit the reserved band. The meaning is unchanged; the subordinate clauses are gone.

## SC-012, for the same reason

*"At least 8 of 10 reviewers describe the page as coherent rather than busy"* with three motion systems
active. Also not measured, and additionally **not yet possible**: feature 002's scroll ground is
unimplemented, so only two of the three systems exist.
