import { useContext, useEffect, useState } from "react";

import { message, Modal } from "antd";
import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../api/axiosConfig";
import { UserContext } from "../../App";
import NavBar from "./NavBar";

const ItemDetails = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { userData, fetchMe } = useContext(UserContext) || {};
  const [itemDetail, setItemDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [buyModal, setBuyModal] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/user/fetchitemdetails/${itemId}`);
      if (res.data?.success) {
        setItemDetail(res.data.data);
      } else {
        message.error(res.data?.message || "Failed to fetch item details");
        setItemDetail(null);
      }
    } catch (error) {
      console.error("Error fetching item details:", error);
      message.error("Error fetching details");
      setItemDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!itemId) return;
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const handleBack = () => {
    navigate("/items");
  };

  // Determine ownership
  const isOwner = (() => {
    if (!userData || !itemDetail) return false;
    const ownerId = itemDetail?.sellerId?._id || itemDetail?.sellerId;
    const userId = userData.id || userData._id;
    return ownerId && userId && ownerId.toString() === userId.toString();
  })();

  const handleDelete = async () => {
    if (!isOwner) {
      message.error("Only the seller can delete this item.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.delete(`/user/seller/${itemId}`);
      if (res.data?.success) {
        message.success(res.data.message || "Item deleted");
        navigate("/dashboard");
      } else {
        throw new Error(res.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      message.error("Failed to delete item");
    } finally {
      setActionLoading(false);
      setDeleteModal(false);
    }
  };

  const handleBuy = () => {
    if (!userData) {
      message.info("Please login to buy this item.");
      navigate("/login");
      return;
    }
    if (userData.type !== "buyer") {
      message.error("Only buyers can purchase items.");
      return;
    }
    if (isOwner) {
      message.error("You cannot buy your own item.");
      return;
    }
    setBuyModal(true);
  };

  const confirmBuy = async () => {
    setBuyModal(false);
    try {
      setActionLoading(true);
      const res = await api.post(`/user/buy/${itemId}`);
      if (res.data?.success) {
        message.success(res.data.message || "Purchase successful");
        if (typeof fetchMe === "function") await fetchMe();
        navigate("/dashboard");
      } else {
        throw new Error(res.data?.message || "Purchase failed");
      }
    } catch (err) {
      console.error("Purchase failed:", err);
      message.error(
        err?.response?.data?.message || "Failed to complete purchase"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderImage = () => {
    const imgUrl =
      itemDetail?.photo?.url || itemDetail?.photo?.secure_url || null;
    if (!imgUrl) {
      return (
        <div
          className="d-flex align-items-center justify-content-center bg-light rounded"
          style={{ height: 300 }}
        >
          <span>No image available</span>
        </div>
      );
    }
    return (
      <Card.Img
        variant="top"
        src={imgUrl}
        alt={itemDetail?.name || "item image"}
        className="rounded"
        style={{ objectFit: "cover", height: "100%" }}
        onError={(e) => {
          e.target.src = "/placeholder-image.png";
        }}
      />
    );
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <Container className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading item details...</span>
          </Spinner>
        </Container>
      </>
    );
  }

  if (!itemDetail) {
    return (
      <>
        <NavBar />
        <Container className="text-center py-5">
          <h5 className="text-muted">Item not found</h5>
          <p className="text-muted">
            {`This item may have been removed or doesn't exist.
          `}
          </p>
          <Button variant="primary" onClick={handleBack}>
            Go Back
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Container className="mt-4">
        <Card className="shadow-sm">
          <Row className="g-0">
            {/* Image column */}
            <Col xs={12} md={7} className="p-3">
              {renderImage()}
            </Col>

            {/* Details column */}
            <Col xs={12} md={5}>
              <Card.Body className="p-4">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleBack}
                  className="mb-3"
                >
                  ← Back
                </Button>

                <Card.Title className="mb-3">{itemDetail.name}</Card.Title>
                <hr />

                <div className="mb-3">
                  <strong className="d-block mb-1">Address:</strong>
                  <span className="text-muted">
                    {itemDetail.address || "N/A"}
                  </span>
                </div>

                <div className="mb-3">
                  <strong className="d-block mb-1">Price (₹):</strong>
                  <span className="text-success fw-bold fs-5">
                    {itemDetail.price ?? "N/A"}
                  </span>
                </div>

                <div className="mb-3">
                  <strong className="d-block mb-1">Contact:</strong>
                  <span className="text-muted">
                    {itemDetail.phone || "N/A"}
                  </span>
                </div>

                <div className="mb-3">
                  <strong className="d-block mb-1">Type:</strong>
                  <span className="badge bg-info text-dark">
                    {itemDetail.type || "N/A"}
                  </span>
                </div>

                <div className="mb-4">
                  <h6 className="mb-2">Description</h6>
                  <p className="text-muted">
                    {itemDetail.details || "No description provided."}
                  </p>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    {userData?.type === "buyer" && !isOwner && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleBuy}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Processing..." : "Buy Now"}
                      </Button>
                    )}

                    {isOwner && (
                      <>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => navigate(`/edit-item/${itemId}`)}
                          className="me-2"
                          disabled={actionLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setDeleteModal(true)}
                          disabled={actionLoading}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>

                  <small className="text-muted">
                    Posted:{" "}
                    {new Date(itemDetail.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={deleteModal}
        onOk={handleDelete}
        onCancel={() => setDeleteModal(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete this item? This action cannot be
          undone.
        </p>
      </Modal>

      {/* Buy Confirmation Modal */}
      <Modal
        title="Confirm Purchase"
        open={buyModal}
        onOk={confirmBuy}
        onCancel={() => setBuyModal(false)}
        okText="Confirm Buy"
        okButtonProps={{ type: "primary", danger: false }}
      >
        <p>Are you sure you want to buy this item?</p>
      </Modal>
    </>
  );
};

export default ItemDetails;
