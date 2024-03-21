import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import reactPlayer from "react-player";
import ReactPlayer from "react-player";
import videojs from "video.js";
import "video.js/dist/video-js.css";
const LivePage = () => {
  const [listCamera, setListCamera] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const videoRef = useRef();
  const PEER_CONNECTION_OPTIONS = {
    optional: [{ DtlsSrtpKeyAgreement: true }],
  };

  useEffect(() => {
    axios
      .get(`http://localhost:30080/vst/api/v1/sensor/list`, {})
      .then((response) => {
        console.log("Cameras", response.data);
        setListCamera(response.data);
      })
      .catch((error) => {
        console.error("Error fetching cameras:", error);
      });
  }, []);

  const handleCameraClick = (camera) => {
    const sessionDescriptionPayload = {
      clientIpAddr: "196.203.66.146",
      peerId: "fefa2548-32de-4c24-8022-08102904101e",
      options: {
        quality: "auto",
        rtptransport: "udp",
        timeout: 60,
        overlay: {
          objectId: [],
          color: "red",
          thickness: 6,
          debug: false,
          needBbox: false,
          needTripwire: false,
          needRoi: false,
        },
      },
      streamId: "7c9b1ee6-635e-4dbc-a486-d8c7a1b9b3f8",
      sessionDescription: {
        type: "offer",
        sdp: "v=0\r\no=- 4135627626450869006 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:0m0l\r\na=ice-pwd:8lO2qnARJPAcC6awRa3yEubs\r\na=ice-options:trickle\r\na=fingerprint:sha-256 7F:11:C9:90:D0:02:53:8C:5A:95:7C:28:98:F6:AB:70:C3:9E:B1:11:98:3E:77:29:E7:D2:58:BB:07:64:BF:D1\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=recvonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:63 red/48000/2\r\na=fmtp:63 111/111;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:9 G722/8000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:110 telephone-event/48000\r\na=rtpmap:126 telephone-event/8000\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 35 36 37 38 100 101 102 103 104 105 106 107 108 109 39 40 41 42 43 44 45 46 47 48 127 125 112 49\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:0m0l\r\na=ice-pwd:8lO2qnARJPAcC6awRa3yEubs\r\na=ice-options:trickle\r\na=fingerprint:sha-256 7F:11:C9:90:D0:02:53:8C:5A:95:7C:28:98:F6:AB:70:C3:9E:B1:11:98:3E:77:29:E7:D2:58:BB:07:64:BF:D1\r\na=setup:actpass\r\na=mid:1\r\na=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:13 urn:3gpp:video-orientation\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=recvonly\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 profile-id=0;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:35 VP9/90000\r\na=rtcp-fb:35 goog-remb\r\na=rtcp-fb:35 transport-cc\r\na=rtcp-fb:35 ccm fir\r\na=rtcp-fb:35 nack\r\na=rtcp-fb:35 nack pli\r\na=fmtp:35 profile-id=1;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:36 rtx/90000\r\na=fmtp:36 apt=35;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:37 VP9/90000\r\na=rtcp-fb:37 goog-remb\r\na=rtcp-fb:37 transport-cc\r\na=rtcp-fb:37 ccm fir\r\na=rtcp-fb:37 nack\r\na=rtcp-fb:37 nack pli\r\na=fmtp:37 profile-id=3;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:38 rtx/90000\r\na=fmtp:38 apt=37;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:100 H264/90000\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=fmtp:100 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:102 H264/90000\r\na=rtcp-fb:102 goog-remb\r\na=rtcp-fb:102 transport-cc\r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack\r\na=rtcp-fb:102 nack pli\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:103 rtx/90000\r\na=fmtp:103 apt=102;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:104 H264/90000\r\na=rtcp-fb:104 goog-remb\r\na=rtcp-fb:104 transport-cc\r\na=rtcp-fb:104 ccm fir\r\na=rtcp-fb:104 nack\r\na=rtcp-fb:104 nack pli\r\na=fmtp:104 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:105 rtx/90000\r\na=fmtp:105 apt=104;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:106 H264/90000\r\na=rtcp-fb:106 goog-remb\r\na=rtcp-fb:106 transport-cc\r\na=rtcp-fb:106 ccm fir\r\na=rtcp-fb:106 nack\r\na=rtcp-fb:106 nack pli\r\na=fmtp:106 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:107 rtx/90000\r\na=fmtp:107 apt=106;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:108 H264/90000\r\na=rtcp-fb:108 goog-remb\r\na=rtcp-fb:108 transport-cc\r\na=rtcp-fb:108 ccm fir\r\na=rtcp-fb:108 nack\r\na=rtcp-fb:108 nack pli\r\na=fmtp:108 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:109 rtx/90000\r\na=fmtp:109 apt=108;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:39 H264/90000\r\na=rtcp-fb:39 goog-remb\r\na=rtcp-fb:39 transport-cc\r\na=rtcp-fb:39 ccm fir\r\na=rtcp-fb:39 nack\r\na=rtcp-fb:39 nack pli\r\na=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:40 rtx/90000\r\na=fmtp:40 apt=39;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:41 H264/90000\r\na=rtcp-fb:41 goog-remb\r\na=rtcp-fb:41 transport-cc\r\na=rtcp-fb:41 ccm fir\r\na=rtcp-fb:41 nack\r\na=rtcp-fb:41 nack pli\r\na=fmtp:41 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=f4001f;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:42 rtx/90000\r\na=fmtp:42 apt=41;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:43 H264/90000\r\na=rtcp-fb:43 goog-remb\r\na=rtcp-fb:43 transport-cc\r\na=rtcp-fb:43 ccm fir\r\na=rtcp-fb:43 nack\r\na=rtcp-fb:43 nack pli\r\na=fmtp:43 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=f4001f;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:44 rtx/90000\r\na=fmtp:44 apt=43;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:45 AV1/90000\r\na=rtcp-fb:45 goog-remb\r\na=rtcp-fb:45 transport-cc\r\na=rtcp-fb:45 ccm fir\r\na=rtcp-fb:45 nack\r\na=rtcp-fb:45 nack pli\r\na=rtpmap:46 rtx/90000\r\na=fmtp:46 apt=45;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:47 AV1/90000\r\na=rtcp-fb:47 goog-remb\r\na=rtcp-fb:47 transport-cc\r\na=rtcp-fb:47 ccm fir\r\na=rtcp-fb:47 nack\r\na=rtcp-fb:47 nack pli\r\na=fmtp:47 profile=1;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:48 rtx/90000\r\na=fmtp:48 apt=47;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:127 red/90000\r\na=rtpmap:125 rtx/90000\r\na=fmtp:125 apt=127;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\na=rtpmap:112 ulpfec/90000\r\na=rtpmap:49 flexfec-03/90000\r\na=rtcp-fb:49 goog-remb\r\na=rtcp-fb:49 transport-cc\r\na=fmtp:49 repair-window=10000000;x-google-max-bitrate=10000;x-google-min-bitrate=2000;x-google-start-bitrate=4000\r\n",
      },
    };
    axios
      .get(
        `http://192.168.1.151:30080/vst/api/v1/live/iceServers?peerId=cdab36cf-8f8b-4b1f-80ae-d74b482c8097`,
        sessionDescriptionPayload
      )
      .then((response) => {
        console.log("Camera stream", response.data.iceServers[0].urls);

        createRTCPeerConnection(response.data.iceServers);
        console.log("response.data.iceServers");
      })
      .catch((error) => {
        console.error("Error fetching cameras:", error);
      });
    axios
      .post(
        `http://localhost:30080/vst/api/v1/live/stream/start`,
        sessionDescriptionPayload
      )
      .then((response) => {
        console.log("Camera Live", response);
      })
      .catch((error) => {
        console.error("Error fetching cameras:", error);
      });
    setSelectedCamera(camera);
  };

  const createRTCPeerConnection = (iceServers) => {
    console.debug("WEBRTC RECEIVER: ICE Servers: ", iceServers);
    let isSuccess = true;
    try {
      const pc = new RTCPeerConnection({ iceServers }, PEER_CONNECTION_OPTIONS);
      // pc.peerId = "7c9b1ee6-635e-4dbc-a486-d8c7a1b9b3f8";
      // pc.onicecandidate = onIceCandidate;
      // pc.ontrack = onTrack;
      // pc.oniceconnectionstatechange = onIceConnectionStateChange;
      // pc.onicecandidateerror = onIceCandidateError;
      // pc.onicegatheringstatechange = onIceGatheringStateChange;
      // pc.onsignalingstatechange = onSignalingStateChange;
      // pc.onconnectionstatechange = onConnectionStateChange;
      // peerConnection.current = pc;
      // if (page === 'outbound-stats') {
      //   window.peerConnectionOutbound = pc;
      //   window.peerConnectionOutboundId = peerId.current.toString();
      //   window.peerConnectionOutboundHost = camera.host;
      // }
    } catch (error) {
      console.error("Failed to create RTC peer connection.", error);
      // stopWebrtcConnection();
      // setErrorMessage('Failed to create RTC peer connection.');
      // resetState();
      // isSuccess = false;
    }
    // if (!isSuccess) {
    //   return;
    // }
    // createOffer();
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
              <ReactPlayer
                url="rtsp://192.168.1.151/live/7c9b1ee6-635e-4dbc-a486-d8c7a1b9b3f8"
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
              {camera.name} ({camera.state})
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
