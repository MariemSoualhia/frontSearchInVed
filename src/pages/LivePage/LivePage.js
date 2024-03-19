import React, { useState, useEffect } from "react";
import axios from "axios";

const LivePage = () => {
  const [listCamera, setListCamera] = useState([]);

  useEffect(() => {
    axios
      .get(`http://localhost:30080/vst/api/v1/sensor/status`, {})
      .then((response) => {
        console.log("Cameras", response.data);
        setListCamera(response.data);
      })
      .catch((error) => {
        console.error("Error fetching cameras:", error);
      });
  }, []);

  return (
    <div style={styles.container}>
      {/* 2/3 of the page for the live video player */}
      <div style={styles.videoContainer}>
        <h2 style={styles.title}>Live Video Player</h2>
        <div style={styles.videoPlayer}>
          {/* Insert your live video player component here */}
          {/* Example video player */}
          <div style={styles.video}>
            {/* Replace the src with your actual video URL */}
            {/* <video controls src="VIDEO_URL_HERE" style={styles.videoElement} /> */}
            <p style={styles.videoPlaceholder}>Live Video Placeholder</p>
          </div>
        </div>
      </div>

      {/* 1/3 of the page for the list of selected cameras */}
      <div style={styles.cameraListContainer}>
        <h2 style={styles.title}>Selected Cameras</h2>
        <ul style={styles.cameraList}>
          {/* Map through the listCamera array and render each camera */}
          {listCamera.map((camera, index) => (
            <li key={index}>{camera.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100%",
  },
  videoContainer: {
    flex: 2,
    padding: "20px",
    borderRight: "1px solid #ccc",
  },
  videoPlayer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "70vh",
  },
  video: {
    width: "80%",
    height: "80%",
    border: "2px solid #ccc",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0f0f0",
    color: "#777",
    fontSize: "24px",
  },
  videoPlaceholder: {
    textAlign: "center",
  },
  cameraListContainer: {
    flex: 1,
    padding: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "16px",
    color: "#333",
  },
  cameraList: {
    listStyleType: "none",
    padding: 0,
  },
};

export default LivePage;
