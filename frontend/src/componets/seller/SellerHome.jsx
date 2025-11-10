import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { message } from 'antd';
import {
  Button,
  Col,
  Form,
  Row,
} from 'react-bootstrap';

import api from '../../api/axiosConfig';

const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian mobile numbers

const SellerHome = () => {
  const [item, setItem] = useState({
    name: "",
    price: "",
    type: "Select Item Type",
    details: "",
    photo: null,
    address: "",
    phone: "",
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // create preview when photo changes
  useEffect(() => {
    if (!item.photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(item.photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [item.photo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setItem((prev) => ({ ...prev, photo: file }));
  };

  const validate = () => {
    if (
      !item.name ||
      !item.price ||
      !item.address ||
      !item.phone ||
      !item.details
    ) {
      message.warning("Please fill all required fields");
      return false;
    }
    if (!PHONE_REGEX.test(item.phone.toString())) {
      message.error(
        "Phone must be a valid 10-digit Indian mobile number (starts with 6-9)"
      );
      return false;
    }
    return true;
  };

  const postingItem = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("name", item.name);
      formData.append("address", item.address);
      formData.append("price", item.price);
      formData.append("type", item.type);
      formData.append("phone", item.phone);
      formData.append("details", item.details);
      if (item.photo) formData.append("photo", item.photo);

      const res = await api.post("/user/seller/postingitem", formData);

      if (res?.data?.success) {
        message.success(res.data.message || "Item posted successfully");
        if (fileInputRef.current) {
          fileInputRef.current.value = null; // ✅ clears file input
        }

        // reset form (keeps select at default)
        setItem({
          name: "",
          price: "",
          type: "Select Item Type",
          details: "",
          photo: null,
          address: "",
          phone: "",
        });

        // remove preview
        setPreviewUrl(null);

        // notify other parts of app to refresh (UserItems listens for this)
        window.dispatchEvent(new Event("itemPosted"));
      } else {
        message.error(res?.data?.message || "Failed to post item");
      }
    } catch (error) {
      console.error("postingItem error:", error);
      message.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-center">
        <h1 className="my-2">Sell Your Items</h1>
      </div>

      <Form onSubmit={postingItem} className="m-2 p-4">
        <Row className="mb-3">
          <Form.Group as={Col} controlId="itemName">
            <Form.Label>Item Name</Form.Label>
            <Form.Control
              name="name"
              value={item.name}
              onChange={handleChange}
              type="text"
              placeholder="Enter Name"
              required
            />
          </Form.Group>

          <Form.Group as={Col} controlId="itemPrice">
            <Form.Label>Item Price (INR)</Form.Label>
            <Form.Control
              name="price"
              value={item.price}
              onChange={handleChange}
              type="number"
              placeholder="Enter price"
              required
            />
          </Form.Group>

          <Form.Group as={Col} controlId="itemType">
            <Form.Label>Item Type</Form.Label>
            <Form.Select
              name="type"
              value={item.type}
              onChange={handleChange}
              required
            >
              <option value="Select Item Type" disabled>
                Select Type
              </option>
              <option value="House hold">House hold</option>
              <option value="Auto Mobiles">Auto Mobiles</option>
              <option value="Accessories">Accessories</option>
            </Form.Select>
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} controlId="itemPhoto">
            <Form.Label>Item Photo</Form.Label>
            <Form.Control
              name="photo"
              accept="image/*"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {previewUrl && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </Form.Group>

          <Form.Group as={Col} controlId="itemAddress">
            <Form.Label>Address</Form.Label>
            <Form.Control
              name="address"
              value={item.address}
              onChange={handleChange}
              type="text"
              placeholder="Enter address"
              required
            />
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} controlId="itemPhone">
            <Form.Label>Seller Phone</Form.Label>
            <Form.Control
              name="phone"
              value={item.phone}
              onChange={handleChange}
              type="tel"
              placeholder="Enter phone (10 digits)"
              required
            />
          </Form.Group>

          <Form.Group as={Col} controlId="itemDetails">
            <Form.Label>Details</Form.Label>
            <Form.Control
              name="details"
              value={item.details}
              onChange={handleChange}
              required
              as="textarea"
              placeholder="Enter details"
              rows={3}
            />
          </Form.Group>
        </Row>

        <div className="d-flex justify-content-center">
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </Form>
    </>
  );
};

export default SellerHome;
