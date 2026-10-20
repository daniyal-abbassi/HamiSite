# Data Model: Performance Evidence

No application database entity or schema change is planned. Existing Product, Variant, Cart, Order, User, and Partner records retain their definitions and authority.

## MeasurementProfile

Fields: profile ID; timestamp; source commit and dirty-diff identity; exact browser/runtime versions; base URL and build identity; viewport; processor slowdown; download/upload limits; latency; reduced-motion and theme settings; server/data snapshot description; browser cache policy; server warm-state policy.

Validation: explicit units; baseline and final profiles must match except build identity. Secrets, session tokens, and customer-identifying data must not be recorded. Match server warm state for the primary comparison; report cold server starts separately.

## RouteSample

Fields: sample ID; profile ID; route key; exact URL; public or approved account alias; product/category/bundle IDs; fresh/returning state; repetition number; principal-content selector; content-ready time; LCP; CLS; request failures; diagnostic transfer bytes; trace and screenshot paths; verification status and limitation reason.

Validation: five fresh and five returning valid samples per route and phase. A placeholder, authentication redirect, failed principal image, or wrong content state is not a valid successful-route sample. Keep failed attempts with reasons and replacements; never silently discard slow samples. Content-ready time is navigation start to the designated real content becoming visibly usable. LCP is separate because the principal content is not always the largest painted element.

## InteractionSample

Fields: sample ID; route/profile references; action name; sequence/repetition; input timestamp; visible-feedback timestamp; completion timestamp; final-state assertion; error; trace reference.

Validation: at least 20 repetitions per action under the same profile. Feedback is the first visible confirmation/pending state; completion requires actual data/state readiness. Pending feedback does not count as final results. Values are milliseconds. p95 uses sorted samples at index ceil(0.95*n), counted from one.

## OptimizationFinding

Fields: finding ID; affected routes; measured cost and source; hypothesis; candidate file locations; relevant skill rule; chosen change or rejection reason; semantic guard; baseline/final sample IDs; test and visual evidence; status.

State: observed -> measured -> selected or rejected -> implemented -> validated or reverted. Static candidates remain observed until measured. A rejected finding is not an unfinished implementation task if its decision and evidence are recorded.

## JourneyComparison

Fields: comparison ID; baseline/final profiles; route and interaction sample references; absolute/relative change; applicable SC IDs; functional outcomes; screenshot pairs; owner assessment; unresolved limitations.

State: baseline-pending -> baseline-recorded -> final-recorded -> reviewed -> accepted. A missing authenticated route, failed target, or unverified owner review prevents full acceptance. Improvement percent = (baseline - final) / baseline * 100; zero/invalid baselines cannot produce a percentage.
