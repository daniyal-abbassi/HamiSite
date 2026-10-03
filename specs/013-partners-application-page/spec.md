# Feature Specification: Wholesale Partners Application Page

**Feature Branch**: `013-partners-application-page`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "the wholesale partners page (/partners) brought up to the storefront's standard — the one shopper-facing page that never went through the redesign."

## Why this feature exists

`/partners` is where another shopkeeper asks to buy from Hami wholesale. It is the only page a
**business** reads rather than a consumer browsing for a phone, and it is the only shopper-facing page
that never went through the storefront redesign.

Auditing it before writing this spec found something larger than styling. **A company cannot apply.**
The application form has two branches — a person trading under their own name, and a registered
company. The company branch collects eleven details and the shop's documents, but the company's **own
name is never asked for**, while both the page's own checks and the receiving endpoint treat it as
mandatory. A company applicant therefore fills in everything, submits, and is told the company name is
required — against a field that does not exist on the page and cannot be reached. There is no way to
complete the application as a company, and no way to discover why.

That is the first thing this feature fixes. The redesign of how the page looks comes second, and the
third thing is making sure the applicant is told the truth about what happens next exactly once.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A company can actually apply (Priority: P1)

A purchasing manager at a registered company opens the page, chooses the company branch, and fills in
the company's identity: its name, its 11-digit national company identifier, its 12-digit economic code,
its registered address, and the two documents. They submit, and the application is received.

Today they cannot. The company's name is never asked for, and its absence is reported as an error on a
field that is not on screen.

**Why this priority**: It blocks the entire purpose of the page for half its audience. No visual or
copywriting improvement matters while the form cannot be completed, and unlike a slow or ugly page, a
silent dead end loses the enquiry permanently — the applicant has nowhere else to send it and no way to
know the shop would have wanted it.

**Independent Test**: Open the page, select the company branch, complete every field the page presents,
attach the required documents, and submit. Success means the application is accepted. Today it must
fail, and the failure must name a field the applicant can see and fill.

**Acceptance Scenarios**:

1. **Given** the company branch, **When** the applicant looks at the form, **Then** the company's name is
   one of the fields presented, and it is marked as required like the others.
2. **Given** the company branch with the company name left empty, **When** the applicant submits,
   **Then** the message points at the visible company-name field and focus can reach it.
3. **Given** the company branch fully completed, **When** the applicant submits, **Then** the application
   is received and the applicant sees a confirmation.
4. **Given** the sole-trader branch, **When** the same test is run, **Then** it still works exactly as it
   does today — this feature must not regress the path that currently functions.

### User Story 2 — The page reads as part of this shop (Priority: P2)

A shop owner arrives from the homepage footer and reads the page on a phone. Nothing on it suggests a
different, plainer website: the language, the headings, the spacing and the buttons belong to the same
storefront that sells the phones.

**Why this priority**: The page works, and being trusted with someone's business documents depends on
looking like a real company that will still exist next month. But it is second because a beautiful page
that a company cannot submit to is worth nothing.

**Independent Test**: Read the page at 360 px on a phone and compare it against the homepage. Every
piece of text a shopper reads is in Persian; the type, spacing and controls match the rest of the site;
and the form is usable with one thumb.

**Acceptance Scenarios**:

1. **Given** the page header, **When** a Persian reader looks at the small label above the title,
   **Then** it is Persian, not the English "FOR BUSINESS / APPLICATION" that is there now.
2. **Given** any text on the page, **When** it is Persian, **Then** it carries no letter-spacing and no
   capitalisation transform, matching the rule the rest of the storefront already follows.
3. **Given** the page at 360 px, **When** the applicant scrolls, **Then** no control sits under the
   navigation bar that is fixed to the bottom of the screen, and every field can be reached and typed
   into.
4. **Given** the two document uploads, **When** the applicant reads what is required of them, **Then**
   the accepted formats and the size limit are legible without zooming.

### User Story 3 — The applicant knows what happens next, once (Priority: P3)

A applicant wants to know what they are agreeing to. Today the page tells them twice, in two different
sets of words, with a numbered three-step process near the top and a separate "after submission" card
in the sidebar describing the same journey differently.

**Why this priority**: It is a trust problem rather than a function problem, and it is third because a
confusing promise is better than a broken form. It is still worth fixing: two versions of one promise
read as a page that was assembled rather than written.

**Independent Test**: Read the page top to bottom and count how many times the applicant is told what
happens after they submit. It must be once, in one set of words.

**Acceptance Scenarios**:

1. **Given** the finished page, **When** the applicant reads it, **Then** the process after submission is
   described in one place only.
2. **Given** that description, **When** it says wholesale pricing is activated after verification,
   **Then** the claim remains — it is backed by the shop's real pricing structure — and no stronger claim
   is added beside it.

---

### Edge Cases

- **A sole trader who is also registered.** The page asks everyone for a 10-digit personal national
  identifier, and the company branch additionally asks for the company's 11-digit one. Both are required
  by the receiving endpoint, so the personal field is correct for companies too — but it must be labelled
  so a company applicant understands it means the signatory, not the company. Today both are simply
  "کد ملی" and "شناسه ملی شرکت" in different places, and the first is shared between branches.
- **Digits.** Every identifier is typed by an Iranian applicant who may enter Persian or Latin digits.
  What is stored and what is displayed must follow the site's existing rule, and a mistyped identifier
  must be reported against the field it belongs to.
