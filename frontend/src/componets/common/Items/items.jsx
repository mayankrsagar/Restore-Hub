// src/componets/common/Items.jsx
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../../../api/axiosConfig";
import { UserContext } from "../../../App";
import Footer from "../Footer";
import Header from "../Header";

const PAGE_LIMIT = 6;

export default function Items() {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext) || {};
  const userType = userData?.type || "buyer";

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // For delete modal & optimistic operations
  const [deleteTarget, setDeleteTarget] = useState(null);
  const prevItemsRef = useRef(null);

  // refs to avoid concurrent fetches & hold observer
  const fetchingRef = useRef(false);
  const observerRef = useRef(null);
  const bottomRef = useRef(null);

  // Build endpoint according to user type (same logic you had)
  const getApiEndpoint = useCallback(() => {
    return userType === "buyer"
      ? "/user/seller/allpublicitems"
      : "/user/seller/getallitems";
  }, [userType]);

  // Format date in IST
  const formatDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    } catch {
      return d;
    }
  };

  // Fetch a page (pg: page number). If append = true, append to items.
  const fetchPage = useCallback(
    async (pg = 1, append = false) => {
      // prevent double fetch
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      setError(null);
      if (pg === 1) {
        setLoadingInitial(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const endpoint = getApiEndpoint();
        const res = await api.get(endpoint, {
          params: { page: pg, limit: PAGE_LIMIT },
        });

        if (!res?.data?.success) {
          const message =
            res?.data?.message || "Failed to fetch items from server";
          throw new Error(message);
        }

        // normalized items array (handle different shapes)
        const fetched =
          res.data?.data?.items ?? res.data?.data ?? res.data?.items ?? [];

        // total items count if pagination info present
        const totalItems =
          res.data?.data?.pagination?.totalItems ??
          res.data?.pagination?.totalItems ??
          fetched.length;

        setHasMore(pg * PAGE_LIMIT < totalItems);
        setItems((prev) => (append ? [...prev, ...fetched] : fetched));
      } catch (err) {
        console.error("fetchPage error:", err);
        setError(err?.message || "An error occurred while loading items.");
        // if first page fails, clear items
        if (pg === 1) setItems([]);
      } finally {
        fetchingRef.current = false;
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [getApiEndpoint]
  );

  // initial load & react to userType changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, userType]);

  // infinite scroll observer - watches bottomRef
  useEffect(() => {
    if (!bottomRef.current) return;
    if (!hasMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (ent.isIntersecting && !fetchingRef.current && hasMore) {
          const next = page + 1;
          fetchPage(next, true);
          setPage(next);
        }
      },
      { rootMargin: "150px" }
    );

    io.observe(bottomRef.current);
    observerRef.current = io;

    return () => {
      observerRef.current?.disconnect();
    };
  }, [bottomRef, hasMore, page, fetchPage]);

  // Manual load more (fallback)
  const handleLoadMore = () => {
    if (!hasMore || fetchingRef.current) return;
    const next = page + 1;
    fetchPage(next, true);
    setPage(next);
  };

  // View / edit
  const handleViewDetails = (id) => navigate(`/item-details/${id}`);
  const handleEdit = (id) => navigate(`/edit-item/${id}`);

  // Delete flow: open modal
  const handleDeleteClick = (id) => setDeleteTarget(id);

  // Confirm delete: optimistic remove, call API, rollback on failure
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);

    prevItemsRef.current = items;
    setItems((prev) => prev.filter((it) => it._id !== id));

    try {
      const res = await api.delete(`/user/seller/${id}`);
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Delete failed");
      }
      // Deleted successfully. Optionally show toast (not included).
      // If we have less items than expected and hasMore is true, try loading next page
      const remainingItems = items.length - 1;
      const expectedItems = page * PAGE_LIMIT;
      if (remainingItems < expectedItems && hasMore) {
        // try to fetch next page to fill the gap
        const next = page + 1;
        fetchPage(next, true);
        setPage(next);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete item. Reverting changes.");
      // rollback
      setItems(prevItemsRef.current || []);
    }
  };

  // Retry initial load
  const handleRetry = () => {
    setError(null);
    setPage(1);
    fetchPage(1, false);
  };

  // UI states
  if (loadingInitial) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full w-10 h-10 border-4 border-amber-300 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-amber-800">
            {userType === "buyer" ? "All Available Items" : "My Items"}
          </h2>
          <p className="text-sm text-amber-600">
            {userType === "buyer"
              ? "Browse items from all sellers."
              : "Manage your posted items."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded border border-rose-100 bg-rose-50 text-rose-700">
            <div className="flex items-center justify-between gap-4">
              <div>{error}</div>
              <div>
                <button
                  onClick={handleRetry}
                  className="px-3 py-1 bg-amber-700 text-white rounded"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!items || items.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-amber-800">
              No items found
            </h3>
            <p className="text-sm text-amber-600 mt-2">
              {userType === "seller"
                ? "You haven't posted any items yet."
                : "No items available at the moment."}
            </p>
            {userType === "seller" && (
              <div className="mt-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2 bg-amber-700 text-white rounded"
                >
                  Post Your First Item
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const imgUrl =
                  item?.photo?.url || item?.photo?.secure_url || null;

                return (
                  <article
                    key={item._id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="h-44 bg-amber-50 flex items-center justify-center overflow-hidden">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item?.photo?.originalName || item.name}
                          onError={(e) =>
                            (e.target.src = "/placeholder-image.png")
                          }
                          className="object-cover w-full h-44"
                        />
                      ) : (
                        <div className="text-amber-400">No image</div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold text-amber-800">
                        {item.name}
                      </h3>
                      <p className="text-sm text-amber-600 mt-2 line-clamp-3">
                        {item.description ?? "No description provided."}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium text-amber-700">
                            ₹ {item.price}
                          </div>
                          <div className="text-amber-600">{item.type}</div>
                        </div>

                        <div className="text-right text-xs text-amber-500">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>

                      {/* seller info for buyers */}
                      {userType === "buyer" && item.sellerId && (
                        <div className="mt-3 text-sm text-amber-600">
                          <span className="font-medium">Seller:</span>{" "}
                          {item.sellerId?.name ?? "Unknown"}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleViewDetails(item._id)}
                          className="flex-1 px-3 py-2 rounded bg-amber-700 text-white text-sm"
                        >
                          View Details
                        </button>

                        {userType === "seller" && (
                          <>
                            <button
                              onClick={() => handleEdit(item._id)}
                              className="px-3 py-2 rounded border border-amber-200 text-amber-700 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item._id)}
                              className="px-3 py-2 rounded border border-rose-200 text-rose-600 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* sentinel for infinite scroll */}
            <div ref={bottomRef} style={{ height: 1, visibility: "hidden" }} />

            {/* loading more */}
            {loadingMore && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full w-8 h-8 border-4 border-amber-300 border-t-transparent" />
              </div>
            )}

            {/* Load more fallback */}
            {!loadingMore && hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  className="px-4 py-2 bg-amber-700 text-white rounded"
                >
                  Load More Items
                </button>
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <p className="text-center text-amber-600 mt-6">
                No more items to load
              </p>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Delete confirmation modal (simple Tailwind) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-md w-full bg-white rounded-lg overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-amber-800">
                Confirm Delete
              </h3>
              <p className="text-sm text-amber-600 mt-2">
                Are you sure you want to delete this item? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex items-center gap-2 p-4 border-t">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-3 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 py-2 rounded bg-rose-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
