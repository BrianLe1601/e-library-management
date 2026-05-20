export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">About</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-blue-600">About Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Contact</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Careers</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Browse Books</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Digital Library</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Events</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Help Center</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">FAQs</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Connect</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Twitter</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Facebook</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-gray-600">
          <p>&copy; 2026 LibraryHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
