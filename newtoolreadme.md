The README for the Visit, Study and Work finders is ready. It covers question flows, the visa catalogue, data model, UI, lead capture, SEO, testing, acceptance criteria and a delivery plan of about 3 weeks. I checked that the Visit (17) and Work (37) catalogues match the official counts.

My assumption: I wrote this for Migration Republic, with the tools on immigrationagentnearme.com/tools/* because your existing calculators are there. They’d be linked from the Tools menu on migrationrepublic.com.au. If you meant another website, the requirements still apply, but the routes and integration sections need changing.

Before you build:

Don’t embed or copy the government tool: build your own flow and dataset, with no iframe or scraping. Most of the content can be reused with attribution to the Department of Home Affairs, but never use the Coat of Arms or the Department logo.
Not every path is mapped: I walked the main paths on the official tool. The Work options other than skilled still need walking, and the mappings not yet confirmed are marked Proposed.
Some listed visas may be closed: the official list still shows 188, 187 and 489, but third-party sources report them closed or replaced, and the official pages didn’t confirm it. Ali needs to decide whether to show, label or hide them.
Passport lists aren’t included: eligible countries for 601, 651, 417 and 462 change often, so they need to come from current official sources.
Ali must sign off: I couldn’t read the full Code of Conduct, so he should check the disclaimer and result wording against it.

The Study tool has only one official question, so I proposed adding age and current location to give you better leads.

# Visa Finder Tools: Visit, Study, Work

End-to-end requirements for three guided visa-finder tools, modelled on the question flow of the Australian Government's [Explore visa options](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder) page.

| | |
|---|---|
| **Client** | Migration Republic (MARN 2518961) |
| **Built by** | BSH Solutions |
| **Target site** | `immigrationagentnearme.com/tools/*` (Next.js), linked from the Tools menu on `migrationrepublic.com.au` (WordPress) |
| **Research date** | 2 November 2026 |
| **Status** | Requirements. Visa data needs sign-off from the registered agent before launch |

> **Assumption:** the tools live on immigrationagentnearme.com because the existing calculators and quizzes are already there. If they should live on migrationrepublic.com.au instead, the requirements are unchanged, but section 8 needs a WordPress embed (section 8.4).

---

## 1. What we are building

Three tools that take a visitor from "I want to come to Australia" to a short list of possible visas in under a minute, then convert them into a consultation.

| Tool | Route | Questions | Official result pool |
|---|---|---|---|
| Visit and Tourism Visa Finder | `/tools/visit-visa-finder` | Up to 3 | 17 visa options |
| Study Visa Finder | `/tools/study-visa-finder` | 1 official, 3 proposed | 3 visa options |
| Work Visa Finder | `/tools/work-visa-finder` | Up to 3 | 37 visa options |

Plus a hub at `/tools/visa-finder` showing the three cards.

### Goals

1. Generate qualified consultation leads.
2. Rank for visa-finder search intent and be citable by AI answer engines.
3. Link users into existing Migration Republic visa pages.

### Non-goals (v1)

- Eligibility decisions or grant likelihood
- Visa application or document upload
- Secondary applicants (partner, children)
- The other six official categories: Live permanently, Partner/family, Stay longer, Refugee, PNG Chiefs, Other visas
- Live fee or processing-time feeds

---

## 2. Three rules that shape the build

### 2.1 Do not embed or scrape the government tool

- Build our own flow with our own dataset. No iframe.
- No public API turned up during research. Treat the data as manually curated.
- The Home Affairs site warns that unauthorised use could lead to prosecution without defining it, so do not run automated scrapers against it.

### 2.2 Copyright and branding

- Most Home Affairs website content is CC BY 3.0 AU. Attribute it as **"Australian Government Department of Home Affairs"**.
- **Never use** the Coat of Arms or the Department logo.
- Rewrite card text and help text in our own words. Do not imply the tool is a government product.

### 2.3 Results are options, not advice

The official tool states that it makes no recommendation and gives no guarantee. Ours must hold the same line, with extra care because a registered agent's name sits next to it.

- Say "options to explore". Never "you qualify", "you are eligible" or "best visa for you".
- Show a disclaimer on every results screen (section 7.5).
- Ali must sign off the logic and wording. He should check them against the Migration Agents Code of Conduct, which was not reviewed clause by clause for this document.

---

## 3. User journey

```text
Entry (hub, ad, SEO page, or Tools menu)
  -> Choose Visit / Study / Work
  -> Answer one question per screen (progress bar, Back, change answers)
  -> Live "N options may suit you" counter
  -> Results list
       -> Compare cards, expand details
       -> "Read the full guide" -> Migration Republic visa page
       -> "Book a Consultation" -> lead form with answers attached
  -> Confirmation + email summary (with consent)
```

No sign-in. Results are always shown without an email gate.

---

## 4. Question flows

`Verified` means the path was walked on the official tool on 2 Nov 2026. `Proposed` means it is our recommended mapping and needs agent sign-off.

### 4.1 Visit and Tourism

**Q1. What's the main purpose of your visit?** (single choice, each with a help tooltip)

| Value | Label | Proposed result pool |
|---|---|---|
| `holiday` | A holiday | 600 Tourist (both), 600 ADS, 600 Frequent Traveller, 651, 601, 444 |
| `family` | Visiting family or friends | 600 Tourist (both), 600 Sponsored Family, 600 Frequent Traveller, 651, 601, 444 |
| `transit` | Transit | 771 |
| `working_holiday` | Working holiday | 417 and 462 (first, second, third) |
| `event` | Attending an event | 600 Tourist, 651, 601, 444 |
| `conference` | Attending a conference or expo | 600 Business, 600 Frequent Traveller, 651, 601 |
| `business` | Business visitor activities | 600 Business, 600 Frequent Traveller, 651, 601, 444 |
| `medical` | Medical treatment | 602 |
| `volunteer` | Volunteer work | 600 Tourist, 651, 601, 444 |
| `cruise` | A cruise | 600 Tourist, 651, 601, 444 |

The official count after choosing `holiday` is **7** (Verified), matching this proposed pool. The individual cards in that pool were not listed, so confirm them.

**Q2. What's your country of passport?** (searchable combobox of all countries)

- Verified: `holiday` + Pakistan returns exactly two results, 600 Tourist (apply in Australia) and 600 Tourist (apply outside Australia), and the flow ends with no third question.

**Q3. Conditional.** The official tool says "Question 1 of 3" but can finish in two, so Q3 only appears when needed. The official disclaimer mentions age groupings, so **age is the likely Q3** for working holiday paths. This is an inference.

Proposed: ask age band for `working_holiday` (under 18, 18 to 30, 31 to 35, over 35), and skip otherwise.

### 4.2 Study

**Q1. I want to come to Australia to:** (Verified)

| Value | Label | Result |
|---|---|---|
| `full_time` | Study full time | 500 Student |
| `guardian` | Accompany a student as their guardian | 590 Student Guardian |
| `training` | Complete workplace-based or professional development training | 407 Training |

A one-question tool feels thin and gives us little for lead qualification. **Proposed additions** (qualification only, they never remove a visa unless noted):

- **Q2. Age band:** under 6 (flag: the Student visa card says 6 or older), 6 to 17, 18 or over. For `guardian`, ask the student's age instead, since 590 is generally for supporting a student under 18.
- **Q3. Where are you now?** In Australia or outside Australia. Passed to the consultation form.

### 4.3 Work

**Q1. What kind of work will you do?** (Verified labels. Mapping is proposed from the official card ordering.)

| Value | Label | Proposed result pool |
|---|---|---|
| `crew` | Air or sea crew | Crew Travel Authority, 988, 408 Superyacht Crew |
| `event` | Attend or work at a special event/activity | 408 Entertainment, Sporting, Religious Work, Invited Participant, Special Program |
| `business` | Business or investment | 188, 888 |
| `diplomatic` | Foreign government, foreign language teaching or domestic work (diplomatic or consular) | 403 Domestic Worker, 403 Foreign Government Agency, 403 parent |
| `research` | Participate in a research project | 408 Research |
| `post_study` | Post-study work, training and internship | 407, 485 |
| `skilled` | Skilled/highly specialised work | See below |
| `working_holiday` | Working holiday or seasonal work | 417 and 462 (first, second, third) |
| `exchange` | Youth, school or staff exchange program | 408 Exchange Arrangements, 408 Special Program |
| `palm` | Work in a PALM scheme specified industry | 403 PALM |

444 Special Category (NZ citizens) appears in the Work pool, so show it whenever the passport is New Zealand.

**Skilled branch**

| Step | Answer | Official count |
|---|---|---|
| Q1 | Skilled/highly specialised work | 12 (Verified) |
| Q2 "How long do you intend to stay?" | Up to 3 months / Up to 5 years / **Permanently** | 6 for Permanently (Verified) |
| Q3 "How do you intend to apply?" | **Someone is sponsoring you** | 3: 186, 187, 190 (Verified) |
| Q3 | You are applying independently | 3 (count inferred from 6 minus 3) |

The 12 skilled visas: 400, 489, 187, 186, 190, 887, 124, 858, 491, 494, Skills in Demand (482), 189.

Proposed for the unwalked paths:

- Up to 3 months: 400
- Up to 5 years: Skills in Demand (482), 494, 491, 489
- Permanently + independent: pick 3 from 189, 124, 858, 887. There are 7 candidates for 6 slots, so one sits elsewhere. **Agent to decide.**

**Follow-up questions outside skilled** (Q2 and Q3) were not walked. Before coding, walk each of the other nine Q1 options on the official tool and record them in `questions.work.ts`.

---

## 5. Visa catalogue

One shared catalogue powers all three tools, since several visas appear in more than one. Snapshot of official cards on 2 Nov 2026. **Fees change, usually from 1 July. Recheck before launch.**

### 5.1 Visit pool (17)

| # | Visa | Stream | Stay | From (AUD) | Key rule |
|---|---|---|---|---|---|
| 1 | 600 | Approved Destination Status | As granted | 250 | PRC citizens (excl. SARs), organised tour |
| 2 | 600 | Tourist (outside Australia) | 3, 6 or 12 months | 250 | Outside Australia at application and decision |
| 3 | 600 | Tourist (in Australia) | Up to 12 months | 630 | In Australia at application and decision |
| 4 | 651 | eVisitor | 3 months per entry | Free | Eligible passports, apply outside Australia |
| 5 | 601 | ETA | 3 months per entry | AUD20 service charge | App only, **not through an agent** |
| 6 | 600 | Frequent Traveller | Up to 10 years, 3 months per entry | 1,845 | PRC, Brunei, Cambodia, Philippines, Laos, Indonesia, Malaysia, Singapore, Thailand, Vietnam, Timor-Leste |
| 7 | 600 | Sponsored Family | Up to 12 months | 250 | Sponsor is an eligible citizen or PR family member, bond possible |
| 8 | 444 | Special Category | While in Australia | Free | NZ citizens |
| 9 | 771 | Transit | Up to 72 hours | Free | Grant ends most other visas held |
| 10 | 417 | First Working Holiday | 12 months | 840 | 18 to 30 (35 for some countries), eligible passport |
| 11 | 417 | Second Working Holiday | 12 months | 1,000 | 3 months specified work |
| 12 | 417 | Third Working Holiday | 12 months | 1,000 | 6 months specified work |
| 13 | 462 | First Work and Holiday | 12 months | 840 | 18 to 30, ballot for China, India, Vietnam |
| 14 | 462 | Second Work and Holiday | 12 months | 1,000 | 3 months specified work |
| 15 | 462 | Third Work and Holiday | 12 months | 1,000 | 6 months specified work |
| 16 | 600 | Business Visitor | Up to 3 months | 250 | No work or selling goods or services |
| 17 | 602 | Medical Treatment | Temporary | Free offshore, 480 onshore | Treatment, support or organ donation |

### 5.2 Study pool (3)

| Visa | Name | Stay | From (AUD) | Key rule |
|---|---|---|---|---|
| 500 | Student | Up to 6 years, in line with enrolment | 2,500 | 6 or older, full-time course |
| 590 | Student Guardian | Tied to the student's stay and age | 2,500 | Supports a student usually under 18 |
| 407 | Training | Up to 2 years | 535 | Not for people who primarily want to work |

### 5.3 Work pool (37)

| Visa | Options | Stay | From (AUD) |
|---|---|---|---|
| Crew Travel Authority | 1 | 30 days, or 5 days positioning crew | Free |
| 988 Maritime Crew | 1 | While a crew member | Free |
| 408 Temporary Activity | 8: Superyacht Crew, Entertainment, Sporting, Religious Work, Invited Participant, Special Program, Research, Exchange | 3 months to 2 years | 535 |
| 188 Business Innovation and Investment (Provisional) | 1 | Temporary | 1,505 |
| 888 Business Innovation and Investment (Permanent) | 1 | Permanent | 4,375 |
| 444 Special Category | 1 | While in Australia | Free |
| 403 International Relations | 4: Domestic Worker, Foreign Government Agency, PALM, parent listing | Up to 4 years by stream | 315 to 470 |
| 407 Training | 1 | Up to 2 years | 535 |
| 485 Temporary Graduate | 1 | Graduate Work 18 months, Post-Study 2 to 4 years | 1,680 |
| 400 Short Stay Specialist | 1 | Up to 6 months | 535 |
| 489 Skilled Regional (Provisional) | 1 | Up to 4 years | 6,140 |
| 491 Skilled Work Regional | 1 | Up to 5 years | 6,140 |
| 494 Skilled Employer Sponsored Regional | 1 | 5 years | 6,140 |
| Skills in Demand (482) | 1 | Up to 4 years | 4,015 |
| 186 Employer Nomination Scheme | 1 | Permanent | 6,140 |
| 187 Regional Sponsored Migration Scheme | 1 | Permanent | 6,140 |
| 189 Skilled Independent | 1 | Permanent | 6,135 |
| 190 Skilled Nominated | 1 | Permanent | 6,140 |
| 887 Skilled Regional | 1 | Permanent | 630 |
| 124 Distinguished Talent | 1 | Permanent | Nil |
| 858 National Innovation | 1 | Permanent | 6,235 |
| 417 Working Holiday | 3: First, Second, Third | 12 months | 840 to 1,000 |
| 462 Work and Holiday | 3: First, Second, Third | 12 months | 840 to 1,000 |

### 5.4 Data quality warnings

Do not copy the official list blindly.

- **Possibly closed visas.** The official Work list still shows 188, 187 and 489. Third-party sources report 188 closed in July 2024, and 187 and 489 replaced by 494 and 491 with transitional arrangements. The official pages fetched did not state this either way. **Ali to confirm each one.** Show closed visas only with a "Closed to new applicants" label, or hide them.
- **Fee inconsistency.** The 403 cards show AUD470, AUD365 and AUD315 for different listings.
- **State nomination.** 491 pathways can close by state. NSW published a closure notice for Pathways 1 and 3. Use a "check current state status" note instead of implying it is always available.
- **Passport lists** for 601, 651, 417 and 462 are set by legislation and change often. They must come from current official sources, reviewed by the agent. They are deliberately not listed here.

---

## 6. Data model and logic

```ts
// src/features/visa-finder/types.ts
export type ToolId = "visit" | "study" | "work";
export type VisaStatus = "open" | "restricted" | "closed" | "transitional";

export interface VisaOption {
  id: string;                 // "600-tourist-offshore"
  subclass: string | null;    // "600". Crew Travel Authority is null
  name: string;
  stream?: string;
  tools: ToolId[];
  tags: string[];             // match tags, e.g. "purpose:holiday"
  summary: string;            // our own wording
  highlights: string[];
  stay: string;
  feeFromAud: number | null;
  feeNote?: string;
  location: "onshore" | "offshore" | "either";
  status: VisaStatus;
  statusNote?: string;
  passportRule?: { mode: "only" | "exclude"; countries: string[] };
  ageRule?: { min?: number; max?: number; note?: string };
  agentCanAssist: boolean;    // false for ETA, drives the CTA
  guideUrl?: string;          // Migration Republic page
  officialUrl: string;
  lastReviewed: string;       // ISO date
  reviewedBy: string;
}

export interface Question {
  id: string;
  label: string;
  type: "single" | "country" | "ageBand";
  options?: { value: string; label: string; help: string; addsTag: string }[];
  showIf?: (answers: Answers) => boolean;
}
```

```ts
// Pure function, no I/O. Unit test against the matrix in section 11.
export function matchVisas(tool: ToolId, answers: Answers, catalogue: VisaOption[]) {
  return catalogue
    .filter((v) => v.tools.includes(tool))
    .filter((v) => matchesRequiredTags(v, answers))
    .filter((v) => passesPassportRule(v, answers.passport))
    .filter((v) => passesAgeRule(v, answers.ageBand))
    .sort(byOpenStatusThenSortOrder);
}
```

Rules:

- The live counter runs `matchVisas` after each answer.
- A question is skipped when it would not change the results. This reproduces the official "3 questions, sometimes 2" behaviour.
- With an unanswered passport, keep all passport-limited visas. Never hide options because of missing data.
- A zero-result path shows "No listed option matched" with a Book a Consultation CTA, not an error.
- Data is static TypeScript or JSON in the repo, so it is reviewed through pull requests. v2 can move it to a CMS.

---

## 7. UI requirements

### 7.1 Design system

| Item | Rule |
|---|---|
| Colours | Navy `#012269` and red `#E40229` only, plus neutrals |
| Font | Inter |
| Gradients | No amber or brown |
| CTA text | **"Book a Consultation"**, never "Free Consultation" |
| Images | Unsplash, relevant to adjacent text |
| Components | Reuse glass cards, FAQ accordions, step sequences, comparison tables |

### 7.2 Hub

Three cards matching the official layout: title, chevron, one-line description. Rewrite the text. Full card clickable. Stacks to one column on mobile.

### 7.3 Question screen

- One question per screen, with `Question N of M`, recalculated when conditional questions change.
- Radio cards with a tooltip or expandable help on each option. Help text was not captured, so write it fresh.
- Sticky side panel on desktop, bottom bar on mobile: "N options may suit you".
- A "Your answers" list with a Change link for each.
- Continue disabled until answered. Back retains answers.
- "Show all N options" shortcut at any step.
- Line above the form: "Looking for someone else? Answer as if you were that traveller."

### 7.4 Results

Each card shows subclass and stream, summary, stay, fee "from", 2 to 3 highlights, status badge, "Read the full guide" and "Book a Consultation".

- Add a "Fees change. Check the Visa Pricing Estimator" note linking to Home Affairs.
- Add "Change answers" and "Start again".
- If `agentCanAssist` is false (ETA), replace the consultation CTA with a link to the official guidance. The official card says ETAs currently cannot be lodged through an agent.
- Fold 417, 462 second and third visas under the first visa to shorten long lists.

### 7.5 Required disclaimer

Show at the foot of every results screen. Final wording needs Ali's approval.

> This tool gives general information only and is not migration advice. It does not list every visa, consider secondary applicants, or assess eligibility, which depends on legislation, including health and character requirements. Visa rules, fees and eligible countries change. Information is adapted from the Australian Government Department of Home Affairs and is not endorsed by it. Migration Republic, MARN 2518961.

Add a "Verify on the OMARA register" link and a "Last reviewed: [date]" stamp.

---

## 8. Technical architecture

### 8.1 Stack

- Next.js and TypeScript in the existing codebase. Confirm whether it uses App Router or Pages Router. The structure below assumes App Router.
- Server render the landing content. Hydrate the question flow as a client component.
- No new database for answers in v1. Use the existing lead storage.

### 8.2 Structure

```text
src/
  app/tools/
    visa-finder/page.tsx
    visit-visa-finder/page.tsx
    study-visa-finder/page.tsx
    work-visa-finder/page.tsx
  app/api/visa-finder/lead/route.ts
  features/visa-finder/
    components/  FinderShell, QuestionCard, CountryCombobox,
                 ProgressBar, LiveCounter, AnswerSummary,
                 ResultCard, ResultsList, LeadForm, Disclaimer
    data/        visas.ts, countries.ts,
                 questions.visit.ts, questions.study.ts, questions.work.ts
    lib/         matchVisas.ts, analytics.ts, urlState.ts
    tests/
```

### 8.3 State and URLs

- Keep answers in URL params so results are shareable and survive refresh, for example `?purpose=holiday&passport=PK`. Use short codes only. **No name, email or phone in URLs.**
- `robots: noindex` on parameterised URLs, canonical to the base route.

### 8.4 Linking from Migration Republic

Add the four links to the WordPress Tools menu and the tools index. Add contextual CTA buttons on matching visa pages, for example Student page to Study Finder. If the tool must sit on the WordPress site itself, build a standalone JS bundle mounted by shortcode with prefixed CSS (`vf-`), consistent with the project's class-prefix approach.

### 8.5 Lead API

`POST /api/visa-finder/lead`

```json
{
  "tool": "work",
  "answers": { "workType": "skilled", "stay": "permanent", "route": "sponsored" },
  "matchedVisaIds": ["186", "187", "190"],
  "name": "", "email": "", "phone": "", "message": "",
  "consent": true,
  "utm": { "source": "", "medium": "", "campaign": "" }
}
```

- Validate on the server with Zod. Recompute `matchedVisaIds` server-side.
- Bot protection: Turnstile or reCAPTCHA v3 plus a honeypot and per-IP rate limit.
- Send the lead email through Resend from a **subdomain**, to avoid the earlier problem of same-domain mailboxes not receiving Resend email. Confirm SPF, DKIM and DMARC.
- Send a user summary only if they tick the box.

---

## 9. SEO, AEO and GEO

| Route | Primary intent | Title idea |
|---|---|---|
| `/tools/visa-finder` | Australia visa finder | Australia Visa Finder: Explore Your Options |
| `/tools/visit-visa-finder` | Which visitor visa for Australia | Australian Visitor Visa Finder |
| `/tools/study-visa-finder` | Australian student visa options | Australian Study Visa Finder |
| `/tools/work-visa-finder` | Australian work visa options | Australian Work Visa Finder |

- 300 to 600 words of server-rendered content under each tool: how it works, main visas, FAQs.
- JSON-LD: `WebApplication`, `BreadcrumbList`, and `FAQPage` where FAQs are visible.
- Direct answer paragraphs at the top of the content for AI answer engines ("Most visitors to Australia use..."). Show a last-reviewed date.
- Internal links from each result to its Migration Republic guide. Existing guides include 482, 494, 858, 489, 500, 590 and 888. Fill `guideUrl` from the live URLs.
- Add to `sitemap.xml`. Exclude parameterised URLs.

---

## 10. Non-functional requirements

**Accessibility (WCAG 2.1 AA)**

- Real `fieldset`, `legend` and radio inputs, full keyboard support
- Focus moves to the new question heading on each step
- `aria-live="polite"` on the counter
- Combobox follows the ARIA pattern
- Colour contrast checked: red on navy will likely fail, so avoid it for text

**Performance**

- LCP under 2.5s, INP under 200ms, CLS under 0.1 on mobile
- Finder bundle under 80 KB gzipped, excluding framework
- Lazy load the country list

**Privacy**

- Answers are not sent anywhere until the lead form is submitted, except anonymous analytics
- Passport country stays out of analytics unless Ali approves it. Log tool, step and purpose only
- Update the privacy policy, and collect explicit consent on the form
- Have the privacy wording checked against the Australian Privacy Act. Medical purpose is sensitive, so never log it with identifiers

**Browser support:** last two versions of Chrome, Safari, Edge, Firefox, and mobile from 360px.

**Analytics (GA4)**

| Event | Parameters |
|---|---|
| `vf_start` | tool |
| `vf_question_answered` | tool, question_id, step |
| `vf_back` | tool, step |
| `vf_results_view` | tool, result_count |
| `vf_zero_results` | tool |
| `vf_guide_click` | tool, visa_id |
| `vf_cta_click` | tool, visa_id |
| `vf_lead_submit` | tool |

KPIs: start-to-results rate, results-to-CTA rate, leads per tool, drop-off per question.

---

## 11. Testing

**Unit:** one test per row, plus every Q1 value.

| Tool | Input | Expected |
|---|---|---|
| Visit | No answers | 17 options |
| Visit | `holiday` | 7 options |
| Visit | `holiday` + Pakistan | 600 Tourist onshore and offshore only, flow ends |
| Study | No answers | 3 options |
| Study | `full_time` | 500 |
| Work | No answers | 37 options |
| Work | `skilled` | 12 options |
| Work | `skilled` + permanent | 6 options |
| Work | `skilled` + permanent + sponsored | 186, 187, 190 |

If an agent-approved change removes closed visas, update these expected counts and record why.

**Integration:** lead API validation, rate limit, bot check, email delivery.

**E2E (Playwright):** complete each tool, Back and Change retain answers, refresh keeps state, shared URL restores results.

**Manual:** keyboard and screen reader run, mobile devices, Ali's content review of every result card.

---

## 12. Acceptance criteria

- [ ] Three tools and the hub live at the agreed routes
- [ ] Users reach results without giving contact details
- [ ] Results match the agent-approved matrix for every path
- [ ] Counter updates after each answer
- [ ] Every result has a stay, fee note, status, official link and review date
- [ ] Closed visas are labelled or hidden
- [ ] ETA shows no consultation CTA
- [ ] Disclaimer, MARN and Home Affairs attribution appear on results
- [ ] No Coat of Arms or Department logo anywhere
- [ ] No banned wording: "you qualify", "you are eligible", "guaranteed", "Free Consultation"
- [ ] Leads reach the inbox with answers and matched visas
- [ ] No personal data in URLs
- [ ] WCAG 2.1 AA and Core Web Vitals targets met
- [ ] GA4 events fire
- [ ] Links are live on the migrationrepublic.com.au Tools menu

---

## 13. Delivery plan

Rough estimate for one developer with design and agent input.

| Phase | Work | Effort |
|---|---|---|
| 1. Data | Walk remaining branches, build catalogue, agent review | 3 to 4 days |
| 2. Engine | Types, `matchVisas`, tests | 2 days |
| 3. UI | Hub, shell, question, results, responsive | 4 to 5 days |
| 4. Leads | Form, API, email, bot protection | 1 to 2 days |
| 5. SEO and analytics | Content, schema, GA4 | 2 days |
| 6. QA and launch | E2E, accessibility, agent sign-off, WordPress links | 2 to 3 days |

**Total: about 3 weeks.** Ship Work first since it carries the highest-value leads, then Visit, then Study.

---

## 14. Maintenance

| When | Task | Owner |
|---|---|---|
| Each 1 July | Update all fees | BSH with agent check |
| Quarterly | Review status, stay, passports, new or closed visas | Ali |
| On policy change | Update the catalogue within 5 working days | Ali to flag, BSH to update |
| Monthly | Review zero-result paths and drop-off | BSH |

Add a CI warning for any `lastReviewed` older than 120 days.

---

## 15. Open questions

| # | Question | Owner |
|---|---|---|
| 1 | Confirm the target site is immigrationagentnearme.com | BSH |
| 2 | Are 188, 187 and 489 shown, labelled or hidden? | Ali |
| 3 | Which three visas fill Permanently + independent? | Ali |
| 4 | Approve disclaimer, CTA and banned wording against the Code of Conduct | Ali |
| 5 | Where do leads go: existing CRM, inbox, or BSH dashboard? | BSH / Ali |
| 6 | Can passport country be stored with a lead? | Ali |
| 7 | Add the other six categories in v2? | Ali |
| 8 | Keep the proposed extra Study questions? | Ali |

---

## 16. Sources

- [Explore visa options](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder), plus the [Visit](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder/visit), [Study](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder/study) and [Work](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder/work) flows
- [Visa Finder disclaimer](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder/visa-finder-disclaimer)
- [Home Affairs copyright and disclaimer](https://www.homeaffairs.gov.au/access-and-accountability/using-our-website/copyright-and-disclaimer)
- [OMARA Code of Conduct](https://www.mara.gov.au/tools-for-registered-agents/code-of-conduct)
- [NSW 491 notice](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-work-regional-visa-subclass-491)
- [188 closure report, third party](https://migratio.com.au/blog/188-visa-guide)
- [489 to 491 and 187 to 494 transitional arrangements, third party](https://visaenvoy.com/transitional-arrangements-for-489-to-491-visa-and-187-to-494-visa/)