- **Documents that are too large, or the wrong type.** The limit is 10 MB each across JPG, PNG, WebP and
  PDF. The applicant must find out before submitting, not after.
- **Losing the form.** A company application asks for eleven pieces of information and two photographs.
  A validation failure must never discard what was already typed.
- **Slow connection, mid-submit.** Submitting two documents takes time on a mobile connection; the
  applicant must know the page is working and must not be able to submit twice by accident.
- **Screen readers.** The branch choice is presented as two alternatives and must announce which is
  selected; the document uploads must say what is required of them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The company branch MUST present a field for the company's name, and that field MUST be the
  one reported when it is left empty. A company applicant MUST be able to complete and submit the
  application using only fields the page shows them.
- **FR-002**: The sole-trader branch MUST continue to accept applications exactly as it does today, with
  no change to which details are collected or required.
- **FR-003**: Every identifier the form asks for MUST be labelled so that the applicant knows whose
  identifier it is — the person's or the company's — wherever the same form serves both.
- **FR-004**: All text a shopper reads on this page MUST be Persian. No English label, eyebrow or
  placeholder may remain, matching the rule already enforced across the rest of the storefront.
- **FR-005**: Persian text on this page MUST carry no letter-spacing and no capitalisation transform.
- **FR-006**: The page MUST be usable at 360 px on a phone: every field reachable and typeable, no
  control hidden beneath the fixed bottom navigation, and document requirements legible without zooming.
- **FR-007**: The process that follows submission MUST be described once, not twice, and the two existing
  descriptions MUST be reduced to one.
- **FR-008**: The page MUST make no claim beyond what the shop can support. The existing promise that
  wholesale pricing is activated after verification stays as written; no new assertion about partnership,
  official status, pricing or stock may be added.
- **FR-009**: A failed submission MUST preserve everything the applicant already entered, and MUST report
  each problem against the field it belongs to.
- **FR-010**: The applicant MUST be able to tell, without guessing, that their submission was received.
- **FR-011**: The page's appearance MUST be consistent with the rest of the storefront — the same
  headings, spacing, buttons and register as the pages a shopper reaches before and after it.
- **FR-012**: The branch choice MUST announce which of the two is currently selected to a screen reader,
  and every control MUST be reachable and operable from the keyboard alone.

### Key Entities

- **Wholesale application** — one submission from one business: who is applying, under which legal form,
  their identity numbers, their shop or company address and contacts, and their documents.
- **Legal form** — exactly two: a person trading under their own name, or a registered company. The form
  determines which identifiers and which documents are required.
- **Identity identifiers** — a person's 10-digit national number; a company's 11-digit national
  identifier and 12-digit economic code. Whose identifier each one is must be unambiguous on the page.
- **Supporting document** — a photograph or scan of a lease, a trade licence, a change notice, depending
  on the legal form. JPG, PNG, WebP or PDF, at most 10 MB each.
- **The promised process** — what the shop does after submission: review, contact, activation. Told once.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A company applicant completes and submits an application end to end, **5 times out of 5**
  attempts, using only fields the page shows. Today this succeeds **0 times out of 5**.
- **SC-002**: Sole-trader applications continue to succeed at the same rate as before this change — no
  regression on the path that already works.
- **SC-003**: **Zero** English strings remain on the page, and **zero** Persian strings carry
  letter-spacing or a capitalisation transform.
- **SC-004**: At 360 px, **all** fields and both document controls are reachable and operable, and **no**
  control is covered by the fixed bottom navigation.
- **SC-005**: The post-submission process is described in exactly **one** place, down from two.
- **SC-006**: On a submission rejected for a missing or malformed detail, the applicant is told which
  field, the field is visible and reachable, and **nothing they typed is lost** — measured on every
  field the form contains.
- **SC-007**: A reader who has never seen the site, shown this page and the homepage side by side, says
  they belong to the same shop.
- **SC-008**: **Zero** claims appear on the page that the shop cannot support; the existing verified
  promise is unchanged in strength.

## Assumptions

- **The receiving endpoint is not part of this feature.** It is frozen, and this work changes only what
  the page asks for and how it looks. Where the endpoint requires a detail the page never asked for —
  which is the whole of the company-name problem — the page gains the field, not the endpoint a new rule.
- **The company name is genuinely required**, not optional with a default. Both the page's own checks and
  the endpoint insist on it, and a wholesale account without a company name is not meaningful.
- **Both national identifiers are required for a company**: the person's, as the signatory, and the
  company's. The endpoint asks for both, so the page keeps both and labels them clearly rather than
  dropping one.
- **The documents are photographs of paper records**, taken on the same phone the application is
  submitted from. That is why legibility and thumb reach at 360 px are requirements rather than polish.
- **No applicant accounts exist yet on this page** — a submission is an enquiry, not a login. Activation
  happens off-page, as the copy already says.
- **Wholesale pricing is real.** Price tiers, settlement terms, credit limits and business-verification
  records all exist in the shop's data, so the page's promise is kept as written rather than softened.

## Out of Scope

- Any change to the receiving endpoint, its validation rules, or what happens to an application after it
  arrives.
- An applicant account, application status tracking, or a portal to see previous submissions.
- Changing which documents are required, or their size and format limits.
- Any other page. `/shop` is a separate feature.
