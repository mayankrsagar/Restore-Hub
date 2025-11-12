// src/pages/Items.jsx (or src/componets/common/Items.jsx)
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { message, Modal } from "antd";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { Box, Typography } from "@mui/material";
import CardMedia from "@mui/material/CardMedia";

import api from "../../../api/axiosConfig";
import { UserContext } from "../../../App";
import NavBar from "../NavBar";

const PAGE_LIMIT = 6;

const Items = () => {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext) || {};
  const userType = userData?.type;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const observerRef = useRef(null);
  const bottomRef = useRef(null);

  const getApiEndpoint = useCallback(() => {
    return userType === "buyer"
      ? "/user/seller/allpublicitems"
      : "/user/seller/getallitems";
  }, [userType]);

  const fetchPage = useCallback(
    async (pg = 1, append = false) => {
      try {
        if (pg === 1) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const endpoint = getApiEndpoint();
        const res = await api.get(endpoint, {
          params: { page: pg, limit: PAGE_LIMIT },
        });

        if (res.data?.success) {
          const items = res.data.data?.items || res.data.data || [];
          const totalItems =
            res.data.data?.pagination?.totalItems || items.length;

          setHasMore(pg * PAGE_LIMIT < totalItems);
          setItems((prev) => (append ? [...prev, ...items] : items));
        } else {
          throw new Error(res.data?.message || "Failed to fetch items");
        }
      } catch (err) {
        console.error("Failed to fetch items:", err);
        setError(err.message);
        if (pg === 1) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [getApiEndpoint]
  );

  useEffect(() => {
    if (userType) {
      fetchPage(1, false);
      setPage(1);
    }
  }, [fetchPage, userType]);

  useEffect(() => {
    if (!bottomRef.current || !hasMore || loadingMore || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          fetchPage(nextPage, true);
          setPage(nextPage);
        }
      },
      { rootMargin: "100px" }
    );

    observerRef.current.observe(bottomRef.current);
    return () => observerRef.current?.disconnect();
  }, [bottomRef, fetchPage, page, hasMore, loadingMore, loading]);

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  };

  const handleDeleteClick = (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const itemId = deleteTarget;
    setDeleteTarget(null);

    const previous = [...items];
    setItems((prev) => prev.filter((it) => it._id !== itemId));

    try {
      const res = await api.delete(`/user/seller/${itemId}`);
      if (res.data?.success) {
        message.success(res.data.message || "Item deleted");

        const remainingItems = items.length - 1;
        const expectedItems = page * PAGE_LIMIT;
        if (remainingItems < expectedItems && hasMore) {
          const nextPage = page + 1;
          fetchPage(nextPage, true);
        }
      } else {
        throw new Error(res.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      message.error("Failed to delete item. Reverting.");
      setItems(previous);
    }
  };

  const handleViewDetails = (itemId) => {
    navigate(`/item-details/${itemId}`);
  };

  const handleEdit = (itemId) => {
    navigate(`/edit-item/${itemId}`);
  };

  const handleLoadMore = () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    fetchPage(nextPage, true);
    setPage(nextPage);
  };

  // Show loading spinner on first load
  if (loading && page === 1) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading items...</span>
        </Spinner>
      </Container>
    );
  }

  // Show error message with retry button
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
        <Button onClick={() => fetchPage(1, false)}>Retry</Button>
      </Container>
    );
  }

  // Show empty state message
  if (!items || items.length === 0) {
    const isSeller = userType === "seller";
    return (
      <Container className="text-center py-5">
        <h5>No items found</h5>
        <p className="text-muted">
          {isSeller
            ? "You haven't posted any items yet."
            : "No items available at the moment."}
        </p>
        {isSeller && (
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Post Your First Item
          </Button>
        )}
      </Container>
    );
  }

  return (
    <>
      <NavBar />
      <Container fluid className="mt-4">
        {/* Header */}
        <div className="mb-4">
          <Typography variant="h5" component="h2" className="fw-bold">
            {userType === "buyer" ? "All Available Items" : "My Items"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userType === "buyer"
              ? "Browse items from all sellers"
              : "Manage your posted items"}
          </Typography>
        </div>

        {/* Items Grid */}
        <Row className="g-4">
          {items.map((item) => {
            const imgUrl = item?.photo?.url || item?.photo?.secure_url || null;

            return (
              <Col key={item._id} xs={12} md={6} lg={4} xl={3}>
                <Card className="h-100 shadow-sm hover-lift transition-all">
                  {/* Image */}
                  {imgUrl ? (
                    <CardMedia
                      component="img"
                      height="180"
                      image={imgUrl}
                      alt={
                        item?.photo?.originalName || item.name || "item image"
                      }
                      onError={(e) => {
                        e.target.src = "/placeholder-image.png";
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 180,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#f5f5f5",
                      }}
                    >
                      <Typography variant="subtitle1">No image</Typography>
                    </Box>
                  )}

                  {/* Card Body */}
                  <Card.Body className="d-flex flex-column">
                    {/* Title */}
                    <Card.Title className="fw-bold mb-2">
                      {item.name}
                    </Card.Title>

                    {/* Item Details */}
                    <div className="flex-grow-1">
                      <div className="mb-2">
                        <span className="fw-semibold">Price (₹):</span>{" "}
                        {item.price}
                      </div>
                      <div className="mb-3">
                        <span className="fw-semibold">Type:</span> {item.type}
                      </div>
                    </div>

                    {/* Seller Info (for buyers) */}
                    {userType === "buyer" && item.sellerId && (
                      <div className="mb-2 text-muted small">
                        <span className="fw-semibold">Seller:</span>{" "}
                        {item.sellerId.name || "Unknown"}
                      </div>
                    )}

                    {/* Date */}
                    <div className="text-muted small mb-3">
                      Posted: {formatDate(item.createdAt)}
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleViewDetails(item._id)}
                      >
                        View Details
                      </Button>

                      {/* Seller-only actions */}
                      {userType === "seller" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => handleEdit(item._id)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeleteClick(item._id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Infinite scroll sentinel */}
        <div ref={bottomRef} style={{ height: 1, visibility: "hidden" }} />

        {/* Load more button (fallback) */}
        {loadingMore && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
          </div>
        )}

        {!loadingMore && hasMore && (
          <div className="text-center mt-4">
            <Button onClick={handleLoadMore} variant="outline-primary">
              Load More Items
            </Button>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <p className="text-center text-muted mt-4">No more items to load</p>
        )}
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={!!deleteTarget}
        onOk={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete this item? This action cannot be
          undone.
        </p>
      </Modal>
    </>
  );
};

export default Items;
