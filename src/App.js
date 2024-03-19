import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout/Layout";
import LivePage from "./pages/LivePage/LivePage";
import Home from "./pages/home/home";

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LivePage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/search" element={<Home />} />
          {/* Ajoutez d'autres routes ici */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
