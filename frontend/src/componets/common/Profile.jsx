import {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../../api/axiosConfig';
import { UserContext } from '../../App';
import Footer from './Footer';
import Header from './Header';

/* Helpers */
const getImageSrc = (avatarValue) => {
  if (!avatarValue) return null;
  if (typeof avatarValue === "string") {
    const t = avatarValue.trim();
    if (
      t.startsWith("http://") ||
      t.startsWith("https://") ||
      t.startsWith("data:")
    )
      return t;
    if (t.startsWith("/")) {
      const base =
        (api.defaults && api.defaults.baseURL) || window.location.origin;
      return `${base.replace(/\/$/, "")}${t}`;
    }
    const base =
      (api.defaults && api.defaults.baseURL) || window.location.origin;
    return `${base.replace(/\/$/, "")}/${t.replace(/^\//, "")}`;
  }
  if (typeof avatarValue === "object" && avatarValue?.url)
    return getImageSrc(avatarValue.url);
  return null;
};

const isImageFile = (file) => !!file && /^image\//.test(file.type);

/* Main component */
export default function Profile() {
  const navigate = useNavigate();
  const { userData, setUserData, fetchMe } = useContext(UserContext) || {};
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState(null); // {type:'success'|'error', text}

  // avatar
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageBroken, setImageBroken] = useState(false);

  // cropping modal states
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageObj, setCropImageObj] = useState(null); // {src, naturalWidth, naturalHeight}
  const [cropZoom, setCropZoom] = useState(1); // 1..3
  const [cropOffsetX, setCropOffsetX] = useState(0); // -50..50 percent
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const cropCanvasRef = useRef(null);
  const cropSize = 300; // px final square preview & upload

  // edit form
  const [editOpen, setEditOpen] = useState(false);
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
  const [myBougthItems, setMyBougthItems] = useState([]);
  // password modal
  const [pwdOpen, setPwdOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // password visibility toggles (added)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);

  // initialize from userData
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

  /* ---------- Fetch my bought items ---------- */

  const fetchMyBougthItems = async () => {
    if (!userData || userData.type !== "buyer") return;
    try {
      const res = await api.get("/user/orders/my");
      if (res?.data?.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setMyBougthItems(list);
      } else {
        setMyBougthItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch my bought items:", err);
      setMyBougthItems([]);
    }
  };

  useEffect(() => {
    fetchMyBougthItems();
  }, []);

  /* ---------- Validation ---------- */
  const validateFormData = (data) => {
    if (!data.name || !data.name.trim()) return "Name is required.";
    // phone: allow + and digits length 10-15
    const phoneClean = (data.phone || "").replace(/[\s\-()]/g, "");
    if (phoneClean && !/^\+?\d{10,15}$/.test(phoneClean))
      return "Please enter a valid phone number (10-15 digits).";
    // whatsapp similar
    const waClean = (data.whatsapp || "").replace(/[\s\-()]/g, "");
    if (waClean && !/^\+?\d{10,15}$/.test(waClean))
      return "Please enter a valid WhatsApp number (10-15 digits).";
    // email check only if userData.email exists or if you want to allow editing add email here
    // seller requirement
    if (userData?.type === "seller") {
      if (!data.shopName || !data.shopName.trim())
        return "Shop name is required for seller accounts.";
    }
    return "";
  };

  /* ---------- Avatar: cropping & upload ---------- */
  // When user selects file from input
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isImageFile(file)) {
      setAlert({
        type: "error",
        text: "Only image files are allowed (jpeg/png/webp/gif).",
      });
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAlert({ type: "error", text: "Image too large — max 5MB." });
      return;
    }

    // prepare image object for cropping preview
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      const img = new Image();
      img.onload = () => {
        setCropImageObj({
          src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        });
        setCropZoom(1);
        setCropOffsetX(0);
        setCropOffsetY(0);
        setCropOpen(true);
      };
      img.onerror = () => {
        setAlert({ type: "error", text: "Failed to read the image." });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    // reset input value to allow reselect same file later
    e.target.value = null;
  };

  // draw preview to canvas when crop params change
  useEffect(() => {
    if (!cropOpen || !cropImageObj) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = cropImageObj.src;
    img.onload = () => {
      const canvas = cropCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      // calculate source rectangle in original image pixels
      const z = cropZoom;
      const srcW = cropSize / z;
      const srcH = cropSize / z;
      const maxSX = Math.max(0, cropImageObj.naturalWidth - srcW);
      const maxSY = Math.max(0, cropImageObj.naturalHeight - srcH);
      // offset percentage -50..50 => map to range -max/2 .. +max/2
      const sxCenter = (cropImageObj.naturalWidth - srcW) / 2;
      const syCenter = (cropImageObj.naturalHeight - srcH) / 2;
      const sx = sxCenter + (cropOffsetX / 100) * (maxSX / 1);
      const sy = syCenter + (cropOffsetY / 100) * (maxSY / 1);

      ctx.clearRect(0, 0, cropSize, cropSize);
      ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, cropSize, cropSize);
    };
  }, [cropOpen, cropImageObj, cropZoom, cropOffsetX, cropOffsetY]);

  // Call this to produce a Blob from canvas and upload
  const confirmCropAndUpload = async () => {
    if (!cropCanvasRef.current || !cropImageObj) return;
    try {
      setUploading(true);
      const canvas = cropCanvasRef.current;
      await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
      );
      const blob = await new Promise(
        (resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.9) &&
          canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      // canvas.toBlob callback sometimes returns null if immediate; ensure we get a blob:
      let finalBlob = blob;
      if (!finalBlob) {
        // fallback: convert base64
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const res = await fetch(dataUrl);
        finalBlob = await res.blob();
      }

      // Build FormData and upload
      const fd = new FormData();
      fd.append("avatar", finalBlob, "avatar.jpg");

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
          setAlert({ type: "success", text: "Profile picture updated." });
          if (typeof setUserData === "function") {
            setUserData((prev) => ({ ...(prev || {}), avatar: avatarUrl }));
          } else if (typeof fetchMe === "function") {
            await fetchMe();
          }
        } else {
          setAlert({
            type: "error",
            text: "Upload succeeded but server returned no avatar URL.",
          });
        }
      } else {
        setAlert({
          type: "error",
          text: res?.data?.message || "Upload failed.",
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setAlert({ type: "error", text: "Failed to upload avatar." });
    } finally {
      setUploading(false);
      setCropOpen(false);
      setCropImageObj(null);
    }
  };

  /* ---------- Profile save ---------- */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleProfileSave = async () => {
    setAlert(null);
    const v = validateFormData(formData);
    if (v) {
      setAlert({ type: "error", text: v });
      return;
    }

    try {
      const res = await api.put("/user/profile", formData);
      if (res?.data?.success) {
        const updatedUser = res.data.user || {
          ...(userData || {}),
          ...formData,
        };
        if (typeof setUserData === "function") setUserData(updatedUser);
        else if (typeof fetchMe === "function") await fetchMe();
        setAlert({ type: "success", text: "Profile updated successfully." });
        setEditOpen(false);
      } else {
        setAlert({
          type: "error",
          text: res?.data?.message || "Update failed.",
        });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setAlert({ type: "error", text: "Failed to update profile." });
    }
  };

  /* ---------- Password & Delete ---------- */
  const handlePasswordChange = async () => {
    setAlert(null);
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setAlert({ type: "error", text: "Please fill all password fields." });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({
        type: "error",
        text: "New password and confirm do not match.",
      });
      return;
    }
    try {
      const res = await api.put("/user/profile", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      if (res?.data?.success) {
        setAlert({ type: "success", text: "Password changed successfully." });
        setPwdOpen(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setAlert({
          type: "error",
          text: res?.data?.message || "Password change failed.",
        });
      }
    } catch (err) {
      console.error("Change password error:", err);
      setAlert({ type: "error", text: "Failed to change password." });
    }
  };

  const handleDeleteAccount = async () => {
    setAlert(null);
    try {
      const res = await api.delete("/user/me");
      if (res?.data?.success) {
        setAlert({ type: "success", text: "Account deleted." });
        if (typeof setUserData === "function") setUserData(null);
        navigate("/login");
      } else {
        setAlert({
          type: "error",
          text: res?.data?.message || "Account deletion failed.",
        });
      }
    } catch (err) {
      console.error("Delete account error:", err);
      setAlert({ type: "error", text: "Failed to delete account." });
    } finally {
      setDeleteOpen(false);
    }
  };

  /* ---------- UI states ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full w-10 h-10 border-4 border-amber-300 border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-amber-800">
              Please sign in
            </h3>
            <p className="text-amber-600 mt-2">
              You must be logged in to view profile.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = (name) =>
    name
      ? name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "U";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-8">
        {alert && (
          <div
            className={`mb-4 p-3 rounded ${
              alert.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {alert.text}
          </div>
        )}

        <div className="mb-4">
          {userData.type === "seller" && (
            <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
              Seller Account
            </span>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 text-center">
              <div className="relative inline-block">
                {!previewImage || imageBroken ? (
                  <div className="w-28 h-28 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
                    {initials(userData.name)}
                  </div>
                ) : (
                  <img
                    src={previewImage}
                    alt={`${userData.name || "avatar"}'s avatar`}
                    className={`w-28 h-28 rounded-full object-cover ${
                      uploading ? "opacity-60" : ""
                    }`}
                    onError={() => {
                      setImageBroken(true);
                      setPreviewImage(null);
                    }}
                  />
                )}

                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="inline-block animate-spin rounded-full w-8 h-8 border-4 border-white border-t-transparent" />
                  </div>
                )}
              </div>

              <div className="mt-3">
                <label
                  htmlFor="avatar-input"
                  className={`inline-block px-3 py-1 text-sm rounded-md cursor-pointer ${
                    uploading
                      ? "opacity-50 pointer-events-none"
                      : "bg-amber-700 text-white"
                  }`}
                >
                  Change Photo
                </label>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-amber-800">
                {userData.name}
              </h2>
              <p className="text-amber-600">{userData.email}</p>
              <p className="text-amber-600">
                {userData.phone || "Phone not provided"}
              </p>
              <p className="text-amber-600">
                {userData.address || "Address not provided"}
              </p>
              {userData.shopName && (
                <p className="text-amber-600">Shop: {userData.shopName}</p>
              )}
              {userData.bio && (
                <p className="mt-2 text-amber-700">
                  <strong>Bio:</strong> {userData.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-xl font-semibold">
              {userData.totalListings || 0}
            </div>
            <div className="text-sm text-amber-600">Total listings</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-xl font-semibold">
              {userData.itemsSold || 0}
            </div>
            <div className="text-sm text-amber-600">Items sold</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-xl font-semibold">
              {myBougthItems.length || 0}
            </div>
            <div className="text-sm text-amber-600">Items bought</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-xl font-semibold">
              {userData.rating?.count || 0}
            </div>
            <div className="text-sm text-amber-600">Ratings</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 bg-amber-700 text-white rounded"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setPwdOpen(true)}
            className="px-4 py-2 border rounded border-amber-200 text-amber-700"
          >
            Change Password
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 bg-rose-600 text-white rounded"
          >
            Delete Account
          </button>
        </div>

        {/* Contact Links */}
        {(userData.whatsapp || userData.instagram || userData.facebook) && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h4 className="font-semibold text-amber-800 mb-2">Contact Links</h4>
            <div className="space-y-2 text-amber-700">
              {userData.whatsapp && <div>WhatsApp: {userData.whatsapp}</div>}
              {userData.instagram && <div>Instagram: {userData.instagram}</div>}
              {userData.facebook && <div>Facebook: {userData.facebook}</div>}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* ----- Edit Modal ----- */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl bg-white rounded-lg overflow-auto max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-amber-800">
                Edit Profile
              </h3>
              <button
                onClick={() => setEditOpen(false)}
                className="text-amber-600"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-amber-700">
                  Full name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-amber-700">Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-amber-700">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm text-amber-700">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>

              {userData.type === "seller" && (
                <>
                  <div>
                    <label className="block text-sm text-amber-700">
                      Shop name
                    </label>
                    <input
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-amber-700">
                      Preferred contact
                    </label>
                    <select
                      name="preferredContact"
                      value={formData.preferredContact}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border rounded-md"
                    >
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-amber-700">
                      WhatsApp
                    </label>
                    <input
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-amber-700">
                      Instagram
                    </label>
                    <input
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-amber-700">
                      Facebook
                    </label>
                    <input
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 justify-end mt-2">
                <button
                  onClick={() => setEditOpen(false)}
                  className="px-3 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  className="px-4 py-2 rounded bg-amber-700 text-white"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----- Password Modal (wrapped in form for autofill) ----- */}
      {pwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg bg-white rounded-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordChange();
              }}
              autoComplete="on"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-amber-800">
                  Change Password
                </h3>
                <button
                  type="button"
                  onClick={() => setPwdOpen(false)}
                  className="text-amber-600"
                >
                  Close
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-sm text-amber-700">
                    Current password
                  </label>
                  <div className="relative mt-1">
                    <input
                      name="currentPassword"
                      autoComplete="current-password"
                      type={showCurrentPwd ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((p) => ({
                          ...p,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border rounded-md pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd((s) => !s)}
                      className="absolute inset-y-0 right-2 flex items-center px-2"
                      aria-label={
                        showCurrentPwd
                          ? "Hide current password"
                          : "Show current password"
                      }
                    >
                      {showCurrentPwd ? (
                        /* eye-off */
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-amber-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5.523 0-10-4.477-10-10 0-1.03.156-2.02.445-2.937"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        /* eye */
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-amber-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-amber-700">
                    New password
                  </label>
                  <div className="relative mt-1">
                    <input
                      name="newPassword"
                      autoComplete="new-password"
                      type={showNewPwd ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((p) => ({
                          ...p,
                          newPassword: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border rounded-md pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd((s) => !s)}
                      className="absolute inset-y-0 right-2 flex items-center px-2"
                      aria-label={
                        showNewPwd ? "Hide new password" : "Show new password"
                      }
                    >
                      {showNewPwd ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-amber-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5.523 0-10-4.477-10-10 0-1.03.156-2.02.445-2.937"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-amber-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-amber-700">
                    Confirm new password
                  </label>
                  <div className="relative mt-1">
                    <input
                      name="confirmPassword"
                      autoComplete="new-password"
                      type={showConfirmPwd ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border rounded-md pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((s) => !s)}
                      className="absolute inset-y-0 right-2 flex items-center px-2"
                      aria-label={
                        showConfirmPwd
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPwd ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-amber-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5.523 0-10-4.477-10-10 0-1.03.156-2.02.445-2.937"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-amber-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPwdOpen(false)}
                    className="px-3 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-amber-700 text-white"
                  >
                    Change password
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----- Delete Modal ----- */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-lg overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-rose-700">
                Delete Account
              </h3>
              <p className="text-sm text-amber-600 mt-2">
                Are you sure? This action cannot be undone and will remove all
                your data.
              </p>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-3 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded bg-rose-600 text-white"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----- Crop Modal ----- */}
      {cropOpen && cropImageObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-amber-800">
                Crop avatar
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCropOpen(false);
                    setCropImageObj(null);
                  }}
                  className="text-amber-600"
                >
                  Cancel
                </button>
                <button
                  disabled={uploading}
                  onClick={confirmCropAndUpload}
                  className="px-3 py-1 bg-amber-700 text-white rounded"
                >
                  {uploading ? "Uploading…" : "Use & Upload"}
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-shrink-0">
                  <canvas
                    ref={cropCanvasRef}
                    width={cropSize}
                    height={cropSize}
                    className="border rounded"
                    style={{ width: 300, height: 300 }}
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm text-amber-700">Zoom</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={cropZoom}
                      onChange={(e) => setCropZoom(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-amber-600 mt-1">
                      Use zoom to crop closer or farther.
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-amber-700">
                      Horizontal shift
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={cropOffsetX}
                      onChange={(e) => setCropOffsetX(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-amber-600 mt-1">
                      Move the crop area left/right.
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-amber-700">
                      Vertical shift
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={cropOffsetY}
                      onChange={(e) => setCropOffsetY(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-amber-600 mt-1">
                      Move the crop area up/down.
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-amber-600">
                Tip: Use Zoom + shifts to position the face or item in the
                square exactly how you want before uploading.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
