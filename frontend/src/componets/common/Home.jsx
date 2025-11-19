import { useContext } from 'react';

import { Link } from 'react-router-dom';

import { UserContext } from '../../App';
import AllItems from './AllItems';
import Footer from './Footer';
import Header from './Header';

const Home = () => {
  const { userData } = useContext(UserContext);
  const isLoggedIn = !!userData;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="bg-gradient-to-b from-amber-50 to-white py-16 ">
          <div className="max-w-4xl mx-auto px-4 text-center py-4">
            {isLoggedIn ? (
              <>
                <h2 className="text-3xl font-extrabold text-amber-800">
                  Welcome back, {userData?.name || "User"} 👋
                </h2>
                <p className="mt-3 text-amber-600">
                  Manage your items, post new restorations and connect with the
                  community.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to="/dashboard"
                    className="px-5 py-2 rounded-md bg-amber-700 text-white font-medium"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to="/items"
                    className="px-5 py-2 rounded-md border border-amber-200 text-amber-700"
                  >
                    Browse Items
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-extrabold text-amber-800">
                  Revitalizing Lives — Rebuilding Communities
                </h2>
                <p className="mt-3 text-amber-600">
                  Join Restore Hub to list restored items, buy renewed goods,
                  and support local restorers.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to="/register"
                    className="px-5 py-2 rounded-md bg-amber-600 text-white font-medium"
                  >
                    Want to sell? Register
                  </Link>
                  <Link
                    to="/login"
                    className="px-5 py-2 rounded-md border border-amber-200 text-amber-700"
                  >
                    Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h3 className="text-2xl font-semibold text-center text-amber-800 mb-6">
              Available Products
            </h3>
            <AllItems />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
