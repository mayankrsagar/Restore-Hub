// src/App.jsx
import './App.css';

import {
  createContext,
  useEffect,
  useState,
} from 'react';

import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import api from './api/axiosConfig';
import BoughtItems from './componets/common/BoughtItems';
import Dashboard from './componets/common/Dashboard';
import Home from './componets/common/Home';
import ItemDetails from './componets/common/ItemDetails';
import Items from './componets/common/Items/items';
import Login from './componets/common/Login';
import Profile from './componets/common/Profile';
import Register from './componets/common/Register';
import EditItem from './componets/seller/EditItem';
// optional pages you added earlier — adjust paths if they are different
import About from './pages/About';
import Contact from './pages/Contact';
import ProtectedRoute from './routes/ProtectedRoute';

export const UserContext = createContext();

function App() {
  const date = new Date().getFullYear();
  const [userData, setUserData] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const fetchMe = async () => {
    try {
      setLoadingAuth(true);
      const res = await api.get("/user/me");
      if (res.data?.success && res.data.user) {
        setUserData(res.data.user);
      } else {
        setUserData(null);
      }
    } catch (err) {
      setUserData(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <UserContext.Provider value={{ userData, setUserData, fetchMe }}>
      <div className="App min-h-screen flex flex-col">
        <Router>
          <div className="content flex-grow">
            <Routes>
              <Route
                path="/"
                element={
                  // <ProtectedRoute loading={loadingAuth}>
                  <Home />
                  // </ProtectedRoute>
                }
              />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/item-details/:itemId"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <ItemDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/items"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <Items />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/edit-item/:itemId"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <EditItem />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-purchases"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <BoughtItems />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* About & Contact (public pages) */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <footer className="footer bg-amber-50 text-center text-lg-start">
            <div className="text-center p-3 text-amber-600">
              © {date} Restore Hub
            </div>
          </footer>
        </Router>
      </div>
    </UserContext.Provider>
  );
}

export default App;
