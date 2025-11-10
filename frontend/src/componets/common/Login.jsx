// src/componets/common/Login.jsx
import {
  useContext,
  useState,
} from 'react';

import { message } from 'antd';
import {
  Container,
  Nav,
} from 'react-bootstrap';
import Navbar from 'react-bootstrap/Navbar';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import api from '../../api/axiosConfig';
import { UserContext } from '../../App';

const Login = () => {
  const navigate = useNavigate();
  const { fetchMe } = useContext(UserContext);

  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data?.email || !data?.password) {
      message.warning("Please fill all fields");
      return;
    }

    try {
      const res = await api.post("/user/login", data);
      if (res.data?.success) {
        message.success(res.data.message || "Logged in successfully");

        if (res.data.userData) {
          localStorage.setItem("user", JSON.stringify(res.data.userData));
        }

        if (typeof fetchMe === "function") {
          await fetchMe();
        }

        navigate("/dashboard");
      } else {
        message.error(res.data?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.status === 401) {
        message.error("Invalid credentials");
      } else {
        message.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container fluid>
          <Navbar.Brand>
            <h2>Restore Hub</h2>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: "100px" }}
              navbarScroll
            ></Nav>
            <Nav>
              <Link to={"/"} style={{ marginRight: 10 }}>
                Home
              </Link>
              <Link to={"/login"} style={{ marginRight: 10 }}>
                Login
              </Link>
              <Link to={"/register"}>Register</Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="first-container">
        <Container
          component="main"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              marginTop: 8,
              marginBottom: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <Avatar sx={{ bgcolor: "secondary.main" }}></Avatar>
            <Typography component="h1" variant="h5">
              Sign In
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                value={data.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
              <TextField
                margin="normal"
                fullWidth
                name="password"
                value={data.password}
                onChange={handleChange}
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  style={{ width: "200px" }}
                >
                  Sign In
                </Button>
              </Box>
              <Grid container>
                <Grid item>
                  Have an account?
                  <Link
                    style={{ color: "blue", marginLeft: 6 }}
                    to={"/register"}
                    variant="body2"
                  >
                    {" Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </div>
    </>
  );
};

export default Login;
