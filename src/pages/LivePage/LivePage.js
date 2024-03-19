import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

const LivePage = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const player = videojs(videoRef.current, {
      autoplay: true,
      controls: true,
      fluid: true,
      sources: [
        {
          src: "http://your_server/path/to/output/stream.m3u8",
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
