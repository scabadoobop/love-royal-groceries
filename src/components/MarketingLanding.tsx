import { useState } from 'react';
import { landingCopy } from '../landingCopy';
import './MarketingLanding.css';

interface MarketingLandingProps {
  onGetStarted: () => void;
}

export default function MarketingLanding({ onGetStarted }: MarketingLandingProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="marketing-landing">
      {/* Navigation */}
      <nav className="marketing-nav">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {landingCopy.nav.logo}
          </div>
          <div className="nav-links">
            {landingCopy.nav.links.map((link, idx) => (
              <button
                key={idx}
                className="nav-link"
                onClick={() => scrollTo(link.href.substring(1))}
              >
                {link.label}
              </button>
            ))}
          </div>
          <button className="nav-cta" onClick={onGetStarted}>
            {landingCopy.nav.cta}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-headline">{landingCopy.hero.headline}</h1>
          <p className="hero-subheadline">{landingCopy.hero.subheadline}</p>
          <button className="hero-cta" onClick={onGetStarted}>
            {landingCopy.hero.cta}
          </button>
          <div className="hero-note">
            Currently showing: <strong>{landingCopy.themeName}</strong> theme
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="section-container">
          <h2 className="section-title">{landingCopy.problems.title}</h2>
          <div className="problems-grid">
            {landingCopy.problems.bullets.map((problem, idx) => (
              <div key={idx} className="problem-card">
                <div className="problem-icon">{problem.icon}</div>
                <h3 className="problem-title">{problem.title}</h3>
                <p className="problem-description">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <h2 className="section-title">{landingCopy.features.title}</h2>
          <p className="section-subtitle">{landingCopy.features.subtitle}</p>
          <div className="features-grid">
            {landingCopy.features.items.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">{landingCopy.howItWorks.title}</h2>
          <p className="section-subtitle">{landingCopy.howItWorks.subtitle}</p>
          <div className="steps-container">
            {landingCopy.howItWorks.steps.map((step, idx) => (
              <div key={idx} className="step-card">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <h2 className="section-title">{landingCopy.pricing.title}</h2>
          <p className="section-subtitle">{landingCopy.pricing.subtitle}</p>
          <div className="pricing-grid">
            {landingCopy.pricing.plans.map((plan, idx) => (
              <div key={idx} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">{plan.price}</span>
                  {plan.period && <span className="period">/{plan.period}</span>}
                </div>
                <p className="plan-description">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="plan-feature">
                      <span className="check-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="plan-cta" onClick={onGetStarted}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq-section">
        <div className="section-container">
          <h2 className="section-title">{landingCopy.faq.title}</h2>
          <div className="faq-list">
            {landingCopy.faq.items.map((item, idx) => (
              <div key={idx} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span>{item.question}</span>
                  <span className="faq-toggle">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="marketing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>{landingCopy.footer.productName}</h3>
            <p>{landingCopy.footer.tagline}</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                {landingCopy.footer.links.product.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                {landingCopy.footer.links.company.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                {landingCopy.footer.links.legal.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{landingCopy.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}

