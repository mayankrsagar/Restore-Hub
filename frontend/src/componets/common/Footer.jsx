export default function Footer() {
  return (
    <footer className="bg-amber-50 mt-12 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-amber-800 font-semibold">Restore Hub</h3>
            <p className="text-sm text-amber-700 mt-2">
              Revitalizing lives through restored goods. Built for students.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <h4 className="text-amber-800 font-medium">Links</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a href="/" className="text-amber-700 hover:underline">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="text-amber-700 hover:underline">
                  About
                </a>
              </li>
              <li>
                <a href="/contact" className="text-amber-700 hover:underline">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-amber-800 font-medium">Contact</h4>
            <p className="text-sm text-amber-700 mt-2">
              Email: support@restorehub.example
            </p>
            <p className="text-sm text-amber-700">Phone: +91 12345 67890</p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-amber-600">
          © {new Date().getFullYear()} Restore Hub — Student Project
        </div>
      </div>
    </footer>
  );
}
