// File: src/components/common/AllItems.jsx
import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import api from "../../api/axiosConfig";

export default function AllItems() {
  const [items, setItems] = useState([]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    let mounted = true;
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/user/getallitems");
        if (!mounted) return;
        // adapt depending on API shape; original used res.data.data
        const list = res?.data?.data.items || [];

        setItems(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load items:", err);
        setError("Failed to load items. Try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchItems();
    return () => {
      mounted = false;
    };
  }, []);

  // Normalize & format date
  const changeDate = (d) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  // Filtered items (apply title and type filters)
  const filtered = useMemo(() => {
    const title = filterTitle.trim().toLowerCase();
    const type = filterType.trim().toLowerCase();

    return items.filter((item) => {
      const matchesTitle =
        title === "" ||
        (item?.name || "").toString().toLowerCase().includes(title);
      const matchesType =
        type === "" ||
        (item?.type || "").toString().toLowerCase().includes(type);
      return matchesTitle && matchesType;
    });
  }, [items, filterTitle, filterType]);

  // Pagination calculations
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // clamp page if pageSize/filter change
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-6 rounded-md bg-amber-50 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
          <label className="text-sm text-amber-700 font-medium">
            Filter By:
          </label>
          <input
            className="px-3 py-2 border rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-300"
            type="text"
            placeholder="Enter title"
            value={filterTitle}
            onChange={(e) => {
              setFilterTitle(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by title"
          />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            <option value="house hold">House hold</option>
            <option value="auto mobiles">Auto Mobiles</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>

        {/* Pagination controls (page size) */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-amber-700">Show</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 border rounded-md focus:outline-none"
            aria-label="Items per page"
          >
            <option value={6}>6</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={16}>16</option>
          </select>
          <span className="text-sm text-amber-600">{total} item(s)</span>
        </div>
      </div>

      {/* Loading / Error */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="h-40 bg-amber-100 rounded mb-4" />
              <div className="h-4 bg-amber-100 rounded mb-2 w-3/4" />
              <div className="h-3 bg-amber-100 rounded mb-1 w-1/2" />
              <div className="h-3 bg-amber-100 rounded mt-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 rounded">{error}</div>
      ) : paged.length === 0 ? (
        <div className="p-6 bg-white rounded shadow text-center text-amber-700">
          No items available for the selected filters.
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paged.map((item) => (
              <article
                key={item._id}
                className="border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col"
              >
                <div className="h-48 w-full bg-amber-50 flex items-center justify-center overflow-hidden">
                  {item.photo?.url ? (
                    <img
                      src={item.photo.url}
                      alt={item.photo?.filename || item.name}
                      className="object-cover w-full h-48"
                    />
                  ) : (
                    <div className="text-amber-400 text-sm">No image</div>
                  )}
                </div>

                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-semibold text-amber-800">
                    {item.name}
                  </h3>
                  <p className="text-sm text-amber-600 mt-1 flex-grow">
                    {item.description
                      ? item.description.slice(0, 120)
                      : "No description"}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-amber-700">
                        ₹ {item.price}
                      </div>
                      <div className="text-amber-600">{item.type}</div>
                    </div>
                    <div className="text-right text-xs text-amber-500">
                      <div>{changeDate(item.createdAt)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/item-details/${item._id}`}
                      className="inline-block px-3 py-2 rounded-md bg-amber-700 text-white text-sm font-medium text-center w-full"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md border ${
                  page === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-amber-50"
                }`}
                aria-label="Previous page"
              >
                Prev
              </button>

              {/* page numbers (show a window of pages) */}
              <div className="flex items-center gap-1">
                {Array.from({ length: pageCount }).map((_, i) => {
                  const pageNum = i + 1;
                  // show only 1..3..last if many pages, but keep simple for students
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        page === pageNum
                          ? "bg-amber-700 text-white"
                          : "border hover:bg-amber-50"
                      }`}
                      aria-current={page === pageNum ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className={`px-3 py-1 rounded-md border ${
                  page === pageCount
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-amber-50"
                }`}
                aria-label="Next page"
              >
                Next
              </button>
            </div>

            <div className="text-sm text-amber-600">
              Page {page} of {pageCount}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
