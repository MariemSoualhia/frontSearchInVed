import React from "react";
import Navigation from "../navigation/navigation";

const Layout = ({ children }) => {
  return (
    <div>
      <Navigation />
      <div style={{ padding: "20px" }}>
        {/* Le contenu spécifique à chaque page */}
        {children}
      </div>
    </div>
  );
};

export default Layout;
