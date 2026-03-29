import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface FAQProps {
  cityName?: string;
  stateCode?: string;
  faqString?: string;
}

export default function FAQ({ cityName, stateCode, faqString }: FAQProps = {}) {
  // Use parsed faqString, fallback to default hardcoded array if not present
  let faqs = [
    {
      q: `Do I need a registered immigration agent in ${cityName || 'Australia'}?`,
      a: "While it is not legally mandatory to use a migration agent, only MARA registered agents are authorised to charge for immigration advice. Using a registered agent significantly improves your chances of a successful application and protects you from unqualified advice.",
    },
    {
      q: `How do I find an immigration agent near me in ${cityName || 'Australia'}?`,
      a: cityName 
        ? `Migration Republic provides registered immigration agent services across ${cityName} and the broader ${stateCode || 'region'}, both in-person and online via video consultation.`
        : "Migration Republic serves all major Australian cities including Sydney, Melbourne, Brisbane, Perth and Adelaide. All consultations can be conducted in person or online. Use the city links above to find an agent near you, or contact us directly to book a consultation.",
    },
    {
      q: "How much does an immigration agent charge in Australia?",
      a: "Fees vary depending on the visa type and complexity of your case. Migration Republic offers an initial consultation where we assess your situation and provide a transparent, fixed-fee quote with no hidden charges.",
    },
    {
      q: "Can a migration agent help after a visa refusal?",
      a: "Yes. If your visa application has been refused, a registered migration agent can assess the grounds for refusal, advise on review or appeal options through the Administrative Review Tribunal, and help you prepare a stronger reapplication.",
    },
    {
      q: "What is the MARA registration number for Migration Republic?",
      a: "Migration Republic's MARA registration number is 2518961. You can verify this on the OMARA public register at any time.",
    },
  ];

  if (faqString) {
    const blocks = faqString.split('\n\n').filter(Boolean);
    const parsedFaqs: { q: string, a: string }[] = [];
    
    // Parse Q: & A: from markdown
    blocks.forEach((block) => {
      const lines = block.split('\n').map(l => l.trimStart());
      if (lines[0] && lines[0].startsWith('Q: ')) {
        const q = lines[0].replace('Q: ', '');
        const a = lines.slice(1).join(' ').replace('A: ', '').trim();
        parsedFaqs.push({ q, a });
      }
    });

    if (parsedFaqs.length > 0) {
      faqs = parsedFaqs;
    }
  }

  return (
    <section className="py-24 bg-brand-primary/5 relative" id="faq">
      {/* Decorative background shape */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-heading mb-6">
            Frequently Asked Questions {cityName ? `— ${cityName}` : ''}
          </h2>
          <p className="text-lg text-brand-gray max-w-2xl mx-auto">
            Get quick answers to the most common questions about finding and working with a registered immigration agent in {cityName || 'Australia'}.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b-gray-100">
                <AccordionTrigger className="text-left text-lg font-bold text-brand-heading hover:text-brand-accent transition-colors py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-brand-gray text-base leading-relaxed pb-6 pr-8">
                  <span dangerouslySetInnerHTML={{ __html: faq.a }} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
