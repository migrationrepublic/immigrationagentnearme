import type { Metadata } from "next";

export const SITE_URL = "https://immigrationagentnearme.com";
const BRAND = "Migration Republic";

export interface ToolSeo {
  slug: string;
  /** Focus keyword: always the tool name. */
  keyword: string;
  /** Catchy H1 that contains the focus keyword. */
  h1: string;
  /** Short intro shown under the H1. */
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  /** Longer "About" intro rendered below the tool. */
  intro: string[];
  howToTitle: string;
  steps: { name: string; text: string }[];
  faqs: { q: string; a: string }[];
  keywords: string[];
}

export const TOOL_SEO: Record<string, ToolSeo> = {
  "pr-calculator": {
    slug: "pr-calculator",
    keyword: "PR Points Calculator",
    h1: "PR Points Calculator: Check Your Australian Skilled Visa Score",
    tagline:
      "Estimate your points for Australian Permanent Residency (subclass 189, 190 and 491) in under two minutes.",
    metaTitle: "PR Points Calculator Australia – Free Skilled Visa Score",
    metaDescription:
      "Use our free PR Points Calculator to estimate your Australian skilled migration score for 189, 190 and 491 visas. Instant result, MARA agent reviewed.",
    intro: [
      "The PR Points Calculator estimates your score under the Australian points-tested skilled migration system. Points are awarded for factors such as age, English language ability, skilled employment, education, and Australian study, and they decide whether you can lodge an Expression of Interest for the Skilled Independent (189), Skilled Nominated (190) or Skilled Work Regional (491) visas.",
      "The general pass mark is 65 points, but invitations in competitive occupations usually go to applicants with a much higher score. Knowing your number early helps you decide whether to improve your English test result, add work experience, or look at a state-nominated pathway.",
    ],
    howToTitle: "How to use the PR Points Calculator",
    steps: [
      { name: "Answer each question", text: "Select the option that best matches your age, English level, work experience, education and other circumstances." },
      { name: "Enter your contact details", text: "Provide your name and email so we can show your result and a registered migration agent can follow up if you want advice." },
      { name: "Review your score", text: "See your total points and a category-by-category breakdown, including whether you meet the 65-point minimum." },
      { name: "Plan your next step", text: "Use the breakdown to spot where you can gain more points, then book a consultation for a formal assessment." },
    ],
    faqs: [
      { q: "How many points do I need for Australian PR?", a: "The minimum is 65 points to submit an Expression of Interest for points-tested skilled visas. Invitations are competitive, so higher scores are often needed in practice." },
      { q: "Is the PR Points Calculator free?", a: "Yes. The calculator is free to use. Your result is an estimate and not a formal assessment." },
      { q: "Which visas does the calculator cover?", a: "It estimates points used for the Skilled Independent (subclass 189), Skilled Nominated (subclass 190) and Skilled Work Regional (subclass 491) visas." },
      { q: "Is the result official?", a: "No. Official points are decided by the Department of Home Affairs and your skills assessing authority. Book a consultation with a MARA registered agent to confirm your score." },
    ],
    keywords: ["PR points calculator", "Australia PR points calculator", "skilled migration points", "189 190 491 points test"],
  },

  "eligibility-checker": {
    slug: "eligibility-checker",
    keyword: "Australian Visa Eligibility Checker",
    h1: "Australian Visa Eligibility Checker: Can You Migrate to Australia?",
    tagline:
      "Answer a few quick questions to see whether you meet the basic requirements to apply for an Australian visa.",
    metaTitle: "Australian Visa Eligibility Checker – Free Online Test",
    metaDescription:
      "Free Australian Visa Eligibility Checker. Find out in minutes if you meet the basic requirements to migrate to Australia, then speak to a MARA registered agent.",
    intro: [
      "The Australian Visa Eligibility Checker gives you a fast, high-level read on whether you are likely to meet the fundamental requirements for Australian immigration, including age, English language, skills, work experience and qualifications.",
      "It is designed as a first step before you invest time and money in an application. Visa rules differ by subclass, so use the result as a guide and confirm the best pathway with a registered migration agent.",
    ],
    howToTitle: "How to use the Australian Visa Eligibility Checker",
    steps: [
      { name: "Start the checker", text: "Begin with the first question and move through each step using the options provided." },
      { name: "Answer honestly", text: "Select the answer that matches your real situation so the result reflects your circumstances." },
      { name: "Submit your details", text: "Enter your contact details to unlock your eligibility summary." },
      { name: "Review the outcome", text: "Read your result and recommended next steps, then book a consultation if you want a formal assessment." },
    ],
    faqs: [
      { q: "What does the eligibility checker assess?", a: "It looks at core factors such as age, English ability, occupation, work experience and qualifications that affect most Australian visa pathways." },
      { q: "Does a positive result guarantee a visa?", a: "No. It is an indicative check only. Each visa has its own criteria and the Department of Home Affairs makes the final decision." },
      { q: "How long does it take?", a: "Most people finish in around two minutes." },
      { q: "Is my information kept private?", a: "Your details are used only so a migration agent can contact you about your enquiry." },
    ],
    keywords: ["Australian visa eligibility checker", "visa eligibility test Australia", "can I migrate to Australia", "immigration eligibility"],
  },

  "visa-quiz": {
    slug: "visa-quiz",
    keyword: "Visa Suggestion Quiz",
    h1: "Visa Suggestion Quiz: Find the Right Australian Visa for You",
    tagline:
      "Not sure which visa subclass fits? Tell us your goals and get tailored Australian visa suggestions.",
    metaTitle: "Visa Suggestion Quiz – Find Your Australian Visa",
    metaDescription:
      "Take the free Visa Suggestion Quiz to discover which Australian visa subclass suits your goals, skills and circumstances. Quick, simple and agent reviewed.",
    intro: [
      "Australia has dozens of visa subclasses across work, study, family and business migration. The Visa Suggestion Quiz narrows them down by asking about your goals, occupation, budget and timeline.",
      "At the end you get a shortlist of visa options worth exploring, so you can focus your research and your consultation on the pathways that actually fit.",
    ],
    howToTitle: "How to use the Visa Suggestion Quiz",
    steps: [
      { name: "Choose your goal", text: "Pick whether you want to work, study, invest or join family in Australia." },
      { name: "Answer the follow-up questions", text: "Share details about your occupation, experience and budget." },
      { name: "Submit your contact details", text: "Add your details to see your personalised visa suggestions." },
      { name: "Explore your matches", text: "Review each suggested visa subclass and book a consultation to confirm the best fit." },
    ],
    faqs: [
      { q: "Is the quiz a formal visa assessment?", a: "No. It suggests visa options based on your answers. A MARA registered agent can confirm which visa you actually qualify for." },
      { q: "Which visas can the quiz suggest?", a: "It covers common work, skilled, student, partner and business pathways to Australia." },
      { q: "How long does the quiz take?", a: "About two minutes." },
      { q: "What should I do after getting results?", a: "Book a consultation to check your eligibility and plan your application." },
    ],
    keywords: ["visa suggestion quiz", "which Australian visa is right for me", "Australian visa finder", "visa subclass quiz"],
  },

  "subclass-482-checker": {
    slug: "subclass-482-checker",
    keyword: "Subclass 482 Eligibility Checker",
    h1: "Subclass 482 Eligibility Checker: Are You Eligible for the Skills in Demand Visa?",
    tagline:
      "Check your preliminary eligibility for the Subclass 482 Skills in Demand visa in a few minutes.",
    metaTitle: "Subclass 482 Eligibility Checker – Skills in Demand Visa",
    metaDescription:
      "Free Subclass 482 Eligibility Checker. See if you meet the key criteria for the Skills in Demand visa, including occupation, experience, English and salary.",
    intro: [
      "The Subclass 482 Eligibility Checker helps overseas workers and employers test whether a candidate is likely to meet the main requirements of the Skills in Demand visa, Australia's employer-sponsored temporary work visa.",
      "It looks at the criteria that most often decide these applications: nominated occupation, work experience, English language, qualifications, health and character, and the salary offered relative to the Core Skills Income Threshold.",
    ],
    howToTitle: "How to use the Subclass 482 Eligibility Checker",
    steps: [
      { name: "Enter the candidate details", text: "Provide the nominated occupation, experience and qualifications." },
      { name: "Answer the criteria questions", text: "Respond to each question on English, salary, sponsorship and background." },
      { name: "Review the criteria summary", text: "See which requirements appear met, at risk, or need more evidence." },
      { name: "Get professional advice", text: "Book a consultation with a MARA registered agent to confirm eligibility before lodging." },
    ],
    faqs: [
      { q: "What is the Subclass 482 visa?", a: "The Subclass 482 Skills in Demand visa lets an approved Australian employer sponsor a skilled worker for temporary work." },
      { q: "Do I need an employer to use the checker?", a: "No. You can check your own eligibility, but the visa itself requires an approved sponsor and a nominated position." },
      { q: "Does the checker confirm I will be approved?", a: "No. It is a preliminary guide only. Applications are assessed by the Department of Home Affairs." },
      { q: "Can the 482 lead to permanent residency?", a: "For many applicants it can lead to employer-sponsored PR such as the Subclass 186 visa, subject to eligibility." },
    ],
    keywords: ["subclass 482 eligibility checker", "482 visa eligibility", "skills in demand visa checker", "482 visa Australia"],
  },

  "business-sponsor-checker": {
    slug: "business-sponsor-checker",
    keyword: "Business Sponsor Checker",
    h1: "Business Sponsor Checker: Can Your Business Sponsor Overseas Workers?",
    tagline:
      "Answer a few questions for an indicative result on your business's eligibility to sponsor under the 482, 186 and 494 visas.",
    metaTitle: "Business Sponsor Checker – Can My Business Sponsor?",
    metaDescription:
      "Free Business Sponsor Checker for employers. Find out if your Australian business can sponsor skilled workers under the 482, 186 and 494 visas in under a minute.",
    intro: [
      "The Business Sponsor Checker helps Australian employers quickly gauge whether their business is likely to be approved as a standard business sponsor for overseas skilled workers.",
      "It considers factors such as whether you are actively trading, your compliance history, financial capacity, labour market testing, and the salary you can offer. These are the areas that most often cause sponsorship applications to be delayed or refused.",
    ],
    howToTitle: "How to use the Business Sponsor Checker",
    steps: [
      { name: "Describe your business", text: "Select your industry, how long you have operated and where you trade." },
      { name: "Answer the sponsorship questions", text: "Respond to questions on compliance, financials and the role you want to fill." },
      { name: "Submit your details", text: "Enter your contact information to see your result." },
      { name: "Read your indicative result", text: "Review the strengths and issues flagged, then book a consultation to prepare your sponsorship application." },
    ],
    faqs: [
      { q: "Which visas does the checker cover?", a: "It looks at sponsorship for the Subclass 482, Subclass 186 and Subclass 494 visas." },
      { q: "Can a start-up sponsor workers?", a: "Possibly, but the business must be lawfully operating and able to show genuine need and financial capacity. The checker flags where a newer business may need more evidence." },
      { q: "Is the result a formal assessment?", a: "No. It is indicative only. A MARA registered agent can assess your business properly." },
      { q: "What are the main reasons sponsorship fails?", a: "Common reasons include inactive trading, past compliance breaches, salary below the required threshold and missing labour market testing." },
    ],
    keywords: ["business sponsor checker", "can my business sponsor", "employer sponsorship eligibility Australia", "standard business sponsor"],
  },

  "sponsorship-cost-estimator": {
    slug: "sponsorship-cost-estimator",
    keyword: "Sponsorship Cost Estimator",
    h1: "Sponsorship Cost Estimator: Know Your Government Fees Upfront",
    tagline:
      "Calculate itemised government charges for employer sponsorship, including nomination fees, the SAF levy and visa application charges.",
    metaTitle: "Sponsorship Cost Estimator – Australia Employer Visa Fees",
    metaDescription:
      "Free Sponsorship Cost Estimator for Australian employers. Get itemised government fees for 482, 186 and 494 sponsorship, including SAF levy and nomination charges.",
    intro: [
      "The Sponsorship Cost Estimator gives employers a clear, itemised view of the statutory government charges involved in sponsoring a skilled worker, so you can budget before you start.",
      "It covers the main costs: the sponsorship and nomination fees, the Skilling Australians Fund (SAF) levy, and the visa application charges for the sponsored employee and accompanying family. Professional fees are quoted separately.",
    ],
    howToTitle: "How to use the Sponsorship Cost Estimator",
    steps: [
      { name: "Select the visa", text: "Choose the subclass you plan to sponsor under, such as 482, 186 or 494." },
      { name: "Enter business and applicant details", text: "Add your business size, the number of applicants and any accompanying family." },
      { name: "Submit your details", text: "Provide your contact information to view the full breakdown." },
      { name: "Review the breakdown", text: "See each government charge itemised with a total estimate, then book a consultation to plan your sponsorship." },
    ],
    faqs: [
      { q: "What costs does the estimator include?", a: "Government charges only: nomination and sponsorship fees, the SAF levy and visa application charges. Our professional fee is quoted separately." },
      { q: "What is the SAF levy?", a: "The Skilling Australians Fund levy is a charge paid by the sponsoring employer, with the amount depending on the visa and business turnover." },
      { q: "Are the amounts exact?", a: "They are estimates based on published government charges, which can change. Confirm current amounts before lodging." },
      { q: "Does it include the employee's own visa charges?", a: "Yes, when you include applicants. You can also use the Applicant Cost Calculator for applicant-only charges." },
    ],
    keywords: ["sponsorship cost estimator", "employer sponsorship cost Australia", "SAF levy calculator", "482 visa sponsorship fees"],
  },

  "applicant-cost-calculator": {
    slug: "applicant-cost-calculator",
    keyword: "Applicant Cost Calculator",
    h1: "Applicant Cost Calculator: Estimate Your Australian Visa Application Charges",
    tagline:
      "Calculate visa application charges for yourself and accompanying family members. Company sponsorship charges are separate.",
    metaTitle: "Applicant Cost Calculator – Australian Visa Charges",
    metaDescription:
      "Free Applicant Cost Calculator. Estimate visa application charges (VAC) for the main applicant and family on 482, 186 and 494 visas. Instant breakdown.",
    intro: [
      "The Applicant Cost Calculator estimates the visa application charges (VAC) you pay to the Department of Home Affairs as the main applicant, plus charges for your partner and dependent children.",
      "It is built for the applicant's side of the process. Employer costs such as nomination fees and the SAF levy are handled by the Sponsorship Cost Estimator.",
    ],
    howToTitle: "How to use the Applicant Cost Calculator",
    steps: [
      { name: "Choose your visa", text: "Select the subclass you are applying for: 482, 186 or 494." },
      { name: "Add your family", text: "Enter the number of accompanying adults and children." },
      { name: "Submit your details", text: "Provide your contact information to view your result." },
      { name: "Review your charges", text: "See the itemised visa application charges and the total, then book a consultation to plan your application." },
    ],
    faqs: [
      { q: "What is a visa application charge?", a: "It is the fee the Department of Home Affairs charges to process a visa application." },
      { q: "Does this include employer costs?", a: "No. It covers applicant charges only. Use the Sponsorship Cost Estimator for employer costs." },
      { q: "Are family members charged separately?", a: "Yes. Accompanying partners and children have their own charges, which the calculator adds up for you." },
      { q: "Are the figures guaranteed?", a: "They are estimates based on published charges, which can change, so check current amounts before you apply." },
    ],
    keywords: ["applicant cost calculator", "visa application charge calculator Australia", "VAC calculator", "482 186 494 visa cost"],
  },

  "visit-visa-finder": {
    slug: "visit-visa-finder",
    keyword: "Australian Visitor Visa Finder",
    h1: "Australian Visitor Visa Finder: Which Visa Is Right for Your Trip?",
    tagline: "Answer up to three questions to see visitor visa options for tourism, family visits, business, transit and working holidays.",
    metaTitle: "Australian Visitor Visa Finder \u2013 Explore Your Options",
    metaDescription: "Free Australian Visitor Visa Finder. See which visitor visas, such as 600, 651, 601 and working holiday visas, may suit your trip. Information only, not migration advice.",
    intro: ["Most visitors to Australia apply for a Visitor visa (subclass 600), an eVisitor (651) or an Electronic Travel Authority (601), depending on their passport and reason for travel.", "The Visit Visa Finder asks about the purpose of your trip and your passport, then lists the visa options worth exploring. It shows options only. It does not assess eligibility, and visa rules, fees and eligible countries change."],
    howToTitle: "How to use the Visit Visa Finder",
    steps: [{"name": "Answer the questions", "text": "Choose your purpose of visit and your country of passport. Working holiday travellers are also asked their age group."}, {"name": "Review your options", "text": "See a short list of visa options to explore, with stay, fees from and key points for each."}, {"name": "Read the guide", "text": "Open the Migration Republic guide for any visa that looks relevant."}, {"name": "Book a consultation", "text": "Send your answers to a registered migration agent to talk through your options."}],
    faqs: [{"q": "Which visa do most tourists use?", "a": "Most tourists use the Visitor visa (subclass 600), an eVisitor (651) or an ETA (601). Which one is available depends on your passport."}, {"q": "Does this tool tell me if I qualify?", "a": "No. It lists options to explore. Eligibility depends on legislation, including health and character requirements."}, {"q": "Can a migration agent lodge an ETA?", "a": "ETAs currently cannot be lodged through an agent and must be applied for using the official app."}, {"q": "Are the fees current?", "a": "Fees change, usually from 1 July. Always check the Home Affairs Visa Pricing Estimator."}],
    keywords: ["Australian visitor visa finder", "which visitor visa for Australia", "subclass 600 visa", "eVisitor 651", "ETA 601"],
  },

  "study-visa-finder": {
    slug: "study-visa-finder",
    keyword: "Australian Study Visa Finder",
    h1: "Australian Study Visa Finder: Student, Guardian and Training Visas",
    tagline: "See which Australian visa options may suit you for study, accompanying a student or workplace training.",
    metaTitle: "Australian Study Visa Finder \u2013 Student Visa Options",
    metaDescription: "Free Australian Study Visa Finder. Explore the Student (500), Student Guardian (590) and Training (407) visa options. Information only, not migration advice.",
    intro: ["Australia has three main visa options for study-related travel: the Student visa (subclass 500) for full-time study, the Student Guardian visa (590) for supporting a student, and the Training visa (407) for workplace-based training.", "The Study Visa Finder shows which of these may suit your plans. It gives general information only and does not assess your eligibility."],
    howToTitle: "How to use the Study Visa Finder",
    steps: [{"name": "Answer the questions", "text": "Tell us whether you plan to study, accompany a student or train, plus the student's age and where you are now."}, {"name": "Review your options", "text": "See a short list of visa options to explore, with stay, fees from and key points for each."}, {"name": "Read the guide", "text": "Open the Migration Republic guide for any visa that looks relevant."}, {"name": "Book a consultation", "text": "Send your answers to a registered migration agent to talk through your options."}],
    faqs: [{"q": "What is the Student visa?", "a": "The Student visa (subclass 500) lets eligible people study full time in an Australian registered course."}, {"q": "Who can apply for a Student Guardian visa?", "a": "The Student Guardian visa (590) is generally for a parent or relative supporting a student who is usually under 18."}, {"q": "What is the Training visa?", "a": "The Training visa (407) is for workplace-based or professional development training. It is not for people who mainly want to work."}, {"q": "Does this tool guarantee a visa?", "a": "No. Only the Department of Home Affairs decides visa applications."}],
    keywords: ["Australian study visa finder", "student visa options Australia", "subclass 500", "subclass 590", "subclass 407"],
  },

  "work-visa-finder": {
    slug: "work-visa-finder",
    keyword: "Australian Work Visa Finder",
    h1: "Australian Work Visa Finder: Explore Skilled, Temporary and Working Holiday Visas",
    tagline: "Choose the kind of work you plan to do and see the Australian work visa options worth exploring.",
    metaTitle: "Australian Work Visa Finder \u2013 Explore Work Visa Options",
    metaDescription: "Free Australian Work Visa Finder. Explore skilled, employer sponsored, working holiday, business and temporary work visas. Information only, not migration advice.",
    intro: ["Australian work visas range from short-stay specialist and temporary activity visas to employer sponsored and permanent skilled visas. Some listed visas may be closed or replaced, so every result carries a status note.", "The Work Visa Finder narrows the list by the type of work you plan to do, how long you want to stay and how you intend to apply. It shows options only and does not assess eligibility."],
    howToTitle: "How to use the Work Visa Finder",
    steps: [{"name": "Answer the questions", "text": "Choose the kind of work you will do. Skilled workers are asked how long they plan to stay and how they will apply."}, {"name": "Review your options", "text": "See a short list of visa options to explore, with stay, fees from and key points for each."}, {"name": "Read the guide", "text": "Open the Migration Republic guide for any visa that looks relevant."}, {"name": "Book a consultation", "text": "Send your answers to a registered migration agent to talk through your options."}],
    faqs: [{"q": "Which work visas lead to permanent residence?", "a": "Skilled options such as the 186, 190 and 189, and some business and talent visas, can lead to permanent residence. Rules and availability change."}, {"q": "Are the 188, 187 and 489 still open?", "a": "They remain on the official list but are reported closed or replaced. We label them. Confirm their status with a registered agent."}, {"q": "Does this tool assess my eligibility?", "a": "No. It lists options to explore and is not migration advice."}, {"q": "Can I book a consultation from the results?", "a": "Yes. Every result links to Book a Consultation and you can send your answers to an agent."}],
    keywords: ["Australian work visa finder", "work visa options Australia", "skilled visa finder", "working holiday visa Australia"],
  },
};

