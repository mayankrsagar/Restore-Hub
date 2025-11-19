import { useEffect, useMemo, useState } from "react";

import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import api from "../../api/axiosConfig";
import Footer from "./Footer";
import Header from "./Header";

/**
 * BoughtItems (buyer purchases)
 *
 * - Loads /user/orders/my
 * - Filters: search (item name), seller name, date range (from/to)
 * - Client-side pagination
 * - Receipt modal with detailed view
 * - Download invoice (HTML file that can be printed to PDF)
 */

const PLACEHOLDER = "/placeholder-image.png";
const DEFAULT_PAGE_SIZE = 9;

export default function BoughtItems() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // receipt modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/user/orders/my");
      if (res?.data?.success) {
        setOrders(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setOrders([]);
        setError(res?.data?.message || "Failed to load purchases");
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      setOrders([]);
      setError(
        "Failed to load purchases. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helpers
  const formatDateIST = (d) => {
    try {
      return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    } catch {
      return d || "";
    }
  };

  const safeSellerName = (seller) => {
    if (!seller) return "Unknown";
    if (typeof seller === "string") return seller;
    if (typeof seller === "object")
      return seller.name || seller.email || String(seller);
    return String(seller);
  };

  // Derived filtered list
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const item = o.itemSnapshot || {};
      const itemName = (item.name || "").toLowerCase();
      const seller = safeSellerName(o.sellerId).toLowerCase();
      const s = search.trim().toLowerCase();
      if (s && !itemName.includes(s) && !seller.includes(s)) return false;
      if (sellerFilter && !seller.includes(sellerFilter.trim().toLowerCase()))
        return false;

      if (dateFrom) {
        const from = new Date(dateFrom);
        const created = new Date(o.createdAt || o.createdAt);
        if (created < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        const created = new Date(o.createdAt || o.createdAt);
        if (created > to) return false;
      }
      return true;
    });
  }, [orders, search, sellerFilter, dateFrom, dateTo]);

  // pagination math
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // only when totalPages changes we need to clamp page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // invoice generation (HTML file)
  const downloadInvoice = (order) => {
    const item = order.itemSnapshot || {};
    const seller = order.sellerId || {};
    const buyer = order.buyerId || order.user || {};
    const invoiceHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice - ${order._id}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body{font-family: Helvetica, Arial, sans-serif;color:#222;margin:0;padding:20px;background:#f6f6f6}
  .container{max-width:800px;margin:0 auto;background:#fff;padding:20px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
  header{display:flex;justify-content:space-between;align-items:center}
  h1{margin:0;font-size:20px;color:#111}
  .meta{font-size:12px;color:#666}
  .row{display:flex;gap:12px;align-items:center}
  .left{flex:1}
  .right{text-align:right}
  .items{width:100%;border-collapse:collapse;margin-top:16px}
  .items th,.items td{border:1px solid #eee;padding:8px;font-size:14px}
  .items th{background:#fafafa;text-align:left}
  .total{display:flex;justify-content:flex-end;margin-top:16px}
  .total .box{background:#fafafa;padding:12px;border-radius:4px;font-weight:600}
  footer{margin-top:28px;font-size:12px;color:#666}
  img{max-width:120px;border-radius:6px}
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="left">
      <h1>Restore Hub — Invoice</h1>
      <div class="meta">Invoice ID: ${order._id}</div>
      <div class="meta">Date: ${formatDateIST(order.createdAt)}</div>
    </div>
    <div class="right">
      <div style="font-size:14px;font-weight:700;color:#111">${
        seller.name || safeSellerName(seller)
      }</div>
      <div class="meta">${seller.email || ""}</div>
      <div class="meta">${seller.phone || ""}</div>
    </div>
  </header>

  <section style="margin-top:18px">
    <div style="display:flex;gap:12px;align-items:center">
      <div style="flex:0 0 120px">
        <img src="${
          (item.photo && (item.photo.url || item.photo.secure_url)) ||
          PLACEHOLDER
        }" alt="item" onerror="this.style.display='none'"/>
      </div>
      <div>
        <div style="font-size:16px;font-weight:700">${item.name || "Item"}</div>
        <div style="color:#666;font-size:13px">${item.description || ""}</div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Price (₹)</th><th>Total (₹)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${item.name || "Item"}</td>
          <td>1</td>
          <td>pcs</td>
          <td>${order.pricePaid ?? item.price ?? "-"}</td>
          <td>${order.pricePaid ?? item.price ?? "-"}</td>
        </tr>
      </tbody>
    </table>

    <div class="total">
      <div class="box">Amount Paid: ₹ ${
        order.pricePaid ?? item.price ?? "-"
      }</div>
    </div>

    <footer>
      <div>Buyer: ${buyer.name || buyer.email || "Buyer"}</div>
      <div>Order ID: ${order._id}</div>
      <div style="margin-top:8px">Thank you for purchasing from Restore Hub. Please keep this invoice for your records.</div>
    </footer>
  </section>
</div>
</body>
</html>`;

    const blob = new Blob([invoiceHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order._id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // Receipt modal UI (inner component)
  const ReceiptModal = ({ order, onClose }) => {
    if (!order) return null;
    const item = order.itemSnapshot || {};
    const seller = order.sellerId || {};
    const buyer = order.buyerId || order.user || {};
    const img = item.photo?.url || item.photo?.secure_url || PLACEHOLDER;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-3xl bg-white rounded-lg overflow-auto max-h-[90vh]">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-amber-800">
              Order Receipt
            </h3>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => downloadInvoice(order)}
                className="px-3 py-1 bg-amber-700 text-white rounded"
              >
                Download Invoice
              </button>
              <button onClick={onClose} className="px-3 py-1 border rounded">
                Close
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <img
                src={img}
                alt={item.name}
                onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                className="w-36 h-28 object-cover rounded"
              />
              <div>
                <h4 className="text-xl font-semibold text-amber-800">
                  {item.name || "Unnamed item"}
                </h4>
                <div className="text-sm text-amber-600 mt-1">
                  {item.description || ""}
                </div>
                <div className="text-sm text-amber-600 mt-2">Quantity: 1</div>
                <div className="text-sm text-amber-600">
                  Price: ₹{order.pricePaid ?? item.price ?? "-"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-xs text-amber-600">Order</div>
                <div className="font-medium">{order._id}</div>
                <div className="text-xs text-amber-500 mt-1">
                  Placed: {formatDateIST(order.createdAt)}
                </div>
                <div className="mt-2 text-sm">
                  Status: {order.status || "Completed"}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <div className="text-xs text-amber-600">Payment</div>
                <div className="font-medium">
                  Amount: ₹{order.pricePaid ?? item.price ?? "-"}
                </div>
                <div className="text-sm text-amber-600 mt-1">
                  Method: {order.paymentMethod || "N/A"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-amber-600">Seller</div>
                <div className="font-medium">
                  {seller?.name || safeSellerName(seller)}
                </div>
                <div className="text-sm text-amber-600">
                  {seller?.email || ""}
                </div>
                <div className="text-sm text-amber-600">
                  {seller?.phone || ""}
                </div>
              </div>

              <div>
                <div className="text-xs text-amber-600">Buyer</div>
                <div className="font-medium">
                  {buyer?.name || buyer?.email || "Buyer"}
                </div>
                <div className="text-sm text-amber-600">
                  {buyer?.email || ""}
                </div>
                <div className="text-sm text-amber-600">
                  {buyer?.phone || ""}
                </div>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-xs text-amber-600">Shipping Address</div>
                <div className="text-sm text-amber-700">
                  {order.shippingAddress}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  ReceiptModal.propTypes = {
    order: PropTypes.shape({
      _id: PropTypes.string,
      itemSnapshot: PropTypes.object,
      sellerId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      buyerId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      user: PropTypes.object,
      pricePaid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      createdAt: PropTypes.string,
      status: PropTypes.string,
      paymentMethod: PropTypes.string,
      shippingAddress: PropTypes.string,
    }),
    onClose: PropTypes.func.isRequired,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-amber-800">
              My Purchases
            </h1>
            <div className="text-sm text-amber-600">
              {totalItems} result{totalItems !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/items"
              className="px-3 py-2 bg-amber-700 text-white rounded"
            >
              Browse Items
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search item or seller..."
              className="px-3 py-2 border rounded w-full"
            />
            <input
              value={sellerFilter}
              onChange={(e) => {
                setSellerFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by seller name..."
              className="px-3 py-2 border rounded w-full"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded w-full"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded w-full"
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSearch("");
                  setSellerFilter("");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
                className="px-3 py-1 border rounded text-sm"
              >
                Reset
              </button>
              <button
                onClick={fetchOrders}
                className="px-3 py-1 bg-amber-700 text-white rounded text-sm"
              >
                Reload
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <label>Page size:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border rounded"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading / Error / Empty */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="inline-block animate-spin rounded-full w-12 h-12 border-4 border-amber-300 border-t-transparent" />
            <p className="mt-3 text-amber-600">Loading purchases...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 text-rose-700 p-4 rounded mb-6">
            <div className="flex items-center justify-between">
              <div>{error}</div>
              <div>
                <button
                  onClick={fetchOrders}
                  className="ml-3 px-3 py-1 bg-amber-700 text-white rounded"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-amber-800">
              No purchases found
            </h3>
            <p className="text-amber-600 mt-2">
              Try adjusting filters or browse items to buy.
            </p>
            <div className="mt-4">
              <Link
                to="/items"
                className="px-4 py-2 bg-amber-700 text-white rounded"
              >
                Browse Items
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              {paginated.map((o) => {
                const item = o.itemSnapshot || {};
                const img =
                  item.photo?.url || item.photo?.secure_url || PLACEHOLDER;
                return (
                  <article
                    key={o._id || Math.random()}
                    className="bg-white rounded-lg shadow p-4 flex flex-col h-full"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={img}
                        alt={item.name}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        className="w-28 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-amber-800">
                          {item.name || "Unnamed item"}
                        </h4>
                        <div className="text-sm text-amber-600 mt-1">
                          Price paid:{" "}
                          <span className="font-medium">
                            ₹{o.pricePaid ?? item.price ?? "-"}
                          </span>
                        </div>
                        <div className="text-xs text-amber-500 mt-1">
                          Bought on: {formatDateIST(o.createdAt)}
                        </div>
                        <div className="text-sm text-amber-600 mt-2">
                          Seller: {safeSellerName(o.sellerId)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-sm px-3 py-2 bg-amber-700 text-white rounded"
                      >
                        View Receipt
                      </button>
                      <Link
                        to={`/item-details/${item._id ?? o.itemId ?? ""}`}
                        className="text-sm px-3 py-2 border rounded"
                      >
                        View Item
                      </Link>
                      <div className="text-xs text-amber-500">
                        ID:{" "}
                        <span className="font-mono">
                          {String(o._id || "").slice(-8)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-amber-600">
                Showing {(page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, totalItems)} of {totalItems}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`px-3 py-1 rounded ${
                    page <= 1 ? "bg-gray-200 text-gray-500" : "bg-white border"
                  }`}
                >
                  Prev
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pnum = idx + 1;
                    if (
                      pnum === 1 ||
                      pnum === totalPages ||
                      (pnum >= page - 1 && pnum <= page + 1) ||
                      totalPages <= 7
                    ) {
                      return (
                        <button
                          key={pnum}
                          onClick={() => setPage(pnum)}
                          className={`px-3 py-1 rounded ${
                            pnum === page
                              ? "bg-amber-700 text-white"
                              : "bg-white border"
                          }`}
                        >
                          {pnum}
                        </button>
                      );
                    }
                    const nearLeft = pnum === 2 && page > 4;
                    const nearRight =
                      pnum === totalPages - 1 && page < totalPages - 3;
                    if (nearLeft || nearRight) {
                      return (
                        <span key={`dots-${pnum}`} className="px-2">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`px-3 py-1 rounded ${
                    page >= totalPages
                      ? "bg-gray-200 text-gray-500"
                      : "bg-white border"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Receipt modal */}
      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
