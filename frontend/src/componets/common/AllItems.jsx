import {
  useEffect,
  useState,
} from 'react';

import {
  Button,
  Card,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { CardMedia } from '@mui/material';

import api from '../../api/axiosConfig';

const AllItems = () => {
  const [items, setItems] = useState([]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterType, setFilterType] = useState("");

  const allItems = async () => {
    try {
      const res = await api.get("/user/getallitems");
      setItems(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    allItems();
  }, []);

  const changeDate = (d) => {
    const date = new Date(d).toLocaleString("en-US", { timeZone: "UTC" });
    return `${date}`;
  };

  return (
    <>
      <div className=" mt-4 filter-container text-center">
        <p className="mt-3">Filter By: </p>
        <input
          type="text"
          placeholder="enter title"
          value={filterTitle}
          onChange={(e) => setFilterTitle(e.target.value)}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option>Select Type</option>
          <option>House hold</option>
          <option>Auto Mobiles</option>
          <option>Accessories</option>
        </select>
      </div>
      <div className="all-items mt-5">
        {items && items.length > 0 ? (
          items
            .filter(
              (item) =>
                filterTitle === "" ||
                item.name.toLowerCase().includes(filterTitle.toLowerCase())
            )
            .filter(
              (item) => filterType === "" || item.type.includes(filterType)
            )
            .map((item) => (
              <Card border="warning" key={item._id} draggable="true">
                <Card.Body>
                  <CardMedia
                    component="img"
                    height="140"
                    src={item.photo?.url}
                    alt={item.photo.filename}
                  />
                  <Card.Title>
                    <b>{item.name}</b>
                  </Card.Title>
                  <Card.Text>
                    <span style={{ fontWeight: 600 }} className="my-1">
                      Price(in Rs.):
                    </span>{" "}
                    {item.price} <br />
                    <span style={{ fontWeight: 600 }} className="my-1">
                      Type:
                    </span>{" "}
                    {item.type} <br />
                    <span
                      style={{ float: "right", fontSize: 12, color: "orange" }}
                    >
                      {changeDate(item.createdAt)}
                    </span>
                  </Card.Text>

                  <Button variant="outline-warning">
                    <Link to={`/item-details/${item._id}`}>Click</Link>
                  </Button>
                </Card.Body>
              </Card>
            ))
        ) : (
          <p>No Items available at the moment</p>
        )}
      </div>
    </>
  );
};

export default AllItems;
