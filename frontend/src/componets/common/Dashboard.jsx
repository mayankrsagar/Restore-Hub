import { useState } from "react";

import { Container } from "react-bootstrap";

import UserItems from "../seller/UserItems";
import NavBar from "./NavBar";
import UserHome from "./UserHome";

const Dashboard = () => {
  // track which section of the dashboard is currently visible
  const [selectedSection, setSelectedSection] = useState("home");

  // render component based on selection
  const renderSection = () => {
    switch (selectedSection) {
      case "home":
        return <UserHome />;
      case "items":
        return <UserItems />;
      default:
        return (
          <div className="text-center py-5">
            <h5>⚠️ Unknown section selected</h5>
          </div>
        );
    }
  };

  return (
    <>
      {/* pass setter to navbar so it can change dashboard section */}
      <NavBar setSelectedComponent={setSelectedSection} />

      <Container className="my-4" fluid="md">
        {renderSection()}
      </Container>
    </>
  );
};

export default Dashboard;
