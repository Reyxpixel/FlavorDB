
import React from 'react';
import FlavorMoleculesPage from './components/FlavorMoleculesPage';

export default function App() {
  const headerLinks = [
    { label: 'FlavorDB Search', href: 'https://cosylab.iiitd.edu.in/flavordb/search' },
    { label: 'How To Use', href: 'https://cosylab.iiitd.edu.in/flavordb/how_to_use' },
    { label: 'Receptors', href: 'https://cosylab.iiitd.edu.in/flavordb/receptors' },
    { label: 'FAQs', href: 'https://cosylab.iiitd.edu.in/flavordb/faq' },
    { label: 'Contact Us', href: 'https://cosylab.iiitd.edu.in/flavordb/contact' },
    { label: 'CoSyLab', href: 'https://cosylab.iiitd.edu.in/' },
  ];

  return (
    <div className="fdb-app-shell">
      <header className="fdb-site-header">
        <div className="fdb-site-header-inner">
          <button
            type="button"
            className="fdb-site-logo"
            onClick={() => { window.location.href = window.location.pathname; }}
            aria-label="Back to home"
            title="Home"
          >
            <span aria-hidden="true">🌶</span>
          </button>

          <div className="fdb-site-branding">
            <h1>FlavorDB</h1>
            <p>A resource to explore flavor molecules</p>
          </div>

          <nav className="fdb-site-nav" aria-label="Primary">
            {headerLinks.map((link) => (
              <a key={link.label} className="fdb-site-nav-link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="fdb-content">
        <FlavorMoleculesPage />
      </div>

      <footer className="fdb-site-footer">
        <div className="fdb-site-footer-inner">
          <div>Copyright © 2026 · All rights reserved.</div>
          <div className="fdb-site-footer-links">
            <a href="https://www.foodoscope.com/" target="_blank" rel="noreferrer">Foodoscope Technologies Pvt. Ltd.</a>
            <span>|</span>
            <a href="https://faculty.iiitd.ac.in/~bagler/" target="_blank" rel="noreferrer">Dr. Ganesh Bagler</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
