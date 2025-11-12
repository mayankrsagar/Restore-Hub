// src/componets/common/Register.jsx
import { useState } from "react";

import { message } from "antd";
import { Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import api from "../../api/axiosConfig";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    type: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.type
    ) {
      message.warning("Please fill all required fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      message.warning("Please enter a valid email address");
      return;
    }

    // Phone validation (10-15 digits)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ""))) {
      message.warning("Please enter a valid phone number (10-15 digits)");
      return;
    }

    // Password length validation
    if (formData.password.length < 6) {
      message.warning("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);

      const submissionData = {
        ...formData,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
      };

      const res = await api.post("/user/register", submissionData);
      if (res.data?.success) {
        message.success(
          res.data.message || "Registered successfully! Please login."
        );
        navigate("/login");
      } else {
        message.error(res.data?.message || "Registration failed");
      }
    } catch (err) {
      console.error("Register error:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="first-container">
      <Container
        component="main"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          // minHeight: "100vh",
          // paddingTop: 24,
          // paddingBottom: 96,
        }}
      >
        {/* Match Login's visual layout: modest padding, small border radius, no heavy box-shadow */}
        <Box
          sx={{
            // marginTop: 8,
            marginBottom: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px",
            borderRadius: "5px",
            width: "100%",
            maxWidth: 420,
            // Avoid overriding background so it visually matches Login
            // Remove heavy boxShadow/backgroundColor to be same as login page
            position: "relative",
          }}
        >
          <Avatar sx={{ bgcolor: "secondary.main", mb: 1 }} />
          <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
            Register
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              placeholder="Enter 10-15 digit number"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              value={formData.password}
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

            <TextField
              select
              required
              margin="normal"
              fullWidth
              id="type"
              label="User Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>Select Type</em>
              </MenuItem>
              <MenuItem value="buyer">Buyer</MenuItem>
              <MenuItem value="seller">Seller</MenuItem>
            </TextField>

            {/* Button styled to match Login (centered, 200px width) */}
            <Box mt={2} display="flex" justifyContent="center">
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 1, mb: 2 }}
                style={{ width: "200px" }}
                disabled={loading}
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </Button>
            </Box>

            <Grid container>
              <Grid item>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Have an account?
                  <Link
                    to="/login"
                    style={{
                      color: "blue",
                      marginLeft: 6,
                      textDecoration: "none",
                    }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default Register;
