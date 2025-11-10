import { useContext } from "react";

import { Container } from "react-bootstrap";

import { UserContext } from "../../App";
import AllItems from "../common/AllItems";
import SellerHome from "../seller/SellerHome";

const UserPage = () => {
  const { userData, loading } = useContext(UserContext) || {};

  // Handle loading state
  if (loading) {
    return (
      <Container className="text-center py-5">
        <p>Loading...</p>
      </Container>
    );
  }

  // Handle unauthenticated user
  if (!userData) {
    return (
      <Container className="text-center py-5">
        <h5>Please log in to access this page</h5>
      </Container>
    );
  }

  // Render content based on user type
  let content;
  switch (userData.type) {
    case "seller":
      content = <SellerHome />;
      break;
    case "buyer":
      content = <AllItems />; // Or your buyer component
      break;
    default:
      content = (
        <Container className="text-center py-5">
          <h5>Unknown user type</h5>
        </Container>
      );
  }

  return <Container className="mt-4">{content}</Container>;
};

export default UserPage;
