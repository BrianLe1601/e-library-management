export default function Footer() {
  return (
      <footer className="bg-blue-900 dark:bg-slate-950 text-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white mb-4">ELibrary</h4>
              <p className="text-blue-200 text-sm leading-relaxed">
                Your comprehensive academic digital library —
                access to borrow thousands of books anytime,
                anywhere.
              </p>
            </div>
            <div>
              <h4
                className="text-blue-300 text-sm mb-4 uppercase tracking-wider"
                style={{ fontWeight: 700 }}
              >
                Catalog
              </h4>
              <ul className="space-y-2 text-sm text-blue-200">
                {[
                  "Browse Books",
                  "New Arrivals",
                  "Trending",
                  "By Category",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4
                className="text-blue-300 text-sm mb-4 uppercase tracking-wider"
                style={{ fontWeight: 700 }}
              >
                Account
              </h4>
              <ul className="space-y-2 text-sm text-blue-200">
                {[
                  "My Dashboard",
                  "Borrowing History",
                  "Notifications",
                  "Settings",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4
                className="text-blue-300 text-sm mb-4 uppercase tracking-wider"
                style={{ fontWeight: 700 }}
              >
                Support
              </h4>
              <ul className="space-y-2 text-sm text-blue-200">
                {[
                  "Help Center",
                  "Contact Us",
                  "Privacy Policy",
                  "Terms of Service",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-blue-300 text-sm">
              © 2026 ELibrary. All rights reserved.
            </p>
            <p className="text-blue-400 text-xs">
              Powered by the Academic Excellence Initiative
            </p>
          </div>
        </div>
      </footer>
  );
}