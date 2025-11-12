// src/components/common/Profile.jsx
import { useContext, useEffect, useState } from "react";

import { message, Modal, Upload } from "antd";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  Row,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import {
  CameraOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { Avatar } from "@mui/material";

import api from "../../api/axiosConfig";
import { UserContext } from "../../App";
import NavBar from "./NavBar";

/**
 * Helpers:
 * - getImageSrc: normalize avatar value from server (http(s), data:, or relative path)
 * - isImageFile: basic mime-type check
 */
const getImageSrc = (avatarValue) => {
  if (!avatarValue) return null;

  // If already a full URL or data URI, return as-is
  if (typeof avatarValue === "string") {
    const trimmed = avatarValue.trim();
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:")
    ) {
      return trimmed;
    }
    // If relative path (starts with '/'), try to prefix with axios baseURL or window.origin
    if (trimmed.startsWith("/")) {
      // prefer axios baseURL if set
      const base =
        (api.defaults && api.defaults.baseURL) || window.location.origin;
      return `${base.replace(/\/$/, "")}${trimmed}`;
    }
    // else assume it's a path-like string; try baseURL
    const base =
      (api.defaults && api.defaults.baseURL) || window.location.origin;
    return `${base.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
  }

  // If server returned an object with url property
  if (typeof avatarValue === "object" && avatarValue?.url) {
    return getImageSrc(avatarValue.url);
  }

  return null;
};

const isImageFile = (file) => {
  return !!file && /^image\/(jpeg|png|gif|webp|bmp|svg\+xml?)$/.test(file.type);
};

const Profile = () => {
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const { userData, setUserData, fetchMe } = userContext || {};
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageBroken, setImageBroken] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    bio: "",
    shopName: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    preferredContact: "phone",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // initialize form + preview
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        phone: userData.phone || "",
        address: userData.address || "",
        bio: userData.bio || "",
        shopName: userData.shopName || "",
        whatsapp: userData.whatsapp || "",
        instagram: userData.instagram || "",
        facebook: userData.facebook || "",
        preferredContact: userData.preferredContact || "phone",
      });
      const src = getImageSrc(userData.avatar || userData.avatarUrl);
      setPreviewImage(src);
      setImageBroken(false);
    }
    setLoading(false);
  }, [userData]);

  // upload handler: accepts a File (not an UploadFile)
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    if (!isImageFile(file)) {
      message.error("Please upload a valid image (jpeg/png/webp/gif).");
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("avatar", file);

      const res = await api.post("/user/upload-avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.success) {
        const avatarUrl =
          res.data.avatarUrl ||
          res.data.user?.avatar ||
          res.data.user?.avatarUrl;

        if (avatarUrl) {
          const src = getImageSrc(avatarUrl);
          setPreviewImage(src);
          setImageBroken(false);
          message.success("Profile picture updated");

          // update context userData if available
          if (typeof setUserData === "function") {
            setUserData((prev) => ({ ...(prev || {}), avatar: avatarUrl }));
          } else if (typeof fetchMe === "function") {
            // fallback to re-fetch
            try {
              await fetchMe();
            } catch (e) {
              // ignore
            }
          }
        } else {
          message.error("Upload succeeded but server returned no avatar URL.");
        }
      } else {
        message.error(res?.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      message.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    console.log("inside the profiel seciton");
    console.log(userData);
  }, []);

  // antd Upload beforeUpload: extract raw File and call handler; return false to prevent auto upload
  const beforeUpload = (file) => {
    // file can be antd's UploadFile or a File
    const rawFile = file?.originFileObj || file;
    if (!isImageFile(rawFile)) {
      message.error("Only image files are allowed (jpeg/png/webp/gif).");
      return Upload.LIST_IGNORE;
    }
    // 5MB limit
    const maxSize = 5 * 1024 * 1024;
    if (rawFile.size > maxSize) {
      message.error("Image too large. Max size is 5MB.");
      return Upload.LIST_IGNORE;
    }

    // call upload
    handleAvatarUpload(rawFile);
    // prevent antd from auto uploading
    return false;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await api.put("/user/profile", formData);
      if (res.data?.success) {
        message.success("Profile updated successfully");
        setEditModal(false);

        const updatedUser = res.data.user || {
          ...(userData || {}),
          ...formData,
        };

        if (typeof setUserData === "function") {
          setUserData(updatedUser);
        } else if (typeof fetchMe === "function") {
          await fetchMe();
        }
      } else {
        message.error(res.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      message.error("Failed to update profile");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    try {
      const res = await api.post("/user/change-password", passwordData);
      if (res.data?.success) {
        message.success("Password changed successfully");
        setPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        message.error(res.data?.message || "Password change failed");
      }
    } catch (err) {
      console.error("Password change error:", err);
      message.error("Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await api.delete("/user/delete-account");
      if (res.data?.success) {
        message.success("Account deleted successfully");
        if (typeof setUserData === "function") setUserData(null);
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        message.error(res.data?.message || "Account deletion failed");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      message.error("Failed to delete account");
    } finally {
      setDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <Container className="text-center py-5">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <NavBar />
        <Container className="text-center py-5">
          <h5>Please log in to view your profile</h5>
        </Container>
      </>
    );
  }

  // helper for initials fallback
  const getInitials = (name) => {
    if (!name) return null;
    return name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <NavBar />

      <Container className="mt-4">
        {userData.type === "seller" && (
          <div className="mb-3">
            <Badge bg="info" className="p-2">
              <ShopOutlined /> Seller Account
            </Badge>
          </div>
        )}

        {/* Profile Header */}
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Row>
              <Col md={3} className="text-center mb-3 mb-md-0">
                <Upload
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  accept="image/*"
                  disabled={uploading}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "inline-block",
                      cursor: uploading ? "not-allowed" : "pointer",
                    }}
                  >
                    {previewImage && !imageBroken ? (
                      // react-bootstrap Image with onError fallback
                      <Image
                        src={previewImage}
                        roundedCircle
                        fluid
                        key={previewImage} // force re-render when url changes
                        onError={() => {
                          // if image fails to load, clear preview and mark broken
                          setImageBroken(true);
                          setPreviewImage(null);
                        }}
                        style={{
                          width: 120,
                          height: 120,
                          objectFit: "cover",
                          opacity: uploading ? 0.6 : 1,
                          border: "1px solid rgba(0,0,0,0.06)",
                        }}
                        alt={`${userData.name || "avatar"}'s avatar`}
                      />
                    ) : (
                      <Avatar
                        src={previewImage || undefined}
                        alt={userData.name || "avatar"}
                        sx={{
                          width: 120,
                          height: 120,
                          fontSize: 36,
                          bgcolor: "#e6eef0",
                          border: "1px solid rgba(0,0,0,0.06)",
                          opacity: uploading ? 0.6 : 1,
                        }}
                      >
                        {!previewImage && !imageBroken
                          ? getInitials(userData.name) || <UserOutlined />
                          : getInitials(userData.name) || <UserOutlined />}
                      </Avatar>
                    )}

                    {uploading && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          pointerEvents: "none",
                        }}
                      >
                        <Spinner animation="border" size="sm" />
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      cursor: uploading ? "not-allowed" : "pointer",
                      opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    {uploading ? (
                      <span>
                        <Spinner animation="border" size="sm" /> Uploading...
                      </span>
                    ) : (
                      <span>
                        <CameraOutlined /> Change Photo
                      </span>
                    )}
                  </div>
                </Upload>
              </Col>

              <Col md={9}>
                <h3>{userData.name}</h3>
                <p className="text-muted mb-2">
                  <MailOutlined /> {userData.email}
                </p>
                <p className="text-muted mb-2">
                  <PhoneOutlined /> {userData.phone || "Not provided"}
                </p>
                <p className="text-muted mb-2">
                  <EnvironmentOutlined /> {userData.address || "Not provided"}
                </p>
                {userData.type === "seller" && userData.shopName && (
                  <p className="text-muted mb-2">
                    <ShopOutlined /> {userData.shopName}
                  </p>
                )}
                {userData.bio && (
                  <p className="text-muted">
                    <strong>Bio:</strong> {userData.bio}
                  </p>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Stats Card */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{userData.totalListings || 0}</h3>
                <p className="text-muted">Total Listings</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{userData.itemsSold || 0}</h3>
                <p className="text-muted">Items Sold</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{userData.itemsBought || 0}</h3>
                <p className="text-muted">Items Bought</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{userData.rating?.count || 0}</h3>
                <p className="text-muted">Ratings</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <div className="d-flex gap-2 mb-4">
          <Button variant="primary" onClick={() => setEditModal(true)}>
            <EditOutlined /> Edit Profile
          </Button>
          <Button variant="secondary" onClick={() => setPasswordModal(true)}>
            <LockOutlined /> Change Password
          </Button>
          <Button variant="danger" onClick={() => setDeleteModal(true)}>
            Delete Account
          </Button>
        </div>

        {/* Social Links */}
        {(userData.whatsapp || userData.instagram || userData.facebook) && (
          <Card className="shadow-sm">
            <Card.Header>Contact Links</Card.Header>
            <Card.Body>
              {userData.whatsapp && (
                <p className="mb-2">
                  <WhatsAppOutlined /> WhatsApp: {userData.whatsapp}
                </p>
              )}
              {userData.instagram && (
                <p className="mb-2">
                  <InstagramOutlined /> Instagram: {userData.instagram}
                </p>
              )}
              {userData.facebook && (
                <p className="mb-2">
                  <FacebookOutlined /> Facebook: {userData.facebook}
                </p>
              )}
            </Card.Body>
          </Card>
        )}
      </Container>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editModal}
        onOk={handleSubmit}
        onCancel={() => setEditModal(false)}
        okText="Save Changes"
        width={600}
      >
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={formData.address}
              onChange={handleFormChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="bio"
              value={formData.bio}
              onChange={handleFormChange}
            />
          </Form.Group>

          {userData.type === "seller" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Shop Name</Form.Label>
                <Form.Control
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleFormChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Preferred Contact Method</Form.Label>
                <Form.Select
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleFormChange}
                >
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>WhatsApp Number</Form.Label>
                <Form.Control
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleFormChange}
                  placeholder="e.g., +91 9876543210"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Instagram (optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleFormChange}
                  placeholder="@username"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Facebook (optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleFormChange}
                  placeholder="facebook.com/username"
                />
              </Form.Group>
            </>
          )}
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={passwordModal}
        onOk={handlePasswordChange}
        onCancel={() => setPasswordModal(false)}
        okText="Change Password"
      >
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Current Password</Form.Label>
            <Form.Control
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              required
            />
          </Form.Group>
        </Form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        title="Delete Account"
        open={deleteModal}
        onOk={handleDeleteAccount}
        onCancel={() => setDeleteModal(false)}
        okText="Delete Account"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete your account? This will permanently
          remove all your data and cannot be undone.
        </p>
        <p className="text-danger">
          <strong>Warning:</strong> This will also delete all your items and
          orders.
        </p>
      </Modal>
    </>
  );
};

export default Profile;
