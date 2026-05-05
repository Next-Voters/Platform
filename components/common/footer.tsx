import React from "react";

const footerLinks = {
  Product: [
    { name: "Local", href: "/local" },
    { name: "Pricing", href: "/pricing" },
  ],
  Company: [
    { name: "Blog", href: "/blog" },
  ],
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-page text-gray-600 border-t border-gray-200/80">
      <div className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand column */}
          <div className="sm:col-span-1">
            <a href="/" className="text-[17px] font-bold text-gray-900 tracking-tight hover:opacity-80 transition-opacity">
              NV
            </a>
            <p className="mt-3 text-[13.5px] leading-relaxed text-gray-500 max-w-[240px]">
              Technology that empowers voters to understand policy and legislation fast.
            </p>
            <a
              href="mailto:team@nextvoters.com"
              className="mt-4 inline-block text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
            >
              team@nextvoters.com
            </a>
          </div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-4">
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-[14px] text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-[12px] text-gray-500">
            © {new Date().getFullYear()} Next Voters. All rights reserved.
          </p>
          <p className="text-[12px] text-gray-500">
            Supported by Google for Nonprofits
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
