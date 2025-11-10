import { useEffect, useState } from "react";

import { message } from "antd";
import { Card, Container, Spinner } from "react-bootstrap";

import api from "../../api/axiosConfig";
import NavBar from "./NavBar";

const BoughtItems = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user/orders/my");

      if (res.data?.success) {
        setOrders(res.data.data || []);
      } else {
        setOrders([]);
        message.error(res.data?.message || "Failed to load purchases");
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      message.error("Failed to load purchases");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <div>Loading purchases...</div>
      </Container>
    );
  }

  if (!orders.length) {
    return (
      <Container className="text-center py-5">
        <NavBar />
        <h5>No purchases yet</h5>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <NavBar />
      <h3 className="mb-3">My Purchases</h3>
      {orders.map((o) => (
        <Card key={o._id} className="mb-3">
          <Card.Body>
            <div className="d-flex align-items-start">
              <img
                src={
                  o.itemSnapshot.photo?.url ||
                  o.itemSnapshot.photo?.secure_url ||
                  ""
                }
                alt={o.itemSnapshot.name}
                style={{
                  width: 120,
                  height: 90,
                  objectFit: "cover",
                  marginRight: 16,
                  borderRadius: 6,
                }}
              />
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: 0 }}>{o.itemSnapshot.name}</h5>
                <div className="text-muted">Price paid: ₹{o.pricePaid}</div>
                <div className="text-muted">
                  Bought on: {new Date(o.createdAt).toLocaleString()}
                </div>
                <div className="text-muted">Seller: {o.sellerId}</div>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default BoughtItems;
