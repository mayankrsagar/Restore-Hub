import { useContext, useEffect, useState } from "react";

import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../api/axiosConfig";
import { UserContext } from "../../App";
import Footer from "./Footer";
import Header from "./Header";

/**
 * ItemDetails — Tailwind version
 *
 * - Uses formatDateIST for all displayed dates
 * - StarRow uses unique gradient ids for half stars
 * - Minor safety checks and loading state handling
 */

const formatDateIST = (d) => {
  try {
    return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch {
    return d || "";
  }
};

const StarRow = ({ value }) => {
  // value is numeric, can be .5 increments
  const fullStars = Math.floor(value);
  const half = value - fullStars >= 0.5;
  const stars = [];
  for (let i = 0; i < fullStars; i++) stars.push("full");
  if (half) stars.push("half");
  while (stars.length < 5) stars.push("empty");

  return (
    <div className="flex items-center gap-1">
      {stars.map((s, i) => {
        // create unique id per half star to avoid defs collision in DOM
        const gradId = `halfGrad-${value}-${i}`;
        return (
          <svg
            key={i}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={
              s === "full"
                ? "#b45309"
                : s === "half"
                ? `url(#${gradId})`
                : "none"
            }
            stroke="#b45309"
            strokeWidth="1"
            className="inline-block"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            role="img"
          >
            {s === "half" && (
              <defs>
                <linearGradient id={gradId}>
                  <stop offset="50%" stopColor="#b45309" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <path d="M12 .587l3.668 7.431L23.5 9.75l-5.5 5.364L19.334 24 12 19.897 4.666 24 6 15.114 0.5 9.75l7.832-1.732L12 .587z" />
          </svg>
        );
      })}
    </div>
  );
};

StarRow.propTypes = {
  value: PropTypes.number.isRequired,
};

export default function ItemDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { userData, fetchMe } = useContext(UserContext) || {};

  const [itemDetail, setItemDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  const [alert, setAlert] = useState(null); // {type: 'success'|'error'|'info', text}
  const [ratingLoading, setRatingLoading] = useState(false);
  const [userRating, setUserRating] = useState(null); // buyer's previous rating
  const [ratingValue, setRatingValue] = useState(0); // slider-controlled value (0.5 steps)

  // fetch item details
  const fetchDetails = async () => {
    if (!itemId) return;
    setLoading(true);
    setAlert(null);
    try {
      const res = await api.get(`/user/fetchitemdetails/${itemId}`);
      if (res?.data?.success) {
        setItemDetail(res.data.data ?? null);
      } else {
        setItemDetail(null);
        setAlert({
          type: "error",
          text: res?.data?.message || "Failed to fetch item details",
        });
      }
    } catch (err) {
      console.error("Error fetching item details:", err);
      setItemDetail(null);
      setAlert({ type: "error", text: "Error fetching details" });
    } finally {
      setLoading(false);
    }
  };

  // fetch current buyer rating (if buyer)
  const fetchUserRating = async () => {
    if (!userData || userData.type !== "buyer" || !itemId) return;
    try {
      const res = await api.get(`/user/seller/items/${itemId}/my-rating`);
      if (res?.data?.success) {
        const ur = res.data.data?.userRating ?? null;
        setUserRating(ur);
        setRatingValue(ur ?? 0);
      } else {
        setUserRating(null);
      }
    } catch (err) {
      console.warn("Failed to fetch user rating:", err);
      setUserRating(null);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchUserRating();
    // we want to refetch when itemId or current user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, userData?.id, userData?.type]);

  // owner check
  const isOwner = (() => {
    if (!userData || !itemDetail) return false;
    const ownerId =
      itemDetail?.sellerId?.id ?? itemDetail?.sellerId ?? itemDetail?.seller;
    const userId = userData.id ?? userData._id;
    try {
      return (
        ownerId &&
        userId &&
        ownerId.toString().trim() === userId.toString().trim()
      );
    } catch {
      return false;
    }
  })();

  const handleBack = () => navigate(-1);

  // delete
  const handleDelete = async () => {
    if (!isOwner) {
      setAlert({
        type: "error",
        text: "Only the seller can delete this item.",
      });
      setDeleteOpen(false);
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.delete(`/user/seller/${itemId}`);
      if (res?.data?.success) {
        setAlert({ type: "success", text: res.data.message || "Item deleted" });
        setDeleteOpen(false);
        navigate("/dashboard");
      } else {
        throw new Error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setAlert({ type: "error", text: "Failed to delete item" });
    } finally {
      setActionLoading(false);
    }
  };

  // buy flow
  const handleBuy = () => {
    if (!userData) {
      setAlert({ type: "info", text: "Please login to buy this item." });
      navigate("/login");
      return;
    }
    if (userData.type !== "buyer") {
      setAlert({ type: "error", text: "Only buyers can purchase items." });
      return;
    }
    if (isOwner) {
      setAlert({ type: "error", text: "You cannot buy your own item." });
      return;
    }
    setBuyOpen(true);
  };

  const confirmBuy = async () => {
    setBuyOpen(false);
    try {
      setActionLoading(true);
      const res = await api.post(`/user/orders/buy/${itemId}`);
      if (res?.data?.success) {
        setAlert({
          type: "success",
          text: res.data.message || "Purchase successful",
        });
        if (typeof fetchMe === "function") await fetchMe();
        navigate("/dashboard");
      } else {
        throw new Error(res?.data?.message || "Purchase failed");
      }
    } catch (err) {
      console.error("Purchase failed:", err);
      const msg = err?.response?.data?.message || "Failed to complete purchase";
      setAlert({ type: "error", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // rating submit
  const handleRatingSubmit = async (val) => {
    // only buyers who are not owner can rate
    if (userData?.type !== "buyer" || isOwner) return;
    setRatingLoading(true);
    setAlert(null);
    try {
      const res = await api.post(`/user/seller/items/${itemId}/rate`, {
        rating: val,
      });
      if (res?.data?.success) {
        setAlert({ type: "success", text: "Rating submitted successfully" });
        setUserRating(val);
        // refresh details
        await fetchDetails();
      } else {
        setAlert({
          type: "error",
          text: res?.data?.message || "Failed to submit rating",
        });
      }
    } catch (err) {
      console.error("Rating submission failed:", err);
      setAlert({ type: "error", text: "Failed to submit rating" });
    } finally {
      setRatingLoading(false);
    }
  };

  // helper to render image or fallback
  const renderImage = () => {
    const imgUrl =
      itemDetail?.photo?.url || itemDetail?.photo?.secure_url || null;
    if (!imgUrl) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded h-80">
          <span className="text-amber-600">No image available</span>
        </div>
      );
    }
    return (
      <img
        src={imgUrl}
        alt={itemDetail?.name || "item image"}
        className="w-full h-80 object-cover rounded"
        onError={(e) => {
          // fallback to a placeholder file path
          if (e.currentTarget.src !== "/placeholder-image.png") {
            e.currentTarget.src = "/placeholder-image.png";
          }
        }}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-8">
        {alert && (
          <div
            className={`mb-4 p-3 rounded ${
              alert.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : alert.type === "error"
                ? "bg-rose-50 text-rose-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {alert.text}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full w-12 h-12 border-4 border-amber-300 border-t-transparent" />
            <div className="mt-3 text-amber-600">Loading item details...</div>
          </div>
        ) : !itemDetail ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-amber-800">
              Item not found
            </h3>
            <p className="text-amber-600 mt-2">
              {`This item may have been removed or doesn't exist.`}
            </p>
            <div className="mt-4">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-amber-700 text-white rounded"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="md:flex">
              <div className="md:w-7/12 p-4">{renderImage()}</div>

              <div className="md:w-5/12 p-6 flex flex-col">
                <div className="mb-4">
                  <button
                    onClick={handleBack}
                    className="text-sm text-amber-700 hover:underline"
                  >
                    ← Back
                  </button>
                </div>

                <h2 className="text-2xl font-semibold text-amber-800 mb-2">
                  {itemDetail.name}
                </h2>

                <div className="mb-3">
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="text-amber-700">
                    {itemDetail.address || "N/A"}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm text-gray-600">Price (₹)</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {itemDetail.price ?? "N/A"}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Rating</div>

                  {userData?.type === "buyer" && !isOwner ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <StarRow value={ratingValue} />
                          <div className="text-sm text-amber-600">
                            {ratingValue ? `${ratingValue} / 5` : "Not rated"}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          You can give 0.5 steps
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={ratingValue}
                        onChange={(e) => setRatingValue(Number(e.target.value))}
                        className="w-full"
                        aria-label="Rating slider"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRatingSubmit(ratingValue)}
                          disabled={ratingLoading}
                          className={`px-3 py-1 rounded ${
                            ratingLoading
                              ? "bg-amber-300 text-white cursor-not-allowed"
                              : "bg-amber-700 text-white"
                          }`}
                        >
                          {ratingLoading ? "Saving..." : "Submit Rating"}
                        </button>
                        {userRating !== null && (
                          <div className="text-sm text-amber-600">
                            You rated: {userRating}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <StarRow value={itemDetail.ratingAverage ?? 0} />
                      <div className="text-sm text-amber-600">
                        ({itemDetail.ratingCount ?? 0} rating
                        {(itemDetail.ratingCount ?? 0) !== 1 ? "s" : ""})
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <div className="text-sm text-gray-600">Contact</div>
                  <div className="text-amber-700">
                    {itemDetail.phone || "N/A"}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600">Type</div>
                  <div className="inline-block px-2 py-1 mt-1 rounded bg-amber-100 text-amber-800 text-sm">
                    {itemDetail.type || "N/A"}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600">
                    {itemDetail.details || "No description provided."}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div>
                    {userData?.type === "buyer" && !isOwner && (
                      <button
                        onClick={handleBuy}
                        disabled={actionLoading}
                        className={`px-4 py-2 rounded ${
                          actionLoading
                            ? "bg-amber-300 text-white cursor-not-allowed"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {actionLoading ? "Processing..." : "Buy Now"}
                      </button>
                    )}

                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/edit-item/${itemId}`)}
                          disabled={actionLoading}
                          className="px-3 py-1 border rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteOpen(true)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-rose-600 text-white rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-500">
                    Posted: {formatDateIST(itemDetail?.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Delete modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-rose-700">
                Confirm Delete
              </h3>
            </div>
            <div className="p-4">
              <p>
                Are you sure you want to delete this item? This action cannot be
                undone.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteOpen(false)}
                  className="px-3 py-1 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className={`px-3 py-1 rounded ${
                    actionLoading
                      ? "bg-rose-300 text-white cursor-not-allowed"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy modal */}
      {buyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-amber-800">
                Confirm Purchase
              </h3>
            </div>
            <div className="p-4">
              <p>
                Are you sure you want to buy <strong>{itemDetail?.name}</strong>{" "}
                for <strong>₹{itemDetail?.price}</strong>?
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setBuyOpen(false)}
                  className="px-3 py-1 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBuy}
                  disabled={actionLoading}
                  className={`px-3 py-1 rounded ${
                    actionLoading
                      ? "bg-amber-300 text-white cursor-not-allowed"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {actionLoading ? "Processing..." : "Confirm Buy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
