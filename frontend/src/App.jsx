// src/App.jsx
import "./App.css";

import { createContext, useEffect, useState } from "react";

import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import api from "./api/axiosConfig";
import Dashboard from "./componets/common/Dashboard";
import Home from "./componets/common/Home";
import ItemDetails from "./componets/common/ItemDetails";
import Items from "./componets/common/Items/items";
import Login from "./componets/common/Login";
import NavBar from "./componets/common/NavBar";
import Register from "./componets/common/Register";
import EditItem from "./componets/seller/EditItem";
import ProtectedRoute from "./routes/ProtectedRoute";

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
      <div className="App">
        <Router>
          <NavBar />
          <div className="content">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <Home />
                  </ProtectedRoute>
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
              {/* ✅ FIXED: Added missing loading prop */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              {/* ✅ FIXED: Added missing loading prop for Items route */}
              <Route
                path="/items"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <Items />
                  </ProtectedRoute>
                }
              />
              {/* ✅ FIXED: Added missing loading prop for edit-item route */}
              <Route
                path="/edit-item/:itemId"
                element={
                  <ProtectedRoute loading={loadingAuth}>
                    <EditItem />
                  </ProtectedRoute>
                }
              />
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <footer className="footer bg-light text-center text-lg-start">
            <div className="text-center p-3">
              © {date} Copyright: Restore Hub
            </div>
          </footer>
        </Router>
      </div>
    </UserContext.Provider>
  );
}

export default App;