TOOL_SEO["visa-finder"] = {
  slug: "visa-finder",
  keyword: "Australia Visa Finder",
  h1: "Australia Visa Finder: Explore Your Options",
  tagline: "Choose Visit, Study or Work and answer a few quick questions to see visa options worth exploring.",
  metaTitle: "Australia Visa Finder – Explore Visit, Study & Work Visas",
  metaDescription:
    "Free Australia Visa Finder. Pick Visit, Study or Work and explore the Australian visa options that may suit you. General information only, not migration advice.",
  intro: [
    "The Australia Visa Finder is a set of three guided tools, one each for visiting, studying and working in Australia. Each tool asks a few short questions and lists the visa options worth exploring, with stay, application charge from, and key points for every visa.",
    "The finders show options only. They do not assess eligibility or recommend a visa, and visa rules, fees and eligible countries change. For advice on your situation, book a consultation with a registered migration agent.",
  ],
  howToTitle: "How to use the Australia Visa Finder",
  steps: [
    { name: "Choose a finder", text: "Pick Visit and Tourism, Study or Work, depending on why you want to come to Australia." },
    { name: "Answer the questions", text: "Answer one question per screen. The number of options updates as you go." },
    { name: "Review your options", text: "Read each visa option, then open the Migration Republic guide for any that look relevant." },
    { name: "Book a consultation", text: "Send your answers to a registered migration agent to talk through your options." },
  ],
  faqs: [
    { q: "What is the Australia Visa Finder?", a: "It is a free guided tool that lists Australian visa options based on your answers to a few questions about your visit, study or work plans." },
    { q: "Does the Visa Finder tell me which visa I qualify for?", a: "No. It lists options to explore. Eligibility depends on legislation, including health and character requirements." },
    { q: "Is the Visa Finder an official government tool?", a: "No. It is a Migration Republic tool that adapts information from the Australian Government Department of Home Affairs and is not endorsed by it." },
    { q: "Are visa fees and eligible countries up to date?", a: "Fees change, usually from 1 July, and eligible countries change often. Check the Home Affairs Visa Pricing Estimator and confirm with a registered agent." },
  ],
  keywords: ["Australia visa finder", "Australian visa options", "which visa for Australia", "visit study work visa Australia"],
};

export const TOOLS_INDEX_SEO = {
  metaTitle: "Free Australian Immigration Tools & Calculators",
  metaDescription:
    "Free Australian immigration tools: Visit, Study and Work Visa Finders, PR Points Calculator, visa eligibility checkers, sponsorship cost estimators and a visa quiz, built by MARA registered agents.",
};

export function toolMetadata(slug: string): Metadata {
  const t = TOOL_SEO[slug];
  const url = `${SITE_URL}/tools/${slug}`;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: t.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: BRAND,
      title: t.metaTitle,
      description: t.metaDescription,
      url,
      images: [{ url: `${SITE_URL}/images/logobgre.png` }],
    },
    twitter: {
      card: "summary",
      title: t.metaTitle,
      description: t.metaDescription,
    },
  };
}
