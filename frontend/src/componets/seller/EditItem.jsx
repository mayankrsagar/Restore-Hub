// src/componets/seller/EditItem.jsx
import { useContext, useEffect, useState } from "react";

import { message } from "antd";
import { Button, Container, Form } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import api from "../../api/axiosConfig";
import { UserContext } from "../../App";
import NavBar from "../common/NavBar";

const EditItem = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(UserContext) || {};

  const [item, setItem] = useState({
    name: "",
    price: "",
    type: "",
    details: "",
    address: "",
    phone: "",
  });
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch item details on mount
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/fetchitemdetails/${itemId}`);
        if (res.data?.success) {
          const itemData = res.data.data;
          setItem({
            name: itemData.name || "",
            price: itemData.price || "",
            type: itemData.type || "",
            details: itemData.details || "",
            address: itemData.address || "",
            phone: itemData.phone || "",
          });
          setCurrentImage(itemData.photo?.url || null);
        } else {
          message.error(res.data?.message || "Failed to load item details");
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        message.error("Failed to load item details");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  // Check ownership
  useEffect(() => {
    if (userData && currentImage) {
      // Ownership check will be handled on backend during update
      // But we can add a visual indicator here if needed
    }
  }, [userData, currentImage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.type.startsWith("image/")) {
      message.error("Please select an image file");
      e.target.value = ""; // Reset input
      return;
    }
    setItem((prev) => ({ ...prev, photo: file }));
    // Create preview URL
    setCurrentImage(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !item.name ||
      !item.price ||
      !item.type ||
      !item.details ||
      !item.address ||
      !item.phone
    ) {
      message.warning("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", item.name);
    formData.append("price", item.price);
    formData.append("type", item.type);
    formData.append("details", item.details);
    formData.append("address", item.address);
    formData.append("phone", item.phone);

    if (item.photo) {
      formData.append("photo", item.photo);
    }

    try {
      setSubmitting(true);
      const res = await api.put(`/user/seller/${itemId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        message.success(res.data.message || "Item updated successfully");
        navigate(`/item-details/${itemId}`);
      } else {
        message.error(res.data?.message || "Failed to update item");
      }
    } catch (error) {
      console.error("Update error:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <Container className="text-center py-5">
          <p>Loading item details...</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />

      <Container className="mt-4" maxWidth="sm">
        <Box
          sx={{
            marginTop: 4,
            marginBottom: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }} />
          <Typography component="h1" variant="h5">
            Edit Item
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Item Name */}
            <TextField
              margin="normal"
              fullWidth
              id="name"
              label="Item Name"
              name="name"
              value={item.name}
              onChange={handleChange}
              autoFocus
              required
            />

            {/* Price */}
            <TextField
              margin="normal"
              fullWidth
              id="price"
              label="Price (₹)"
              name="price"
              type="number"
              value={item.price}
              onChange={handleChange}
              required
            />

            {/* Type */}
            <TextField
              select
              margin="normal"
              fullWidth
              id="type"
              label="Item Type"
              name="type"
              value={item.type}
              onChange={handleChange}
              required
            >
              <option value="">Select Type</option>
              <option value="House hold">House hold</option>
              <option value="Auto Mobiles">Auto Mobiles</option>
              <option value="Accessories">Accessories</option>
            </TextField>

            {/* Details */}
            <TextField
              margin="normal"
              fullWidth
              id="details"
              label="Item Details"
              name="details"
              value={item.details}
              onChange={handleChange}
              multiline
              rows={4}
              required
            />

            {/* Address */}
            <TextField
              margin="normal"
              fullWidth
              id="address"
              label="Address"
              name="address"
              value={item.address}
              onChange={handleChange}
              required
            />

            {/* Phone */}
            <TextField
              margin="normal"
              fullWidth
              id="phone"
              label="Phone"
              name="phone"
              value={item.phone}
              onChange={handleChange}
              required
            />

            {/* Photo */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Item Photo
              </Typography>
              {currentImage && (
                <CardMedia
                  component="img"
                  height="140"
                  image={currentImage}
                  alt="Current item image"
                  sx={{ mb: 2 }}
                />
              )}
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleDocumentChange}
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Item"}
            </Button>

            <Grid container>
              <Grid item>
                <Button
                  size="small"
                  onClick={() => navigate(`/item-details/${itemId}`)}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default EditItem;
