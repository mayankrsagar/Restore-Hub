import { useState } from 'react';

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
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import api from '../../api/axiosConfig';

const Register = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    type: "", // Added user type field
  });
  const [loading, setLoading] = useState(false);
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

    // Updated validation to include type
    if (!data.name || !data.email || !data.password || !data.type) {
      message.warning("Please fill all fields and select user type");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/user/register", data);
      if (res.data?.success) {
        message.success(res.data.message || "Registered successfully");
        navigate("/login");
      } else {
        message.error(res.data?.message || "Registration failed");
      }
    } catch (err) {
      console.error("Register error:", err);
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
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
            <Avatar sx={{ bgcolor: "secondary.main" }} />
            <Typography component="h1" variant="h5">
              Register
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                value={data.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                value={data.email}
                onChange={handleChange}
                autoComplete="email"
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
                autoComplete="new-password"
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

              {/* New User Type Select Field */}
              <TextField
                select
                margin="normal"
                fullWidth
                id="type"
                label="User Type"
                name="type"
                value={data.type}
                onChange={handleChange}
                required
              >
                <MenuItem value="">
                  <em>Select Type</em>
                </MenuItem>
                <MenuItem value="buyer">Buyer</MenuItem>
                <MenuItem value="seller">Seller</MenuItem>
              </TextField>

              <Box mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  style={{ width: "200px" }}
                  disabled={loading}
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>
              </Box>

              <Grid container>
                <Grid item>
                  Have an account?
                  <Link
                    style={{ color: "blue", marginLeft: 6 }}
                    to={"/login"}
                    variant="body2"
                  >
                    {" Sign In"}
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

export default Register;
