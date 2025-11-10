// src/componets/common/NavBar.jsx
import { useContext } from "react";

import PropTypes from "prop-types";
import { Button, Container, Nav, Navbar as RBNavbar } from "react-bootstrap";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";

import api from "../../api/axiosConfig";
import { UserContext } from "../../App";

const NavBar = ({ setSelectedComponent }) => {
  const navigate = useNavigate();
  const { userData, setUserData, fetchMe } = useContext(UserContext) || {};

  const handleLogout = async () => {
    try {
      await api.post("/user/logout");
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      setUserData?.(null);
      localStorage.removeItem("user");
      if (typeof fetchMe === "function") {
        try {
          await fetchMe();
        } catch (e) {
          // ignore
        }
      }
      navigate("/login");
    }
  };

  const handleOptionClick = (component) => {
    if (typeof setSelectedComponent === "function") {
      setSelectedComponent(component);
    }
  };

  return (
    <RBNavbar expand="lg" className="bg-body-tertiary">
      <Container fluid>
        <RBNavbar.Brand as={RouterNavLink} to="/">
          <h3 style={{ color: "black", marginBottom: 0 }}>Restore Hub</h3>
        </RBNavbar.Brand>
        <RBNavbar.Toggle aria-controls="navbarScroll" />
        <RBNavbar.Collapse id="navbarScroll">
          <Nav
            className="me-auto my-2 my-lg-0"
            style={{ maxHeight: "100px" }}
            navbarScroll
          >
            <Nav.Link as={RouterNavLink} to="/">
              Home
            </Nav.Link>

            {/* FIXED: Show Items link for both seller and buyer */}
            {(userData?.type === "seller" || userData?.type === "buyer") && (
              <Nav.Link
                as={RouterNavLink}
                to="/items"
                onClick={() => handleOptionClick("items")}
              >
                Items
              </Nav.Link>
            )}

            {/* Show My Purchases only for buyers */}
            {userData?.type === "buyer" && (
              <Nav.Link as={RouterNavLink} to="/my-purchases">
                My Purchases
              </Nav.Link>
            )}
          </Nav>

          <Nav className="d-flex align-items-center gap-2">
            {userData ? (
              <>
                <span className="text-muted small">
                  Hi, {userData.name || userData.email}
                </span>
                <Button
                  onClick={handleLogout}
                  size="sm"
                  variant="outline-danger"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={RouterNavLink} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={RouterNavLink} to="/register">
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </RBNavbar.Collapse>
      </Container>
    </RBNavbar>
  );
};

NavBar.propTypes = {
  setSelectedComponent: PropTypes.func,
};

export default NavBar;
