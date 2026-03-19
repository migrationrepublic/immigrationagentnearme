import Link from "next/link";
import { ShieldCheck, MapPin, ExternalLink, ArrowRight, Mail, Phone, Clock } from "lucide-react";
import { cities, services } from "@/data/cities";

export default function Footer() {
  return (
    <>
      <style>{`
        .footer {
          background: #030E1E;
          padding: 70px 40px 30px;
          color: rgba(255,255,255,0.5);
        }
        .footer-inner { max-width: 1160px; margin: 0 auto; }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 50px;
          margin-bottom: 50px;
        }
        .footer-brand h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          color: #fff;
          margin: 0 0 12px;
        }
        .footer-brand h3 span { color: #D4AF37; }
        .footer-brand p { font-size: 13.5px; line-height: 1.7; margin-bottom: 20px; }
        .marn-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(212,175,55,0.1);
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 12px;
          color: #D4AF37;
          font-weight: 600;
        }
        .footer-col h4 {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin: 0 0 16px;
        }
        .footer-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .footer-links a {
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          font-size: 13.5px;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #D4AF37; }
        .footer-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 28px; }
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .footer-bottom p { font-size: 12.5px; margin: 0; }
        .footer-bottom a { color: #D4AF37; text-decoration: none; }
        .footer-legal { display: flex; gap: 20px; }
        .footer-legal a { font-size: 12px; color: rgba(255,255,255,0.4); text-decoration: none; }
        .footer-legal a:hover { color: #D4AF37; }
        @media (max-width: 900px) {
          .footer { padding: 50px 20px 28px; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>

      <footer className="footer">
        <div className="footer-inner">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white relative inline-block">
              Cities We Serve
              <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-brand-accent rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link href={`/${city.slug}`} className="text-white/70 hover:text-white flex items-center group/link transition-colors">
                    <ArrowRight className="w-4 h-4 mr-2 text-brand-primary opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>
                Immigration Agent <span>Near Me</span>
              </h3>
              <p>
                MARA-registered migration agents serving all of Australia. Find
                expert immigration advice near you in Sydney, Melbourne,
                Brisbane, Perth, Adelaide and beyond.
              </p>
              <div className="marn-badge">🏛️ MARN: 2518961</div>
            </div>

            <div className="footer-col">
              <h4>Cities</h4>
              <ul className="footer-links">
                {cities.map((city) => (
                  <li key={city.slug}>
                    <Link href={`/${city.slug}`}>
                      📍 {city.name}, {city.state}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Services</h4>
              <ul className="footer-links">
                {services.map((svc) => (
                  <li key={svc.title}>
                    <a
                      href={svc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {svc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Migration Republic</h4>
              <ul className="footer-links">
                <li>
                  <a href="https://migrationrepublic.com.au/" target="_blank" rel="noopener noreferrer">Main Website</a>
                </li>
                <li>
                  <a href="https://migrationrepublic.com.au/about/" target="_blank" rel="noopener noreferrer">About Us</a>
                </li>
                <li>
                  <a href="https://migrationrepublic.com.au/blog/" target="_blank" rel="noopener noreferrer">Blog & News</a>
                </li>
                <li>
                  <a href="https://migrationrepublic.com.au/contact/" target="_blank" rel="noopener noreferrer">Contact</a>
                </li>
                <li>
                  <a href="https://migrationrepublic.com.au/book-a-consultation/" target="_blank" rel="noopener noreferrer">Book Consultation</a>
                </li>
                <li>
                  <a href="https://australiatrainingvisa.com.au/" target="_blank" rel="noopener noreferrer">Training Visa 407</a>
                </li>
                <li>
                  <a href="https://www.mara.gov.au/" target="_blank" rel="noopener noreferrer">Verify MARA Agent</a>
                </li>
                <li>
                  <a href="https://immi.homeaffairs.gov.au/" target="_blank" rel="noopener noreferrer">Dept of Home Affairs</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-divider" />

          <div className="footer-bottom">
            <p>
              © 2026 immigrationagentnearme.com — Information provided by{" "}
              <a
                href="https://migrationrepublic.com.au/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Migration Republic
              </a>
            </p>
            <div className="footer-legal">
              <a
                href="https://migrationrepublic.com.au/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              <a
                href="https://migrationrepublic.com.au/terms-conditions/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}