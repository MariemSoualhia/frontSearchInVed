import React, { useState, useEffect } from "react";
import axios from "axios";

const LivePage = () => {
  const [listCamera, setListCamera] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

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

  const handleCameraClick = (camera) => {
    setSelectedCamera(camera);
  };

  return (
    <div style={styles.container}>
      {/* 2/3 of the page for the live video player */}
      <div style={styles.videoContainer}>
        <h2 style={styles.title}>Live Video Player</h2>
        <div style={styles.videoPlayer}>
          {/* Display the video player for the selected camera */}
          {selectedCamera ? (
            <div style={styles.video}>
              {/* Replace the src with the actual video URL */}
              <video
                controls
                src={selectedCamera.streamUrl}
                style={styles.videoElement}
              />
            </div>
          ) : (
            <p style={styles.videoPlaceholder}>
              Select a camera to view stream
            </p>
          )}
        </div>
      </div>

      {/* 1/3 of the page for the list of selected cameras */}
      <div style={styles.cameraListContainer}>
        <h2 style={styles.title}>Selected Cameras</h2>
        <ul style={styles.cameraList}>
          {/* Map through the listCamera array and render each camera */}
          {listCamera.map((camera, index) => (
            <li
              key={index}
              onClick={() => handleCameraClick(camera)}
              style={{
                cursor: "pointer",
                color: camera.state === "online" ? "green" : "red",
              }}
            >
              {camera.cameraName} ({camera.state})
            </li>
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
  videoElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
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
