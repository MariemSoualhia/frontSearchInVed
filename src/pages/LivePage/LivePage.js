import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import axios from "axios"
const LivePage = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    axios.get('http://192.168.1.151:30080/vst/api/v1/sensor/7c9b1ee6-635e-4dbc-a486-d8c7a1b9b3f8/streams').then((response)=>{

      console.log("console stream",response.data)
    })
    const player = videojs(videoRef.current, {
      autoplay: true,
      controls: true,
      fluid: true,
      sources: [
        {
          src: "rtsp://192.168.1.151:30080/live/7c9b1ee6-635e-4dbc-a486-d8c7a1b9b3f8",
          type: "application/x-mpegURL",
          
        },
      ],
    });

    return () => {
      if (player) {
        player.dispose();
      }
    };
  }, []);

  return (
    <div>
      <h1>Live Camera Stream</h1>
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-default-skin" />
      </div>
    </div>
  );
};

export default LivePage;
