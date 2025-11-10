// src/componets/common/Home.jsx
import { useContext } from 'react';

import {
  Button,
  Container,
  Nav,
  Navbar,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { UserContext } from '../../App';
import AllItems from './AllItems';

const Home = () => {
  const { userData } = useContext(UserContext);

  const isLoggedIn = !!userData;

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary mb-3">
        <Container fluid>
          <Navbar.Brand as={Link} to="/">
            <h2 style={{ margin: 0 }}>Restore Hub</h2>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/">
                Home
              </Nav.Link>

              {!isLoggedIn && (
                <>
                  <Nav.Link as={Link} to="/login">
                    Login
                  </Nav.Link>
                  <Nav.Link as={Link} to="/register">
                    Register
                  </Nav.Link>
                </>
              )}

              {isLoggedIn && (
                <>
                  <Nav.Link as={Link} to="/dashboard">
                    Dashboard
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div
        id="home-container"
        className="first-container"
        style={{ padding: "3rem 0" }}
      >
        <Container>
          <div
            className="content-home"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 20,
              padding: "2rem 1rem",
            }}
          >
            {isLoggedIn ? (
              <>
                <p style={{ fontSize: "1.8rem", fontWeight: 500 }}>
                  Welcome back, <strong>{userData?.name || "User"}</strong> 👋
                </p>
                <p style={{ fontSize: "1.2rem" }}>
                  Manage your items, explore the community, and keep restoring!
                </p>
                <Button
                  as={Link}
                  to="/dashboard"
                  variant="success"
                  size="md"
                  className="m-2"
                >
                  Go to Dashboard
                </Button>
              </>
            ) : (
              <>
                <p style={{ fontSize: "1.6rem", lineHeight: 1.4 }}>
                  Revitalizing Lives,
                  <br />
                  Rebuilding Communities: <strong>Restoration Hub</strong>
                </p>

                <Button
                  as={Link}
                  to="/register"
                  variant="warning"
                  size="md"
                  className="m-2"
                >
                  Want to sell? Click here
                </Button>
              </>
            )}
          </div>
        </Container>
      </div>

      <Container className="second-container my-5">
        <h2 className="text-center my-4">Available Products</h2>
        <AllItems />
      </Container>
    </>
  );
};

export default Home;
