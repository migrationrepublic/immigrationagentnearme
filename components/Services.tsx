import { Briefcase, Users, GraduationCap, ArrowUpRight, Plane } from "lucide-react";
import Image from "next/image";

export default function Services() {
  const servicesList = [
    {
      title: "Skilled Migration",
      desc: "Subclass 189 Skilled Independent, Subclass 190 Skilled Nominated, and Subclass 491 Skilled Work Regional visas. Our agents assist with skills assessments, points calculations, Expression of Interest submissions, and full visa applications.",
      link: "https://migrationrepublic.com.au/migration/",
      icon: <Plane className="w-6 h-6" />,
      color: "bg-blue-50 text-blue-600",
      accent: "group-hover:bg-blue-600 group-hover:text-white"
    },
    {
      title: "Employer Sponsored Visas",
      desc: "Subclass 482 Skills in Demand Visa and Subclass 186 Employer Nomination Scheme. We work with both employers and employees to prepare compliant, complete sponsored visa applications.",
      link: "https://migrationrepublic.com.au/subclass-482-visa-australia/",
      icon: <Briefcase className="w-6 h-6" />,
      color: "bg-emerald-50 text-emerald-600",
      accent: "group-hover:bg-emerald-600 group-hover:text-white"
    },
    {
      title: "Partner and Family Visas",
      desc: "820/801 onshore partner visas, 309/100 offshore partner visas, and parent visas. We guide couples and families through one of Australia's most documentation-intensive visa processes.",
      link: "https://migrationrepublic.com.au/",
      icon: <Users className="w-6 h-6" />,
      color: "bg-rose-50 text-rose-600",
      accent: "group-hover:bg-rose-600 group-hover:text-white"
    },
    {
      title: "Student Visas",
      desc: "Full support for international students applying to study at registered Australian institutions. Learn more on our Education Consultation page.",
      link: "https://migrationrepublic.com.au/education-consultation/",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "bg-purple-50 text-purple-600",
      accent: "group-hover:bg-purple-600 group-hover:text-white"
    },
    {
      title: "Training Visa Subclass 407",
      desc: "Structured workplace training visas for overseas professionals. For a complete guide, visit our dedicated training visa portal.",
      link: "https://australiatrainingvisa.com.au/",
      icon: <BookOpen className="w-6 h-6" />,
      color: "bg-orange-50 text-orange-600",
      accent: "group-hover:bg-orange-600 group-hover:text-white"
    }
  ];

  return (
    <section className="py-24 bg-gray-50 relative" id="services">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-heading mb-6">
            Visa Services Available Across Australia
          </h2>
          <p className="text-lg text-brand-gray mb-12">
            Migration Republic&apos;s registered agents assist with every major Australian visa category. We navigate the intricate legal framework so you don&apos;t have to.
          </p>

          <div className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-3xl overflow-hidden shadow-2xl mb-16 border-4 border-white">
            <Image 
              src="/images/services_visa_passports.png" 
              alt="Professional visa services Australia including passports and state-of-the-art immigration document processing"
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="absolute inset-0 bg-brand-primary/20 mix-blend-overlay" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service, index) => (
            <a 
              key={index}
              href={service.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-primary/30 transition-all duration-300 relative overflow-hidden h-full flex flex-col"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                <ArrowUpRight className="w-6 h-6 text-brand-primary" />
              </div>

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${service.color} ${service.accent}`}>
                {service.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-brand-primary transition-colors">
                {service.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed flex-grow">
                {service.desc}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center text-sm font-semibold text-brand-accent group-hover:text-brand-primary transition-colors">
                Learn more &rarr;
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// Just an extra icon for the 407
function BookOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}