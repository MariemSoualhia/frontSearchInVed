/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/require-default-props */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardHeader,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  Slider,
  Stack,
  TextField,
  DialogContent,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  Switch,
  Badge,
} from '@mui/material';
import store from 'store2';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import Forward10Icon from '@mui/icons-material/Forward10';
import Replay10Icon from '@mui/icons-material/Replay10';
import { v4 as generateUUID } from 'uuid';
import chalk from 'chalk';
import Fade from '@mui/material/Fade';
import { useSelector, useDispatch } from 'react-redux';
import { forEach } from 'lodash';
import VolumeUp from '@mui/icons-material/VolumeUp';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import CloseIcon from '@mui/icons-material/Close';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import TimeRange from 'react-video-timelines-slider';
import { format, subSeconds } from 'date-fns';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import Marquee from 'react-fast-marquee';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import screenfull from 'screenfull';
import { findDOMNode } from 'react-dom';
import GroupIcon from '@mui/icons-material/Group';
import WidgetsIcon from '@mui/icons-material/Widgets';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DateRangeIcon from '@mui/icons-material/DateRange';
import moment from 'moment';
import LineWidthPicker from 'react-line-width-picker';
import ReplayIcon from '@mui/icons-material/Replay';
import { DatePicker } from 'antd';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Iconify from '../iconify';
import axiosInstance from '../../utils/axiosInstance';
import { appSliceActions } from '../../appSlices/appSlice';
import getTimelineGaps from '../../utils/getTimelineGaps';
import useResponsive from '../../hooks/useResponsive';
import './videoPlayer.css';
import CameraInfoDrawer from '../camera-info-drawer/cameraInfoDrawer';

const PEER_CONNECTION_OPTIONS = { optional: [{ DtlsSrtpKeyAgreement: true }] };
const OFFER_OPTIONS = { offerToReceiveAudio: true, offerToReceiveVideo: true };
let isStopping = false;

export const VIDEO_STATUS = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  ERROR: 'ERROR',
});

export const PLAYBACK_TYPE = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  LIVE: 'LIVE',
  RECORDED: 'RECORDED',
});

export default function VideoPlayer({
  camera,
  cameraInRow,
  page,
  onlyVideo,
  closeCamera,
  recordingTest,
  liveTest,
  useVideoCoordinates,
  videoWallList,
}) {
  const [iceConnectionState, setIceConnectionState] = useState();
  const [mediaStream, setMediaStream] = useState();
  const [peerIdStateVariable, setPeerIdStateVariable] = useState('');
  const isDesktop = useResponsive('up', 'lg');
  const [playerSate, setPlayerState] = useState(VIDEO_STATUS.UNINITIALIZED);
  const [loading, setLoading] = useState(false);
  const [cameraStreamList, setCameraStreamList] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cameraClientList, setCameraClientList] = useState([]);
  const [isAudioTrackPresent, setIsAudioTrackPresent] = useState(false);
  const [subStreamAnchorEl, setSubStreamAnchorEl] = useState(null);
  const [clientAnchorEl, setClientAnchorEl] = useState(null);
  const [qualityAnchorEl, setQualityAnchorEl] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState(false);
  const [timelines, setTimelines] = useState([]);
  const [timelineScrubberError, setTimelineScrubberError] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState([]);
  const [showOverlaySettings, setShowOverlaySettings] = useState(false);
  const selectedIntervalRef = useRef([]);
  const [timelineGaps, setTimelineGaps] = useState([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [selectedSubStreamId, setSelectedSubStreamId] = useState(camera.sensorId);
  const subStreamIdRef = useRef(camera.sensorId);
  const [quality, setQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoControlsVisible, setVideoControlsVisible] = useState(false);
  const [overlayDebug, setOverlayDebug] = useState(false);
  const [overlayBbox, setOverlayBbox] = useState(false);
  const [overlayTripwire, setOverlayTripwire] = useState(false);
  const [overlayRoi, setOverlayRoi] = useState(false);
  const [overlayFilter, setOverlayFilter] = useState([]);
  const [endTimeInMsNeeded, setEndTimeInMsNeeded] = useState(false);
  const [endTimeDateNeeded, setEndTimeDateNeeded] = useState(false);
  const [overlayColor, setOverlayColor] = useState('red');
  const [bboxThickness, setBboxThickness] = useState(6);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const peerConnection = useRef();
  const getIceCandidateCount = useRef(0);
  const videoRef = useRef();
  const peerId = useRef();
  const mediaSessionId = useRef();
  const firstTimeRender = useRef(false);
  const errorTimeoutRef = useRef();
  const earlyCandidates = useRef([]);
  const candidateSet = useRef(new Set());
  const pollRef = useRef();
  const lastSeekRef = useRef();
  const webrtcStatsRef = useRef();
  const frameErrorRef = useRef(0);
  const originalTimelines = useRef();

  const hhStartRef = useRef('');
  const mmStartRef = useRef('');
  const ssStartRef = useRef('');
  const hhEndRef = useRef('');
  const mmEndRef = useRef('');
  const ssEndRef = useRef('');
  const timelineIntervalRef = useRef('');
  const [openNvStreamerRangeDialog, setOpenNvStreamerRangeDialog] = useState(false);
  const [openMmsRangeDialog, setOpenMmsRangeDialog] = useState(false);
  const [openSyncTimeDialog, setOpenSyncTimeDialog] = useState(false);
  const [playbackType, setPlaybackType] = useState(page === 'recorded' ? 'recorded' : 'live');
  const playbackTypeRef = useRef(page === 'recorded' ? 'recorded' : 'live');
  const [metaData, setMetaData] = useState(null);
  const playNvStreamerRange = useRef(false);
  const nvStreamerRangeStartTime = useRef(null);
  const nvStreamerRangeEndTime = useRef(null);
  const [startDate, setStartDate] = useState(new Date());
  const [startTimeString, setStartTimeString] = useState(startDate);
  const [endDate, setEndDate] = useState(new Date());
  const playMmsRange = useRef(false);
  const mmsRangeStartTime = useRef(null);
  const mmsRangeEndTime = useRef(null);
  const syncTimeRef = useRef(null);
  const recordedStreamTest = useRef(null);
  const statsRef = useRef();
  const fpsTracker = useRef();
  const streamStatusRef = useRef();
  const fpsInterval = useRef();
  const recordingIntervalRef = useRef();
  const dispatch = useDispatch();
  const [recordedTestOperation, setRecordedTestOperation] = useState('...');
  const streamList = useSelector((state) => state.app.streamList);
  const publicIpAddr = useSelector((state) => state.app.publicIp);
  const { adaptorType } = window;
  const operations = useRef(['seek+10', 'seek-10', '1x', '2x', '4x', '8x', '-1x', '-2x', '-4x', '-8x']);

  useEffect(() => {
    const asyncStreamRestartCall = async () => {
      await stopWebrtcConnection();
      if (mmsRangeStartTime.current || mmsRangeEndTime.current) {
        playMmsRange.current = true;
      }
      if (nvStreamerRangeStartTime.current || nvStreamerRangeEndTime.current) {
        playNvStreamerRange.current = true;
      }
      startWebrtcConnection();
    };

    const getRecordingStatus = () => {
      axiosInstance
        .get(`${window.location.protocol}//${camera.host}/api/v1/record/${camera.sensorId}/status`)
        .then((response) => {
          if (response.data) {
            if (response.data.recordingStatus === 'alwaysOn'
              || response.data.recordingStatus === 'schedule'
              || response.data.recordingStatus === 'user') {
              setRecordingStatus(true);
            }
            else {
              setRecordingStatus(false);
            }
          }
        })
        .catch((error) => {
          console.error(error);
          setErrorMessage(error.response.data.error_message);
        });
    }

    const getRecordingStatusInInterval = () => {
      if (page === 'video-wall' || adaptorType === 'streamer') {
        return;
      }
      getRecordingStatus();
      recordingIntervalRef.current = setInterval(() => {
        getRecordingStatus();
      }, 5000);
    };

    if (!firstTimeRender.current) {
      firstTimeRender.current = true;
      getRecordingStatusInInterval();
      if (page === 'recorded') {
        fetchRecordTimelines();
      }
    } else {
      asyncStreamRestartCall();
    }

  }, [quality]);

  useEffect(() => {
    forEach(streamList, (obj) => {
      if (obj.host === camera.host && Object.prototype.hasOwnProperty.call(obj, camera.sensorId)) {
        setCameraStreamList(obj[camera.sensorId]);
      }
    });
  }, [streamList, camera]);

  useEffect(() => {
    console.log('iceConnectionState', iceConnectionState);
    switch (iceConnectionState) {
      case 'connecting':
        clearTimeout(errorTimeoutRef.current);
        setLoading(true);
        break;
      case 'connected':
        monitorFps();
        clearTimeout(errorTimeoutRef.current);
        clearTimeout(pollRef.current);
        setLoading(false);
        webrtcStatsHelper();
        if (recordingTest) {
          startRecordedStreamTest();
        }
        break;
      case 'disconnected':
        setLoading(false);
        timeoutAndWaitForReconnection();
        break;
      case 'failed':
        setLoading(false);
        stopWebrtcConnection();
        break;
      default:
        console.log(iceConnectionState);
    }
  }, [iceConnectionState]);

  useEffect(() => {
    if (recordingTest) {
      playMmsRange.current = true;
    }
    if (page !== 'recorded') {
      startWebrtcConnection();
    }
    return () => {
      clearInterval(recordingIntervalRef.current);
      clearInterval(fpsInterval.current);
      stopWebrtcConnection();
      clearInterval(timelineIntervalRef.current);
      clearInterval(pollRef.current);
      clearInterval(recordedStreamTest.current);
      clearInterval(statsRef.current);
      clearInterval(streamStatusRef.current);
      getIceCandidateCount.current = 0;
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = null;
          videoRef.current.remove();
        } catch (error) {
          console.error(error);
        }
      }
    };
  }, []);

  const monitorFps = () => {
    let fpsSum = 0;
    let fpsCount = 0;
    const incrementFps = (fps) => {
      fpsSum += fps;
      // eslint-disable-next-line no-plusplus
      fpsCount++;
    };
    fpsInterval.current = setInterval(() => {
      if (!peerConnection.current || !peerConnection.current.getStats) {
        incrementFps(0);
        return;
      }
      peerConnection.current
        .getStats(null)
        .then((stats) => {
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              if (Object.prototype.hasOwnProperty.call(report, 'framesPerSecond')) {
                const fps = report.framesPerSecond;
                console.log(`${camera.name} fps: `, fps);
                incrementFps(fps);
              } else {
                incrementFps(0);
              }
            }
          });
        })
        .catch((error) => {
          console.error('Error getting stats:', error);
        });
    }, 1000);
    setTimeout(() => {
      clearInterval(fpsInterval.current);
      const averageFps = fpsCount > 0 ? fpsSum / fpsCount : 0;
      console.log(camera.name, 'Average fps: ', averageFps);
      if (averageFps >= 20 && averageFps <= 35) {
        console.debug(`${camera.name} average fps`, averageFps);
      }
    }, 60000);
  };
  useEffect(() => {
    if (useVideoCoordinates) {
      const video = videoRef.current;

      if (!video) {
        return;
      }

      // add event listener for mousemove
      // video.addEventListener('mousemove', (e) => {
      //   const rect = video.getBoundingClientRect();
      //   const x = e.clientX - rect.left;
      //   const y = e.clientY - rect.top;
      //   console.log(`Mouse coordinates on hover: (${x}, ${y})`);
      // });

      // add event listener for click
      video.addEventListener('click', (e) => {
        const rect = video.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log(`Mouse coordinates on click: (${x}, ${y})`);
      });

      // cleanup function to remove event listeners
      // eslint-disable-next-line consistent-return
      return () => {
        // video.removeEventListener('mousemove');
        video.removeEventListener('click', () => { });
      };
    }
  }, []);

  const timeoutAndWaitForReconnection = () => {
    errorTimeoutRef.current = setTimeout(() => {
      stopWebrtcConnection();
    }, 5000);
  };

  const resetState = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    clearInterval(statsRef.current);
    clearInterval(recordedStreamTest.current);
    peerId.current = null;
    setIceConnectionState(null);
    setMediaStream(null);
    earlyCandidates.current = [];
    candidateSet.current.clear();
    setPlayerState(VIDEO_STATUS.UNINITIALIZED);
    setLoading(false);
    playNvStreamerRange.current = false;
    playMmsRange.current = false;
  };

  const handleClickFullscreen = () => {
    // eslint-disable-next-line react/no-find-dom-node
    screenfull.request(findDOMNode(videoRef.current));
  };

  const onCloseDrawer = () => {
    setOpenDrawer(false);
  };

  const rewriteSdp = (sdp) => {
    const sdpStringFind = 'a=fmtp:(.*) (.*)';
    let sdpStringReplace = null;
    sdpStringReplace = `a=fmtp:$1 $2;x-google-max-bitrate=${window.maxBitrate};x-google-min-bitrate=${window.minBitrate};x-google-start-bitrate=${window.startBitrate}`;
    let newSDP = sdp.sdp.toString();
    newSDP = newSDP.replace(new RegExp(sdpStringFind, 'g'), sdpStringReplace);
    sdp.sdp = newSDP;
    console.debug('using modified sdp: ', sdp);
    return sdp;
  };

  const checkForData = () => {
    fpsTracker.current = 0;
    statsRef.current = setInterval(() => {
      console.log('Checking for stats..... !!!');
      if (liveTest && fpsTracker.current >= 3) {
        console.log('Stopping test, fps is zero/not found', camera.name);
        clearInterval(statsRef.current);
        stopWebrtcConnection();
        dispatch(
          appSliceActions.setRecordedTestFailed({
            status: true,
            reason: `Video data is not received for live stream for more than 15 seconds, peer ID: ${peerId.current ? peerId.current : 'peer ID not available'
              }`,
          }),
        );
      }
      if (recordingTest && fpsTracker.current >= 11) {
        console.log('Stopping test, fps is zero/not found', camera.name);
        clearInterval(statsRef.current);
        stopWebrtcConnection();
        dispatch(
          appSliceActions.setRecordedTestFailed({
            status: true,
            reason: `Video data is not received for recorded stream for more than 55 seconds, peer ID: ${peerId.current ? peerId.current : 'peer ID not available'
              }`,
          }),
        );
      }
      try {
        if (!peerConnection.current) {
          console.log('peer connection not established yet');
          return;
        }
        peerConnection.current.getStats(null).then((stats) => {
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              if (Object.prototype.hasOwnProperty.call(report, 'framesPerSecond')) {
                if (report.framesPerSecond > 0) {
                  console.log(camera.name, ' FPS is: ', report.framesPerSecond);
                  fpsTracker.current = 0;
                } else {
                  console.log(camera.name, ' FPS is zero: ', fpsTracker.current);
                  fpsTracker.current += 1;
                }
              } else {
                console.log(camera.name, ' FPS is not present: ', fpsTracker.current);
                fpsTracker.current += 1;
              }
            }
          });
        });
      } catch (error) {
        console.error('Webrtc stats error', error);
      }
    }, 5000);
  };

  const startRecordedStreamTest = () => {
    recordedStreamTest.current = setInterval(async () => {
      let randomOperation;
      if (operations.current.length > 2) {
        const index = Math.floor(Math.random() * operations.current.length);
        randomOperation = operations.current[index];
        operations.current.splice(index, 1);
      } else {
        randomOperation = operations.current[Math.floor(Math.random() * operations.current.length)];
      }
      console.log('available operations: ', operations.current);
      console.log('current operation: ', randomOperation);
      console.log('playbackType: ', playbackTypeRef.current);
      switch (randomOperation) {
        case 'seek+10':
          setRecordedTestOperation('seek+10');
          recordStreamTestFunctions.seekPlusTen();
          break;
        case 'seek-10':
          setRecordedTestOperation('seek-10');
          recordStreamTestFunctions.seekMinusTen();
          break;
        case '1x':
          setRecordedTestOperation('1x');
          recordStreamTestFunctions.fastforwardByNum(1);
          break;
        case '2x':
          setRecordedTestOperation('2x');
          recordStreamTestFunctions.fastforwardByNum(2);
          break;
        case '4x':
          setRecordedTestOperation('4x');
          recordStreamTestFunctions.fastforwardByNum(4);
          break;
        case '8x':
          setRecordedTestOperation('8x');
          recordStreamTestFunctions.fastforwardByNum(8);
          break;
        case '-1x':
          setRecordedTestOperation('-1x');
          recordStreamTestFunctions.rewindByNum(-1);
          break;
        case '-2x':
          setRecordedTestOperation('-2x');
          recordStreamTestFunctions.rewindByNum(-2);
          break;
        case '-4x':
          setRecordedTestOperation('-4x');
          recordStreamTestFunctions.rewindByNum(-4);
          break;
        case '-8x':
          setRecordedTestOperation('-8x');
          recordStreamTestFunctions.rewindByNum(-8);
          break;
        default:
          break;
      }
    }, 10000);
  };

  const handleStreamSwitch = async () => {
    if (playbackType === 'recorded') {
      const jsonData = {
        peerId: peerConnection.current.peerId.toString(),
        streamId: selectedSubStreamId,
      };
      await axiosInstance
        .post(`${window.location.protocol}//${camera.host}/api/v1/live/stream/swap`, jsonData)
        .then((response) => {
          console.log('stream switch, recorded to live ?', response.data);
          setPlaybackType('live');
        })
        .catch((e) => {
          console.error('Stream switch error, recorded to live', e);
          setErrorMessage('Switch stream from recorded to live failed');
        });
    } else {
      const jsonData = {
        peerId: peerConnection.current.peerId.toString(),
        streamId: selectedSubStreamId,
        startTime: '1970-12-07T07:18:39.786Z',
      };
      await axiosInstance
        .post(`${window.location.protocol}//${camera.host}/api/v1/replay/stream/swap`, jsonData)
        .then((response) => {
          console.log('stream switch, live to recorded ?', response.data);
          setPlaybackType('recorded');
        })
        .catch((e) => {
          console.error('Stream switch error, live to recorded', e);
          setErrorMessage('Switch stream from live to recorded failed');
        });
    }
  };

  const handleRecordedTimeSync = async (marginTime) => {
    if (playbackType === 'live') {
      await handleStreamSwitch();
    }
    setOpenSyncTimeDialog(false);
    const jsonData = {
      peerId: peerConnection.current.peerId.toString(),
      mediaSessionId: mediaSessionId.current,
      action: 'seekForward',
      value: subSeconds(new Date(), Number(marginTime)).toISOString(),
    };
    const localTimeString = new Date(`${jsonData.seek_value}.000Z`).toLocaleString();
    console.debug('Seeking to(UTC): ', jsonData.seek_value);
    console.debug('Seeking to(local): ', localTimeString);
    setStartTimeString(localTimeString);
    const promise = axiosInstance(`${window.location.protocol}//${camera.host}/api/v1/replay/stream/seek`, {
      method: 'post',
      data: jsonData,
    });
    promise.then((response) => {
      console.log('stream seek ?', response.data);
      setPlayerState(VIDEO_STATUS.PLAYING);
    });
    promise.catch((e) => {
      console.error('Stream seek error', e);
    });
  };

  const webrtcStatsHelper = () => {
    webrtcStatsRef.current = setInterval(() => {
      try {
        if (!peerConnection.current || !mediaStream) {
          console.log('Stop collecting stats');
          clearInterval(webrtcStatsRef.current);
          return;
        }
        peerConnection.current.getStats(null).then((stats) => {
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              if (Object.prototype.hasOwnProperty.call(report, 'framesPerSecond')) {
                if (report.framesPerSecond > 0) {
                  clearInterval(webrtcStatsRef.current);
                  frameErrorRef.current = 0;
                  console.info('Webrtc client is receiving frames');
                } else if (frameErrorRef.current > 3) { setErrorMessage('Peer connection is successful but VST UI is not receiving frames'); } else {
                  frameErrorRef.current += 1;
                }
              } else {
                console.log('no framesPerSecond field found');
                if (frameErrorRef.current > 3) { setErrorMessage('Peer connection is successful but VST UI is not receiving frames'); } else {
                  frameErrorRef.current += 1;
                }
              }
            }
          });
        });
      } catch (error) {
        console.error('Webrtc stats error', error);
      }
    }, 5000);
  };

  const fetchRecordTimelines = (flag = true) => {
    axiosInstance
      .get(`${window.location.protocol}//${camera.host}/api/v1/record/${camera.sensorId}/timelines`)
      .then((response) => {
        if (response.data) {
          originalTimelines.current = response.data;
          setTimelines(response.data);
          setTimelineGaps(getTimelineGaps(response.data));
          if (recordingTest && response.data != null && response.data.length > 0) {
            const randomObj = response.data[Math.floor(Math.random() * response.data.length)];
            const t1 = new Date(randomObj.startTime).getTime();
            const t2 = new Date(randomObj.endTime).getTime();
            const randomTs = Math.floor(Math.random() * (t2 - t1 + 1) + t1);
            console.log(t1, t2, randomTs);
            mmsRangeStartTime.current = new Date(randomTs).toISOString();
            console.log(randomObj);
            console.log('using random start time', mmsRangeStartTime.current);
          }
          if (flag) {
            setSelectedInterval([new Date(response.data[0].startTime)]);
          }
          if (page === 'recorded') {
            selectedIntervalRef.current = [new Date(response.data[0].startTime)];
            if (flag) startWebrtcConnection();
          }
        }
      })
      .catch((error) => {
        console.error('unable to fetch timelines', error);
        if (flag) stopWebrtcConnection();
        setErrorMessage(error.response.data.error_message);
      });
  };

  const getCameraClientList = () => {
    axiosInstance
      .get(`${window.location.protocol}//${camera.host}/api/stream/status`)
      .then((response) => {
        if (response.data) {
          const parsedData = [];
          forEach(response.data, (obj) => {
            if (obj.deviceId === camera.sensorId) {
              parsedData.push(obj);
            }
          });
          setCameraClientList(parsedData);
        }
      })
      .catch((e) => {
        console.error('WEBRTC RECEIVER: getIceCandidate error', e);
      });
  };

  const addIceCandidate = (candidate) => {
    const jsonData = {
      peerId: peerConnection.current.peerId.toString(),
      candidate,
    };
    const iceCandidateEndpoint = page === 'recorded' || recordingTest
      ? `${window.location.protocol}//${camera.host}/api/v1/replay/iceCandidate`
      : `${window.location.protocol}//${camera.host}/api/v1/live/iceCandidate`;
    const promise = axiosInstance(iceCandidateEndpoint, {
      method: 'post',
      data: jsonData,
    });
    promise.then((response) => {
      console.log(chalk.cyan('Added ICE candidate ?'), response.data);
    });
    promise.catch((e) => {
      console.error(chalk.bgCyan('Add ICE candidate error'), e);
    });
  };

  const onReceiveCandidate = (response) => {
    const candidates = response.data;
    console.debug(`Received candidates from VMS: ${JSON.stringify(candidates)}`);
    if (candidates) {
      console.debug('WEBRTC RECEIVER: Creating RTCIceCandidate from each received candidate..');
      for (let i = 0; i < candidates.length; i += 1) {
        if (!candidateSet.current.has(JSON.stringify(candidates[i]))) {
          candidateSet.current.add(JSON.stringify(candidates[i]));
          const candidate = new RTCIceCandidate(candidates[i]);
          console.debug(`Adding ICE candidate - ${i} :${JSON.stringify(candidate)}`);
          peerConnection.current.addIceCandidate(
            candidate,
            () => {
              console.debug(`addIceCandidate OK - ${i}`);
            },
            (error) => {
              console.debug(`addIceCandidate error - ${i}`, error);
            },
          );
        }
      }
    }
  };

  const getIceCandidate = () => {
    console.debug('WEBRTC RECEIVER: calling api/getIceCandidate');
    const iceCandidateEndpoint = page === 'recorded' || recordingTest
      ? `${window.location.protocol}//${camera.host}/api/v1/replay/iceCandidate?peerId=${peerConnection.current.peerId}`
      : `${window.location.protocol}//${camera.host}/api/v1/live/iceCandidate?peerId=${peerConnection.current.peerId}`;
    axiosInstance
      .get(iceCandidateEndpoint)
      .then(onReceiveCandidate)
      .catch((e) => {
        console.error('WEBRTC RECEIVER: getIceCandidate error', e);
      });
  };

  const setRemoteDescription = (sessionDescriptionAnswer) => {
    peerConnection.current
      .setRemoteDescription(new RTCSessionDescription(sessionDescriptionAnswer))
      .then(() => {
        earlyCandidates.current.forEach(addIceCandidate);
        console.log(`Called getIceCandidate ${getIceCandidateCount.current + 1} times`);
        getIceCandidate();
        getIceCandidateCount.current = 0;
        clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
          getIceCandidateCount.current += 1;
          console.log(`Called getIceCandidate ${getIceCandidateCount.current + 1} times`);
          if (getIceCandidateCount.current >= 4) {
            console.log('Stop calling getIceCandidate');
            getIceCandidateCount.current = 0;
            clearInterval(pollRef.current);
          }
          getIceCandidate();
        }, 500);
      })
      .catch((error) => {
        console.error('WEBRTC RECEIVER: onReceiveCall: ', error);
        stopWebrtcConnection();
        setErrorMessage('Unable to set remote description');
      });
  };

  const sendSessionDescriptionToVst = (sessionDescription) => {
    const sessionDescriptionPayload = {
      clientIpAddr: publicIpAddr,
      peerId: peerConnection.current.peerId.toString(),
      options: {
        quality,
        rtptransport: 'udp',
        timeout: 60,
      },
      streamId: subStreamIdRef.current,
      sessionDescription,
    };
    if (page === 'video-wall') {
      delete sessionDescriptionPayload.streamId;
      sessionDescriptionPayload.options.composite = { doComposite: true, streamIds: videoWallList };
    }
    if (adaptorType === 'streamer' && playNvStreamerRange.current) {
      sessionDescriptionPayload.startTime = nvStreamerRangeStartTime.current;
      sessionDescriptionPayload.endTime = nvStreamerRangeEndTime.current;
      playNvStreamerRange.current = false;
    }
    if (adaptorType === 'vst' && selectedIntervalRef.current.length > 0 && !playMmsRange.current) {
      sessionDescriptionPayload.startTime = '1970-12-07T07:18:39.786Z';
    }
    if ((adaptorType === 'mms' || adaptorType === 'vst') && playMmsRange.current) {
      sessionDescriptionPayload.startTime = mmsRangeStartTime.current;
      if (endTimeInMsNeeded || endTimeDateNeeded) {
        sessionDescriptionPayload.endTime = mmsRangeEndTime.current;
      }
      playMmsRange.current = false;
    }
    const overlaySettings = {
      objectId: overlayFilter,
      color: overlayColor,
      thickness: bboxThickness,
      debug: overlayDebug,
      needBbox: overlayBbox,
      needTripwire: overlayTripwire,
      needRoi: overlayRoi
    };
    sessionDescriptionPayload.options.overlay = overlaySettings;
    if (liveTest) {
      const arr = ['auto', 'high', 'medium', 'low', 'pass_through'];
      const randomQuality = arr[Math.floor(Math.random() * arr.length)];
      sessionDescriptionPayload.options.quality = randomQuality;
      console.log('using random quality', randomQuality);
    }
    if (recordingTest) {
      const arr = ['auto', 'high', 'medium', 'low'];
      const randomQuality = arr[Math.floor(Math.random() * arr.length)];
      sessionDescriptionPayload.options.quality = randomQuality;
      console.log('using random quality', randomQuality);
    }
    console.debug('WEBRTC RECEIVER: Payload of stream start: ', sessionDescriptionPayload);
    const playbackStartEndpoint = page === 'recorded' || recordingTest
      ? `${window.location.protocol}//${camera.host}/api/v1/replay/stream/start`
      : `${window.location.protocol}//${camera.host}/api/v1/live/stream/start`;
    const promise = axiosInstance(playbackStartEndpoint, {
      method: 'post',
      data: sessionDescriptionPayload,
    });
    promise.then((response) => {
      const sessionDescriptionAnswer = response.data;
      console.debug('Received response of stream start: ', sessionDescriptionAnswer);
      console.debug('WEBRTC RECEIVER: Signaling state is ', peerConnection.current.signalingState);
      if (peerConnection.current.signalingState === 'have-local-offer') {
        console.debug('WEBRTC RECEIVER: OK signalingState');
      } else {
        console.debug('WEBRTC RECEIVER: unexpected signalingState');
      }
      setRemoteDescription(sessionDescriptionAnswer);
      mediaSessionId.current = sessionDescriptionAnswer.mediaSessionId;
    });
    promise.catch((error) => {
      console.error('WEBRTC RECEIVER: wertc error: ', error);
      if (liveTest || recordingTest) {
        dispatch(
          appSliceActions.setRecordedTestFailed({
            status: true,
            reason: `api/stream/start failed for ${liveTest ? 'live stream' : 'recorded stream'}, peer ID: ${peerId.current ? peerId.current : 'peer ID not available'
              }`,
          }),
        );
      }
      stopWebrtcConnection();
      setErrorMessage(error.response.data.error_message);
    });
  };

  const createOffer = () => {
    peerConnection.current
      .createOffer(OFFER_OPTIONS)
      .then((sessionDescription) => {
        sessionDescription = rewriteSdp(sessionDescription);
        console.debug('WEBRTC RECEIVER: session Description', sessionDescription);
        peerConnection.current.setLocalDescription(sessionDescription);
        return sessionDescription;
      })
      .then((sessionDescription) => {
        sendSessionDescriptionToVst(sessionDescription);
      })
      .catch((error) => {
        console.error('WEBRTC RECEIVER: Failed to create offer', error);
        stopWebrtcConnection();
        setErrorMessage(error);
      });
  };

  const onConnectionStateChange = () => {
    // FireFox does not support onConnectionStateChange event
    console.info('WEBRTC RECEIVER: connection state change: ', peerConnection.current.connectionState);
    if (peerConnection.current.connectionState === 'disconnected') {
      console.debug('WEBRTC RECEIVER: Lost peer connection...');
    }
  };

  const onSignalingStateChange = () => {
    console.info('WEBRTC RECEIVER: signaling state change: ', peerConnection.current.signalingState);
  };

  const onIceGatheringStateChange = () => {
    console.info('WEBRTC RECEIVER: gathering state change: ', peerConnection.current.iceGatheringState);
  };

  const onIceCandidateError = (e) => {
    console.debug('WEBRTC RECEIVER: onIceCandidateError: ', e);
    if (e.errorCode !== 701) {
      console.error(`ICE candidate error, ${e.errorText} error code ${e.errorCode} and url ${e.url}`);
    }
    if (e.errorCode === 701) {
      console.debug('error code is 701 that means DNS failed for ipv6, harmless error');
    }
  };

  const onIceConnectionStateChange = () => {
    setIceConnectionState(peerConnection.current.iceConnectionState);
  };

  const onTrack = (event) => {
    const [stream] = event.streams;
    console.log('onTrack callback');
    setIsAudioTrackPresent(stream.getAudioTracks().length > 0);
    videoRef.current.srcObject = stream;
    videoRef.current.play();
    setMediaStream(true);
  };

  const onIceCandidate = (event) => {
    if (!event.candidate) {
      console.debug('received null candidate, that means its the last candidate');
      return;
    }
    if (event.candidate) {
      if (event.candidate.candidate.length === 0) {
        console.log(event.candidate);
        console.debug('Recevived empty string for candidate - client is firefox');
        return;
      }
      console.debug('received candidate inside onIceCandidate callback: ', event.candidate.candidate);
      // If a srflx candidate was found, notify that the STUN server works!
      if (event.candidate.type === 'srflx') {
        console.debug('WEBRTC RECEIVER: The STUN server is reachable for this candidate!');
        console.debug(`Public IP Address is: ${event.candidate.address}`);
      }
      // If a relay candidate was found, notify that the TURN server works!
      if (event.candidate.type === 'relay') {
        console.debug('WEBRTC RECEIVER: The TURN server is reachable for this candidate!');
      }
      if (peerConnection.current && peerConnection.current.currentRemoteDescription) {
        addIceCandidate(event.candidate);
      } else {
        earlyCandidates.current.push(event.candidate);
      }
    }
  };

  const createRTCPeerConnection = (iceServers) => {
    console.debug('WEBRTC RECEIVER: ICE Servers: ', iceServers);
    let isSuccess = true;
    try {
      const pc = new RTCPeerConnection({ iceServers }, PEER_CONNECTION_OPTIONS);
      pc.peerId = peerId.current;
      pc.onicecandidate = onIceCandidate;
      pc.ontrack = onTrack;
      pc.oniceconnectionstatechange = onIceConnectionStateChange;
      pc.onicecandidateerror = onIceCandidateError;
      pc.onicegatheringstatechange = onIceGatheringStateChange;
      pc.onsignalingstatechange = onSignalingStateChange;
      pc.onconnectionstatechange = onConnectionStateChange;
      peerConnection.current = pc;
      if (page === 'outbound-stats') {
        window.peerConnectionOutbound = pc;
        window.peerConnectionOutboundId = peerId.current.toString();
        window.peerConnectionOutboundHost = camera.host;
      }
    } catch (error) {
      console.error('Failed to create RTC peer connection.', error);
      stopWebrtcConnection();
      setErrorMessage('Failed to create RTC peer connection.');
      resetState();
      isSuccess = false;
    }
    if (!isSuccess) {
      return;
    }
    createOffer();
  };

  const setStreamBitrate = async () => {
    await axiosInstance
      .get(`${window.location.protocol}//${camera.host}/api/vst/settings`)
      .then((response) => {
        if (response.data) {
          try {
            window.minBitrate = response.data.webrtc_min_birate || 2000;
            window.maxBitrate = response.data.webrtc_max_birate || 10000;
            window.startBitrate = response.data.webrtc_start_birate || 4000;
          } catch (error) {
            console.log(error);
          }
          console.log('using bitrates', window.minBitrate, window.maxBitrate, window.startBitrate);
        }
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(error.response.data.error_message);
      });
  };

  const startWebrtcConnection = async () => {
    clearInterval(streamStatusRef.current);
    streamStatusRef.current = setInterval(() => {
      getStreamStatus();
    }, 5000);
    if (page === 'recorded' && selectedIntervalRef.current.length === 0 && adaptorType === 'vst') {
      setErrorMessage('No record timelines present, retry after some time');
      return;
    }
    if (recordingTest || liveTest) {
      clearInterval(statsRef.current);
      checkForData();
    }
    setLoading(true);
    setPlayerState(VIDEO_STATUS.PLAYING);
    peerId.current = generateUUID();
    setPeerIdStateVariable(peerId.current);
    await setStreamBitrate();
    const iceServerEndpoint = page === 'recorded' || recordingTest
      ? `${window.location.protocol}//${camera.host}/api/v1/replay/iceServers?peerId=${peerId.current}`
      : `${window.location.protocol}//${camera.host}/api/v1/live/iceServers?peerId=${peerId.current}`;
    axiosInstance
      .get(iceServerEndpoint)
      .then((response) => {
        console.log(response.data);
        createRTCPeerConnection(response.data.iceServers);
      })
      .catch((error) => {
        console.error(error);
        stopWebrtcConnection();
        setErrorMessage(error.response.data.error_message);
      });
  };

  const stopWebrtcConnection = async () => {
    if (peerConnection.current != null) {
      const jsonData = {
        peerId: peerConnection.current.peerId.toString(),
        mediaSessionId: mediaSessionId.current,
      };
      const stopStreamEndpoint = page === 'recorded' || recordingTest
        ? `${window.location.protocol}//${camera.host}/api/v1/replay/stream/stop`
        : `${window.location.protocol}//${camera.host}/api/v1/live/stream/stop`;
      console.debug('WEBRTC RECEIVER: calling api/stream/stop with ', jsonData);
      await axiosInstance
        .post(stopStreamEndpoint, jsonData)
        .then((response) => {
          console.log('stream stop ?', response.data);
        })
        .catch((e) => {
          console.error('WEBRTC RECEIVER: stream stop error', e);
          if (liveTest || recordingTest) {
            dispatch(
              appSliceActions.setRecordedTestFailed({
                status: true,
                reason: `api/stream/stop failed for ${liveTest ? 'live stream' : 'recorded stream'}, peer ID: ${peerId.current ? peerId.current : 'peer ID not available'
                  }`,
              }),
            );
          }
        });
      resetState();
    }
    clearInterval(streamStatusRef.current);
  };

  const handlePlayPause = () => {
    if (!mediaStream && !loading) {
      startWebrtcConnection();
    }
    if (!peerConnection.current) {
      return;
    }
    const jsonData = {
      peerId: peerConnection.current.peerId.toString(),
      mediaSessionId: mediaSessionId.current,
    };
    const pauseEndpoint = page === 'recorded' || recordingTest
      ? `${window.location.protocol}//${camera.host}/api/v1/replay/stream/pause`
      : `${window.location.protocol}//${camera.host}/api/v1/live/stream/pause`;
    const resumeEndpoint = page === 'recorded' || recordingTest
      ? `${window.location.protocol}//${camera.host}/api/v1/replay/stream/resume`
      : `${window.location.protocol}//${camera.host}/api/v1/live/stream/resume`;
    if (playerSate === VIDEO_STATUS.PAUSED) {
      axiosInstance
        .post(resumeEndpoint, jsonData)
        .then((response) => {
          console.log('stream resume ?', response.data);
          setPlayerState(VIDEO_STATUS.PLAYING);
        })
        .catch((e) => {
          console.error('stream resume error', e);
        });
    } else {
      axiosInstance
        .post(pauseEndpoint, jsonData)
        .then((response) => {
          console.log('stream pause ?', response.data);
          setPlayerState(VIDEO_STATUS.PAUSED);
        })
        .catch((e) => {
          console.error('Stream pause error', e);
        });
    }
  };

  const handleSubStreamMenuClose = () => {
    setSubStreamAnchorEl(null);
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const handleSwitchStreamFailed = async () => {
    await stopWebrtcConnection(); // if any
    startWebrtcConnection();
  };

  const handleSubStream = (stream) => {
    if (playerSate === VIDEO_STATUS.PLAYING || playerSate === VIDEO_STATUS.PAUSED) {
      const jsonData = {
        peerid: peerConnection.current.peerId.toString(),
        streamId: stream.streamId,
        mediaSessionId: mediaSessionId.current,
      };
      const promise = axiosInstance(`${window.location.protocol}//${camera.host}/api/v1/live/stream/swap`, {
        method: 'post',
        data: jsonData,
      });
      promise.then((response) => {
        console.log('stream switch ?', response.data);
        subStreamIdRef.current = stream.streamId;
        setSelectedSubStreamId(stream.streamId);
      });
      promise.catch((e) => {
        console.error('Stream switch error', e);
        if (e.response.data.error_code === 'VMSNotSupportedError') {
          subStreamIdRef.current = stream.streamId;
          setSelectedSubStreamId(stream.streamId);
          console.log('Switch stream failed, trying to re-start stream...');
          handleSwitchStreamFailed();
        }
      });
    }
  };

  useEffect(() => {
    console.log('PLAYBACK TYPE:', playbackType);
  }, [playbackType]);

  const handleQualityChange = async (quality) => {
    setQuality(quality);
  };

  const handleSubStreamMenuOpen = (e) => {
    setSubStreamAnchorEl(e.currentTarget);
  };

  const handleClientMenuOpen = (e) => {
    getCameraClientList();
    setClientAnchorEl(e.currentTarget);
  };

  const handleClientMenuClose = () => {
    setClientAnchorEl(null);
  };

  const handleQualityMenuOpen = (e) => {
    setQualityAnchorEl(e.currentTarget);
  };

  const handleQualityMenuClose = () => {
    setQualityAnchorEl(null);
  };

  const handleVolumeChange = (event, newValue) => {
    setVolumeLevel(newValue);
    if (videoRef.current) {
      if (newValue > 0) {
        document.getElementById(`video-${camera.sensorId}`).muted = false;
      } else if (newValue < 0.01) {
        document.getElementById(`video-${camera.sensorId}`).muted = true;
      }
      document.getElementById(`video-${camera.sensorId}`).volume = newValue;
    }
  };

  const handleOverlayDebug = () => {
    setOverlayDebug(!overlayDebug);
  };

  const handleOverlayBbox = () => {
    setOverlayBbox(!overlayBbox);
  };

  const handleOverlayTripwire = () => {
    setOverlayTripwire(!overlayTripwire);
  };

  const handleOverlayRoi = () => {
    setOverlayRoi(!overlayRoi);
  };

  const onOverlayFilterChange = (e) => {
    const str = e.target.value;
    if (str.length < 1) {
      setOverlayFilter([]);
    } else {
      const values = str.split(',');
      setOverlayFilter(values);
    }
  };

  const timelineScrubberErrorHandler = ({ error }) => {
    if (error) {
      console.log('Selected timeline with gap !');
    }
    setTimelineScrubberError(error);
  };

  const onChangeCallback = (selectedInterval) => {
    console.log('selectedInterval', selectedInterval);
    setSelectedInterval(selectedInterval);
    if (
      selectedInterval.length > 0
      && (playerSate === VIDEO_STATUS.PLAYING || playerSate === VIDEO_STATUS.PAUSED)
      && iceConnectionState === 'connected'
    ) {
      if (lastSeekRef.current == null) {
        lastSeekRef.current = [new Date().getTime(), selectedInterval[0]];
      } else {
        const lastSeekCallTime = lastSeekRef.current[0];
        const lastSeekTime = lastSeekRef.current[1];
        const currentTime = new Date().getTime();
        lastSeekRef.current = [currentTime, selectedInterval[0]];
        if (selectedInterval[0].getTime() === lastSeekTime.getTime()
          && currentTime - lastSeekCallTime < 500) {
          console.log('Duplicate seek ! Not seeking.. !!');
          return;
        }
      }
      seekToCustomTime(selectedInterval);
    }
  };

  const seekToCustomTime = async (selectedInterval) => {
    if (playbackType === 'live') {
      await handleStreamSwitch();
    }
    const jsonData = {
      peerId: peerConnection.current.peerId.toString(),
      mediaSessionId: mediaSessionId.current,
      action: 'seekForward',
      value: new Date(selectedInterval[0]).toISOString(),
    };
    setStartTimeString(new Date(`${jsonData.seek_value}.000Z`).toLocaleString());
    const promise = axiosInstance(`${window.location.protocol}//${camera.host}/api/v1/replay/stream/seek`, {
      method: 'post',
      data: jsonData,
    });
    promise.then((response) => {
      console.log('stream seek ?', response.data);
      setPlayerState(VIDEO_STATUS.PLAYING);
    });
    promise.catch((e) => {
      console.error('Stream seek error', e);
    });
  };

  const handleSeek = async (type = 'forward') => {
    if (playbackType === 'live') {
      await handleStreamSwitch();
    }
    const jsonData = {
      peerId: peerConnection.current.peerId.toString(),
      mediaSessionId: mediaSessionId.current,
    };

    if (type === 'forward') {
      jsonData.action = 'seekForward';
    } else {
      jsonData.action = 'seekBackward';
    }

    axiosInstance
      .post(`${window.location.protocol}//${camera.host}/api/v1/replay/stream/seek`, jsonData)
      .then((response) => {
        console.log('+- 10 seek ?', response.data);
      })
      .catch((error) => {
        console.log('Seek error', error);
        setErrorMessage(error.response.data.error_message);
      });
  };

  const handleFastForwardAndRewind = async (type = 'fast-forward') => {
    if (playbackType === 'live') {
      await handleStreamSwitch();
    }
    let newSpeed;
    if (type === 'fast-forward') {
      // eslint-disable-next-line no-nested-ternary
      newSpeed = playbackSpeed >= 1 ? playbackSpeed * 2
        : playbackSpeed === -1 ? 1 : playbackSpeed / 2;
      if (newSpeed > 8) {
        return;
      }
    } else {
      // eslint-disable-next-line no-nested-ternary
      newSpeed = playbackSpeed <= -1 ? playbackSpeed * 2
        : playbackSpeed === 1 ? -1 : playbackSpeed / 2;
      if (newSpeed < -8) {
        return;
      }
    }

    const jsonData = {
      peerId: peerConnection.current.peerId.toString(),
      mediaSessionId: mediaSessionId.current,
      action: newSpeed >= 1 ? 'fastForward' : 'rewind',
      value: Math.abs(newSpeed),
    };
    axiosInstance
      .post(`${window.location.protocol}//${camera.host}/api/v1/replay/stream/seek`, jsonData)
      .then((response) => {
        setPlaybackSpeed(newSpeed);
        console.log('FF/Rewind ?', response.data);
      })
      .catch((error) => {
        console.log('FF/Rewind error', error);
        setErrorMessage(error.response.data.error_message);
      });
  };

  const handleOverlayOpen = () => {
    setShowOverlaySettings(!showOverlaySettings);
  };

  const handleNvStreamerRangeDialogClose = () => {
    setOpenNvStreamerRangeDialog(false);
  };

  const handleNvStreamerRangeDialogOpen = () => {
    setOpenNvStreamerRangeDialog(true);
    axiosInstance
      .get(`${window.location.protocol}//${camera.host}/api/v1/storage/file/metadata?streamId=${camera.sensorId}`)
      .then((response) => {
        if (response.data) {
          setMetaData(response.data);
        }
      })
      .catch((error) => {
        console.log('Failed to get metadata', error);
        setErrorMessage(error.response.data.error_message);
      });
  };

  const handleMmsRangeDialogClose = () => {
    setOpenMmsRangeDialog(false);
  };

  const handleMmsRangeDialogOpen = () => {
    setOpenMmsRangeDialog(true);
  };

  const handleOverlaySettingsClose = () => {
    setShowOverlaySettings(false);
  };

  const handleNvStreamerRangeSubmit = async (hhStart, mmStart, ssStart, hhEnd, mmEnd, ssEnd) => {
    setOpenNvStreamerRangeDialog(false);
    await stopWebrtcConnection();
    nvStreamerRangeStartTime.current = `${hhStart}:${mmStart}:${ssStart}`;
    nvStreamerRangeEndTime.current = `${hhEnd}:${mmEnd}:${ssEnd}`;
    playNvStreamerRange.current = true;
    startWebrtcConnection();
  };

  const updateTimelines = () => {
    const tempTimelines = originalTimelines.current != null
      ? JSON.parse(JSON.stringify(originalTimelines.current)) : [];
    if (tempTimelines != null && tempTimelines.length > 0) {
      const s1 = startDate.getTime();
      const e1 = endDate.getTime();
      console.log(s1, e1);
      const newTimelines = [];
      for (let i = 0; i < tempTimelines.length; i += 1) {
        const s2 = new Date(tempTimelines[i].startTime).getTime();
        const e2 = new Date(tempTimelines[i].endTime).getTime();
        console.log(s2, e2);
        if ((e2 > s1 && e2 < e1) || (s2 > s1 && s2 < e1)) {
          newTimelines.push(tempTimelines[i]);
        }
        if (s1 >= s2 && e2 >= e1) {
          newTimelines.push(tempTimelines[i]);
        }
      }
      for (let i = 0; i < newTimelines.length; i += 1) {
        const s2 = new Date(newTimelines[i].startTime).getTime();
        const e2 = new Date(newTimelines[i].endTime).getTime();
        if (s2 < s1) {
          newTimelines[i].startTime = new Date(s1).toISOString();
        }
        if (e2 > e1) {
          newTimelines[i].endTime = new Date(e1).toISOString();
        }
      }
      setTimelines(newTimelines);
      setTimelineGaps(getTimelineGaps(newTimelines));
      if (page === 'recorded' && newTimelines.length > 0) {
        selectedIntervalRef.current = [new Date(newTimelines[0].startTime)];
      }
    }
  };

  const resetTimelines = async () => {
    const tempTimelines = originalTimelines.current != null
      ? JSON.parse(JSON.stringify(originalTimelines.current)) : [];
    setTimelines(tempTimelines);
    setTimelineGaps(getTimelineGaps(tempTimelines));
    if (page === 'recorded' && tempTimelines.length > 0) {
      selectedIntervalRef.current = [new Date(tempTimelines[0].startTime)];
    }
    await stopWebrtcConnection();
    startWebrtcConnection();
  };

  const handleMmsRangeSubmit = async () => {
    setOpenMmsRangeDialog(false);
    await stopWebrtcConnection();
    mmsRangeStartTime.current = moment(startDate).toISOString();
    mmsRangeEndTime.current = moment(endDate).toISOString();
    if (mmsRangeStartTime.current != null && mmsRangeEndTime.current != null) {
      updateTimelines();
    }
    playMmsRange.current = true;
    setPlaybackType('recorded');
    playbackTypeRef.current = 'recorded';
    startWebrtcConnection();
  };

  const handlePictureApi = () => {
    if (page !== 'recorded' && adaptorType !== 'streamer') {
      const ingressController = store('ingressController');
      console.log('ingressController', ingressController);
      let url = `${window.location.protocol}//${camera.host}/api/v1/live/stream/${camera.sensorId}/picture`;
      let proxy = window.location.pathname;
      if (proxy != null && proxy !== '/' && proxy.length > 0) {
        if (proxy[proxy.length - 1] === '/') {
          proxy = proxy.slice(0, -1);
        }
        url = url.replace('/api', `${proxy}/api`);
      }
      const newWindow = window.open(url, '_blank');
      // eslint-disable-next-line eqeqeq
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        setErrorMessage('Please enable pop-up and try again');
      }
    } else {
      queryStreamAndGetPicture();
    }
  };

  const queryStreamAndGetPicture = () => {
    const queryEndpoint = adaptorType !== 'streamer'
      ? `${window.location.protocol}//${camera.host
      }/api/v1/replay/stream/query?peerid=${peerConnection.current.peerId.toString()}&mediaSessionId=${mediaSessionId.current
      }&metadata=false`
      : `${window.location.protocol}//${camera.host
      }/api/v1/live/stream/query?peerId=${peerConnection.current.peerId.toString()}&mediaSessionId=${mediaSessionId.current
      }&metadata=false`;
    axiosInstance
      .get(queryEndpoint)
      .then((response) => {
        // {
        //   "metadata" : null,
        //   "ts" : 1667304122569000
        // }
        console.log('stream query response: ', response.data);
        if (response.data.ts != null) {
          handleScreenShot(response.data.ts);
        } else {
          console.log('Invalid TS recevied in stream query');
          setErrorMessage('Invalid TS recevied in stream query');
        }
      })
      .catch((e) => {
        console.log('Failed to get query stream', e);
        setErrorMessage('Failed to get query stream');
      });
  };

  const handleScreenShot = (timestamp) => {
    let utcDateTime = '';
    if (adaptorType === 'streamer') {
      utcDateTime = timestamp;
    } else {
      const ts = timestamp.toString().length === 16 ? timestamp / 1000 : timestamp;
      utcDateTime = moment(ts).toISOString();
    }
    const ingressController = store('ingressController');
    console.log('ingressController', ingressController);
    let url = adaptorType !== 'streamer'
      ? `${window.location.protocol}//${camera.host}/api/v1/replay/stream/${camera.sensorId}/picture?startTime=${utcDateTime}`
      : `${window.location.protocol}//${camera.host}/api/v1/live/stream/${camera.sensorId}/picture?startTime=${utcDateTime}`;
    let proxy = window.location.pathname;
    if (proxy != null && proxy !== '/' && proxy.length > 0) {
      if (proxy[proxy.length - 1] === '/') {
        proxy = proxy.slice(0, -1);
      }
      url = url.replace('/api', `${proxy}/api`);
    }
    const newWindow = window.open(url, '_blank');
    // eslint-disable-next-line eqeqeq
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
      setErrorMessage('Please enable pop-up and try again');
    }
  };

  const getStreamStatus = () => {
    if (peerConnection.current) {
      const streamStatusEndpoint = page === 'recorded' || recordingTest
        ? `${window.location.protocol}//${camera.host
        }/api/v1/replay/stream/status?peerId=${peerConnection.current.peerId.toString()}&mediaSessionId=${mediaSessionId.current
        }`
        : `${window.location.protocol}//${camera.host
        }/api/v1/live/stream/status?peerId=${peerConnection.current.peerId.toString()}&mediaSessionId=${mediaSessionId.current
        }`;
      axiosInstance
        .get(streamStatusEndpoint)
        .then((response) => {
          if (response.data.state) {
            switch (response.data.state) {
              case 'PLAYING':
                setStreamStatus(' is playing');
                break;
              case 'PAUSED':
                setStreamStatus(' is paused');
                break;
              case 'NOT_PLAYING':
                setStreamStatus(' is not playing');
                break;
              default:
                setStreamStatus(`status is ${response.data.state}`);
                break;
            }
          }
        })
        .catch((error) => {
          console.log('Failed to get stream status', error);
        });
    }
  };

  const onInfoClick = () => {
    if (adaptorType === 'streamer') {
      axiosInstance
        .get(`${window.location.protocol}//${camera.host}/api/v1/storage/file/metadata?streamId=${camera.sensorId}`)
        .then((response) => {
          if (response.data) {
            setMetaData(response.data);
          }
        })
        .catch((error) => {
          console.log('Failed to get metadata', error);
          setErrorMessage(error.response.data.error_message);
        });
    }
    setOpenDrawer(true);
  };

  const handleSyncTimeClose = () => {
    setOpenSyncTimeDialog(false);
  };

  const handleOverlaySubmit = async () => {
    setShowOverlaySettings(false);
    await stopWebrtcConnection();
    if ((adaptorType === 'mms' || adaptorType === 'vst') && (mmsRangeStartTime.current || mmsRangeEndTime.current)) {
      playMmsRange.current = true;
    }
    startWebrtcConnection();
  };

  const handleReplay = async () => {
    if (isStopping) {
      console.log("Already in the process of stopping, do nothing.")
      return;
    }
    isStopping = true;
    try {
      await stopWebrtcConnection();
  
      if ((adaptorType === 'mms' || adaptorType === 'vst') && (mmsRangeStartTime.current || mmsRangeEndTime.current)) {
        playMmsRange.current = true;
      }
  
      if (adaptorType === 'streamer' && (nvStreamerRangeStartTime.current || nvStreamerRangeEndTime.current)) {
        playNvStreamerRange.current = true;
      }
  
      startWebrtcConnection();
    } finally {
      isStopping = false;
    }
  };

  const debouncedHandleReplay = debounce(handleReplay, 1000);

  const debouncedHandleResetTimelines = debounce(resetTimelines, 1000);

  const handleSyncTimeOpen = () => {
    setOpenSyncTimeDialog(true);
  };

  const handleVideoClose = () => {
    closeCamera(camera);
  };

  const onStartDateChange = (date) => {
    setStartDate(date.toDate());
    setStartTimeString(date.toDate());
  };

  const onEndTimeInMsChange = (e) => {
    if (startDate) {
      setEndDate(new Date(startDate.getTime() + Number(e.target.value)));
    }
  };

  const onEndTimeDateChange = (date) => {
    setEndDate(date.toDate());
  };

  const showVideoControls = () => {
    setVideoControlsVisible(true);
  };

  const hideVideoControls = () => {
    setVideoControlsVisible(false);
  };

  const drawerInfo = [
    {
      name: 'peer ID',
      value: peerIdStateVariable,
    },
    {
      name: 'device ID',
      value: camera.sensorId,
    },
    {
      name: 'device IP',
      value: camera.sensorIp,
    },
  ];
  if (adaptorType !== 'streamer' && page === 'recorded') {
    drawerInfo.push({
      name: 'start time',
      value: startTimeString ? startTimeString.toLocaleString() : '',
    });
    drawerInfo.push({
      name: 'end time',
      value: endDate ? endDate.toLocaleString() : '',
    });
  }
  if (adaptorType === 'streamer' && metaData) {
    if (Object.prototype.hasOwnProperty.call(metaData, 'Bitrate')) {
      drawerInfo.push({
        name: 'birate',
        value: metaData.Bitrate,
      });
    }
    if (Object.prototype.hasOwnProperty.call(metaData, 'Codec')) {
      drawerInfo.push({
        name: 'codec',
        value: metaData.Codec,
      });
    }
    if (Object.prototype.hasOwnProperty.call(metaData, 'Container')) {
      drawerInfo.push({
        name: 'container',
        value: metaData.Container,
      });
    }
    if (Object.prototype.hasOwnProperty.call(metaData, 'Duration')) {
      drawerInfo.push({
        name: 'duration',
        value: metaData.Duration,
      });
    }
    if (Object.prototype.hasOwnProperty.call(metaData, 'Framerate')) {
      drawerInfo.push({
        name: 'framerate',
        value: metaData.Framerate,
      });
    }
    if (Object.prototype.hasOwnProperty.call(metaData, 'Height')) {
      drawerInfo.push({
        name: 'height',
        value: metaData.Height,
      });
    }
    if (Object.prototype.hasOwnProperty.call(metaData, 'Scan type')) {
      drawerInfo.push({
        name: 'scan type',
        value: metaData['Scan type'],
      });
    }
    if (Object.prototype.hasOwnProperty.call(metaData, 'Width')) {
      drawerInfo.push({
        name: 'width',
        value: metaData.Width,
      });
    }
  }

  if (onlyVideo) {
    return (
      <div className="player-wrapper">
        <video
          controls
          width="100%"
          height="100%"
          autoPlay
          muted
          style={{ background: 'black', objectFit: 'contain' }}
          className="react-player"
          ref={(e) => {
            videoRef.current = e;
          }}
          id={`video-only-${camera.sensorId}`}
        />
        {errorMessage && (
          <Stack className="react-player-error" direction="row" alignItems="center">
            <Typography sx={{ color: 'error.main', pl: 2 }} variant="overline">
              {errorMessage}
            </Typography>
            <IconButton
              onClick={() => {
                setErrorMessage(null);
              }}
              edge="end"
              sx={{ color: 'white', marginLeft: 'auto', pr: 2 }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        )}
      </div>
    );
  }

  const recordStreamTestFunctions = (() => {
    const seekPlusTen = async () => {
      handleSeek('forward');
    };
    const seekMinusTen = async () => {
      handleSeek('backward');
    };
    const fastforwardByNum = async (num) => {
      const jsonData = {
        peerId: peerConnection.current.peerId.toString(),
        mediaSessionId: mediaSessionId.current,
        action: 'fastForward',
        value: Math.abs(num),
      };
      axiosInstance
        .post(`${window.location.protocol}//${camera.host}/api/v1/replay/stream/seek`, jsonData)
        .then((response) => {
          setPlaybackSpeed(num);
          console.log('FF ?', response.data);
        })
        .catch((error) => {
          console.log('FF', error);
          setErrorMessage(error.response.data.error_message);
        });
    };
    const rewindByNum = async (num) => {
      const jsonData = {
        peerId: peerConnection.current.peerId.toString(),
        mediaSessionId: mediaSessionId.current,
        action: 'rewind',
        value: Math.abs(num),
      };
      axiosInstance
        .post(`${window.location.protocol}//${camera.host}/api/v1/replay/stream/seek`, jsonData)
        .then((response) => {
          setPlaybackSpeed(num);
          console.log('Rewind ?', response.data);
        })
        .catch((error) => {
          console.log('Rewind error', error);
          setErrorMessage(error.response.data.error_message);
        });
    };
    return {
      seekPlusTen: () => seekPlusTen,
      seekMinusTen: () => seekMinusTen,
      fastforwardByNum: (n) => fastforwardByNum(n),
      rewindByNum: (n) => rewindByNum(n),
    };
  })();

  return (
    <>
      {recordingTest && <p>{recordedTestOperation}</p>}

      <Card>
        <CardHeader
          title={(
            <Box>
              {cameraInRow > 2 && (
                <Box
                  sx={{
                    display: {
                      xs: 'none',
                      sm: 'none',
                      md: 'none',
                      lg: 'inline',
                    },
                  }}
                >
                  <Marquee speed={40} gradientWidth={50} pauseOnHover>
                    <Typography variant="h6" className="video-title">
                      <b>
                        {camera.name}
                        {streamStatus}
                      </b>
                    </Typography>
                  </Marquee>
                </Box>
              )}
              {cameraInRow <= 2 && (
                <Typography
                  variant="h6"
                  className="video-title"
                  sx={{
                    display: {
                      xs: 'none',
                      sm: 'none',
                      md: 'none',
                      lg: 'inline',
                    },
                  }}
                >
                  <b>
                    {camera.name}
                    {streamStatus}
                  </b>
                </Typography>
              )}
              <Box
                sx={{
                  display: {
                    xs: 'inline',
                    sm: 'inline',
                    md: 'inline',
                    lg: 'none',
                  },
                }}
              >
                <Marquee speed={40} gradientWidth={50} pauseOnHover>
                  <Typography variant="h6" className="video-title">
                    <b>
                      {camera.name}
                      {streamStatus}
                    </b>
                  </Typography>
                </Marquee>
              </Box>
            </Box>
          )}
          subheader={
            <Typography variant="caption">
              {camera.remoteDeviceName && camera.remoteDeviceLocation ?
                `at ${camera.remoteDeviceName} (${camera.remoteDeviceLocation})` : ""}
            </Typography>
          }
          action={
            cameraInRow <= 2
            && closeCamera && (
              <Box
                sx={{
                  display: {
                    xs: 'none', sm: 'none', md: 'none', lg: 'inline',
                  },
                }}
              >
                <IconButton onClick={handleVideoClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
            )
          }
        />
        <div className="player-wrapper" onMouseEnter={showVideoControls} onMouseLeave={hideVideoControls}>
          {loading && (
            <div className="video-overlay">
              <Iconify color="white" width={70} icon="eos-icons:bubble-loading" />
            </div>
          )}
          <video
            width="100%"
            height="100%"
            autoPlay
            muted
            style={{ background: 'black', objectFit: 'contain' }}
            className="react-player"
            ref={(e) => {
              videoRef.current = e;
            }}
            id={`video-${camera.sensorId}`}
          />
          {!errorMessage && videoControlsVisible && (
            <Tooltip title="Info" placement="top">
              <IconButton className="react-player-info" onClick={onInfoClick} sx={{ color: 'white' }}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
          )}
          {recordingStatus && (
            <IconButton className="react-player-rec" sx={{ cursor: 'default' }}>
              <FiberManualRecordIcon sx={{ color: 'error.main' }} />
            </IconButton>
          )}
          {errorMessage && (
            <Stack className="react-player-error" direction="row" alignItems="center">
              <Typography sx={{ color: 'error.main', pl: 2 }} variant="overline">
                {errorMessage}
              </Typography>
              <IconButton
                onClick={() => {
                  setErrorMessage(null);
                }}
                edge="end"
                sx={{ color: 'white', marginLeft: 'auto', pr: 2 }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          )}
          {videoControlsVisible && (
            <Stack spacing={2} direction="row" justifyContent="space-between" className="react-player-controls">
              <Stack direction="row" justifyContent="center">
                <Tooltip title="Play-Pause" placement="top">
                  <IconButton onClick={handlePlayPause} edge="end" sx={{ color: 'white' }}>
                    {playerSate !== VIDEO_STATUS.PLAYING ? <PlayCircleIcon /> : <PauseCircleIcon />}
                  </IconButton>
                </Tooltip>
                {page === 'recorded' && playbackType === 'recorded' && (
                  <>
                    <Tooltip title="Rewind" placement="top">
                      <IconButton
                        onClick={() => {
                          handleFastForwardAndRewind('rewind');
                        }}
                        edge="end"
                        sx={{ color: 'white' }}
                      >
                        <Badge badgeContent={playbackSpeed} invisible={playbackSpeed >= 0}>
                          <FastRewindIcon />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fast-Forward" placement="top">
                      <IconButton
                        onClick={() => {
                          handleFastForwardAndRewind('fast-forward');
                        }}
                        edge="end"
                        sx={{ color: 'white' }}
                      >
                        <Badge badgeContent={playbackSpeed} invisible={playbackSpeed <= 1}>
                          <FastForwardIcon />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                    {!isDesktop
                      || (cameraInRow <= 2 && (
                        <>
                          <Tooltip title="Seek -10" placement="top">
                            <IconButton
                              onClick={() => {
                                handleSeek('backward');
                              }}
                              edge="end"
                              sx={{ color: 'white' }}
                            >
                              <Replay10Icon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Seek +10" placement="top">
                            <IconButton
                              onClick={() => {
                                handleSeek('forward');
                              }}
                              edge="end"
                              sx={{ color: 'white' }}
                            >
                              <Forward10Icon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ))}
                  </>
                )}
                <Box
                  sx={{
                    width: {
                      xs: 100,
                      sm: 100,
                      md: cameraInRow === 4 ? 100 : 130,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center">
                    <IconButton
                      onClick={() => setVolumeLevel((prev) => (prev === 0 ? 1 : 0))}
                      edge="end"
                      sx={{ mr: 1, color: 'white' }}
                      disabled={!isAudioTrackPresent}
                    >
                      {volumeLevel === 0 ? (
                        <VolumeOffIcon sx={{ color: 'white' }} disabled={!isAudioTrackPresent} />
                      ) : (
                        <VolumeUp sx={{ color: 'white' }} disabled={!isAudioTrackPresent} />
                      )}
                    </IconButton>
                    <Slider
                      value={volumeLevel}
                      onChange={handleVolumeChange}
                      step={0.1}
                      min={0}
                      max={1}
                      disabled={!isAudioTrackPresent}
                      sx={{ color: 'white' }}
                    />
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" justifyContent="center" sx={{ pr: 2 }}>
                {page === 'recorded' && playbackType === 'recorded' && (
                  <Tooltip title="Switch to live" placement="top">
                    <IconButton onClick={handleStreamSwitch} edge="end" sx={{ color: 'white' }}>
                      <img
                        alt={'not_live'}
                        src={`${process.env.PUBLIC_URL}/assets/images/notLive.jpg`}
                        style={{ objectFit: 'contain', height: 20 }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
                {page === 'recorded' && playbackType === 'live' && (
                  <Tooltip title="Switch to recorded" placement="top">
                    <IconButton onClick={handleStreamSwitch} edge="end" sx={{ color: 'white' }}>
                      <img
                        alt={'live'}
                        src={`${process.env.PUBLIC_URL}/assets/images/live.gif`}
                        style={{ objectFit: 'contain', height: 20 }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
                {page !== 'recorded' && (
                  <Tooltip title="Streams" placement="top">
                    <IconButton onClick={handleSubStreamMenuOpen} edge="end" sx={{ color: 'white' }}>
                      <ViewStreamIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {(page === 'recorded' || adaptorType === 'streamer') && playbackType === 'recorded' && (
                  <Tooltip title="Replay" placement="top">
                    <IconButton onClick={debouncedHandleReplay} edge="end" sx={{ color: 'white' }}>
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {page === 'recorded' && adaptorType !== 'streamer' && playbackType === 'recorded' && (
                  <Tooltip title="Sync to current time" placement="top">
                    <IconButton onClick={handleSyncTimeOpen} edge="end" sx={{ color: 'white' }}>
                      <UpdateIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {(page === 'recorded' || page === 'live' || adaptorType === 'streamer') && (
                  <Tooltip title="Overlay" placement="top">
                    <IconButton onClick={handleOverlayOpen} edge="end" sx={{ color: 'white' }}>
                      {showOverlaySettings && <WidgetsOutlinedIcon />}
                      {!showOverlaySettings && <WidgetsIcon />}
                    </IconButton>
                  </Tooltip>
                )}

                <Menu
                  anchorEl={subStreamAnchorEl}
                  open={Boolean(subStreamAnchorEl)}
                  onClose={handleSubStreamMenuClose}
                  TransitionComponent={Fade}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                >
                  {cameraStreamList.map(
                    (subStream, index) => subStream.metadata
                      && subStream.metadata.resolution !== '' && (
                        <MenuItem
                          onClick={() => {
                            handleSubStream(subStream);
                          }}
                          key={(subStream.metadata?.resolution ?? 'NA') + subStream.name + index}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: subStream.streamId === selectedSubStreamId ? 'bold' : 'normal',
                            }}
                          >
                            {subStream.metadata?.resolution === '' || !subStream.metadata?.resolution
                              ? 'NA'
                              : subStream.metadata.resolution}
                          </Typography>
                        </MenuItem>
                      ),
                  )}
                </Menu>

                {cameraInRow < 3 && (
                  <Box sx={{ display: { xs: 'none', sm: 'none', md: 'inline' } }}>
                    <Tooltip title="Clients" placement="top">
                      <IconButton onClick={handleClientMenuOpen} edge="end" sx={{ color: 'white' }}>
                        <GroupIcon />
                      </IconButton>
                    </Tooltip>

                    <Menu
                      anchorEl={clientAnchorEl}
                      open={Boolean(clientAnchorEl)}
                      onClose={handleClientMenuClose}
                      TransitionComponent={Fade}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                    >
                      {cameraClientList.map((client, index) => (
                        <MenuItem onClick={() => { }} key={client.deviceId + index}>
                          {client.clientIpAddress}
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                )}

                <Tooltip title="Take screenshot" placement="top">
                  <IconButton onClick={handlePictureApi} edge="end" sx={{ color: 'white' }}>
                    <CameraAltIcon />
                  </IconButton>
                </Tooltip>

                {adaptorType === 'streamer' && (
                  <Tooltip title="Select range" placement="top">
                    <IconButton onClick={handleNvStreamerRangeDialogOpen} edge="end" sx={{ color: 'white' }}>
                      <DateRangeIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {page === 'recorded' && (
                  <Tooltip title="Select range" placement="top">
                    <IconButton onClick={handleMmsRangeDialogOpen} edge="end" sx={{ color: 'white' }}>
                      <DateRangeIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {!isDesktop
                  || (cameraInRow <= 2 && (
                    <Tooltip title="Quality" placement="top">
                      <IconButton onClick={handleQualityMenuOpen} edge="end" sx={{ color: 'white' }}>
                        <VideoSettingsIcon />
                      </IconButton>
                    </Tooltip>
                  ))}

                <Menu
                  anchorEl={qualityAnchorEl}
                  open={Boolean(qualityAnchorEl)}
                  onClose={handleQualityMenuClose}
                  TransitionComponent={Fade}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleQualityChange('auto');
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: quality === 'auto' ? 'bold' : 'normal' }}>
                      Auto
                    </Typography>
                  </MenuItem>
                  {!(adaptorType === 'vst' && page === 'recorded') && adaptorType !== 'mms' && (
                    <MenuItem
                      onClick={() => {
                        handleQualityChange('pass_through');
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: quality === 'pass_through' ? 'bold' : 'normal',
                        }}
                      >
                        Pass-through
                      </Typography>
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      handleQualityChange('high');
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: quality === 'high' ? 'bold' : 'normal' }}>
                      High
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleQualityChange('medium');
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: quality === 'medium' ? 'bold' : 'normal',
                      }}
                    >
                      Medium
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    dense
                    onClick={() => {
                      handleQualityChange('low');
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: quality === 'low' ? 'bold' : 'normal' }}>
                      Low
                    </Typography>
                  </MenuItem>
                </Menu>
                <IconButton onClick={handleClickFullscreen} edge="end" sx={{ color: 'white' }}>
                  <FullscreenIcon />
                </IconButton>
              </Stack>
            </Stack>
          )}
          <Dialog open={openSyncTimeDialog} onClose={handleSyncTimeClose}>
            <DialogTitle>Delay playback</DialogTitle>
            <DialogContent>
              <Box sx={{ p: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Delay playback by:
                  {' '}
                </Typography>
                <TextField defaultValue={0} size="small" name="time" label="time(seconds)" inputRef={syncTimeRef} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" color="error" onClick={handleSyncTimeClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleRecordedTimeSync(syncTimeRef.current.value);
                }}
                autoFocus
              >
                Submit
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={openMmsRangeDialog} onClose={handleMmsRangeDialogClose}>
            <DialogTitle>Select start and end time</DialogTitle>
            <DialogContent>
              <Box sx={{ p: 1 }}>
                <Typography>{'Start time: '}</Typography>
                <DatePicker
                  className="mms-range-picker"
                  showTime={{ format: 'HH:mm:ss.SSS' }}
                  format="YYYY-MM-DD HH:mm:ss.SSS"
                  onOk={onStartDateChange}
                  popupStyle={{ zIndex: 999999 }}
                  showNow={false}
                />
                <Stack direction="row" alignContent="center">
                  <Box>
                    <input
                      type="checkbox"
                      checked={endTimeInMsNeeded}
                      onChange={() => {
                        if (!endTimeDateNeeded) setEndTimeInMsNeeded(!endTimeInMsNeeded);
                      }}
                    />
                  </Box>
                  <Typography gutterBottom>{'Duration required ? '}</Typography>
                </Stack>

                {endTimeInMsNeeded && (
                  <TextField
                    defaultValue={0}
                    size="small"
                    name="duration"
                    label="Duration(in milli-seconds)"
                    onChange={onEndTimeInMsChange}
                  />
                )}
                <Stack direction="row" alignContent="center">
                  <Box>
                    <input
                      type="checkbox"
                      checked={endTimeDateNeeded}
                      onChange={() => {
                        if (!endTimeInMsNeeded) setEndTimeDateNeeded(!endTimeDateNeeded);
                      }}
                    />
                  </Box>
                  <Typography gutterBottom>{'End date-time required ? '}</Typography>
                </Stack>

                {endTimeDateNeeded && (
                  <DatePicker
                    className="mms-range-picker"
                    showTime={{ format: 'HH:mm:ss.SSS' }}
                    format="YYYY-MM-DD HH:mm:ss.SSS"
                    onOk={onEndTimeDateChange}
                    popupStyle={{ zIndex: 999999 }}
                    showNow={false}
                  />
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" color="error" onClick={handleMmsRangeDialogClose}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleMmsRangeSubmit} autoFocus>
                Submit
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={openNvStreamerRangeDialog} onClose={handleNvStreamerRangeDialogClose}>
            <DialogTitle>Select start and end time</DialogTitle>
            <DialogContent>
              {metaData && (
                <Typography>
                  Duration of
                  {' '}
                  {camera.name}
                  {' '}
                  is
                  {' '}
                  <b>
                    {metaData.Duration}
                    {' '}
                    seconds
                  </b>
                </Typography>
              )}
              <Box sx={{ p: 3 }}>
                <Typography variant="overline">Start time:</Typography>
                <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                  <TextField defaultValue={0} size="small" name="hh" label="hh" inputRef={hhStartRef} />
                  <TextField defaultValue={0} size="small" name="mm" label="mm" inputRef={mmStartRef} />
                  <TextField defaultValue={0} size="small" name="ss" label="ss" inputRef={ssStartRef} />
                </Stack>
                <Typography variant="overline">End time:</Typography>
                <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                  <TextField defaultValue={0} size="small" name="hh" label="hh" inputRef={hhEndRef} />
                  <TextField defaultValue={0} size="small" name="mm" label="mm" inputRef={mmEndRef} />
                  <TextField defaultValue={0} size="small" name="ss" label="ss" inputRef={ssEndRef} />
                </Stack>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" color="error" onClick={handleNvStreamerRangeDialogClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleNvStreamerRangeSubmit(
                    hhStartRef.current.value,
                    mmStartRef.current.value,
                    ssStartRef.current.value,
                    hhEndRef.current.value,
                    mmEndRef.current.value,
                    ssEndRef.current.value,
                  );
                }}
                autoFocus
              >
                Submit
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={showOverlaySettings} onClose={handleOverlaySettingsClose}>
            <DialogTitle>Select overlay settings</DialogTitle>
            <DialogContent>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'inline' }}>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px', marginBottom: 10 }}>
                    <Typography variant="body2" style={{ minWidth: '130px' }}>Overlay filter: </Typography>
                    <input
                      type="text"
                      id="overlayFilter"
                      placeholder="overlay-filter"
                      value={overlayFilter}
                      onChange={onOverlayFilterChange}
                      style={{ width: '50px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px' }}>
                    <Typography variant="body2" style={{ minWidth: '130px' }}>Overlay color: </Typography>
                    <div id="colorPicker">
                      <div
                        id="red"
                        onClick={() => setOverlayColor('red')}
                        style={{
                          top: overlayColor === 'red' ? '-2px' : '',
                        }}
                      />
                      <div
                        id="green"
                        onClick={() => setOverlayColor('green')}
                        style={{
                          top: overlayColor === 'green' ? '-2px' : '',
                        }}
                      />
                      <div
                        id="blue"
                        onClick={() => setOverlayColor('blue')}
                        style={{
                          top: overlayColor === 'blue' ? '-2px' : '',
                        }}
                      />
                      <div
                        id="black"
                        onClick={() => setOverlayColor('black')}
                        style={{
                          top: overlayColor === 'black' ? '-2px' : '',
                        }}
                      />
                      <div
                        id="white"
                        onClick={() => setOverlayColor('white')}
                        style={{
                          top: overlayColor === 'white' ? '-2px' : '',
                        }}
                      />
                      <div
                        id="yellow"
                        onClick={() => setOverlayColor('yellow')}
                        style={{
                          top: overlayColor === 'yellow' ? '-2px' : '',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px' }}>
                    <Typography variant="body2" style={{ minWidth: '130px' }}>Bbox:</Typography>
                    <Switch checked={overlayBbox} onChange={handleOverlayBbox} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px' }}>
                    <Typography variant="body2" style={{ minWidth: '130px' }}>Tripwire:</Typography>
                    <Switch checked={overlayTripwire} onChange={handleOverlayTripwire} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px' }}>
                    <Typography variant="body2" style={{ minWidth: '130px' }}>ROI:</Typography>
                    <Switch checked={overlayRoi} onChange={handleOverlayRoi} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px' }}>
                    <Typography variant="body2">
                      BBOX Thickness:{' '}
                      <b>{bboxThickness}</b>
                    </Typography>
                    <br />
                  </div>
                  <div style={{ display: 'flex', maxHeight: '5rem', overflowY: 'scroll' }}>
                    <LineWidthPicker
                      lineWidths={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                      colour="#000000"
                      hoverBackground="#F0F8FF"
                      onClick={(v) => {
                        setBboxThickness(v);
                      }}
                      width="100%"
                      lineWidth={bboxThickness}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px' }}>
                    <Typography variant="body2" style={{ minWidth: '130px' }}>Overlay Debug:</Typography>
                    <Switch checked={overlayDebug} onChange={handleOverlayDebug} />
                  </div>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" color="error" onClick={handleOverlaySettingsClose}>
                Close
              </Button>
              <Button variant="contained" onClick={handleOverlaySubmit} autoFocus>
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        </div>
        {(timelines == null || timelines.length === 0) && page === 'recorded' && (
          <Box
            className="scrubber-container"
            sx={{
              pt: 5, pb: 8, pl: 6, pr: 6, zIndex: 10, position: 'relative',
            }}
          >
            <Box sx={{ position: 'absolute', right: 0, top: 20 }}>
              <Tooltip title="Reset timelines" placement="top">
                <IconButton onClick={debouncedHandleResetTimelines}>
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        {timelines != null && timelines.length > 0 && (
          <Box
            className="scrubber-container"
            sx={{
              pt: 5, pb: 8, pl: 6, pr: 6, zIndex: 10, position: 'relative',
            }}
          >
            <Box sx={{ position: 'absolute', right: 0, top: 20 }}>
              <Tooltip title="Reset timelines" placement="top">
                <IconButton onClick={debouncedHandleResetTimelines}>
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <TimeRange
              error={timelineScrubberError}
              ticksNumber={isDesktop && cameraInRow === 1 ? 10 : 3}
              selectedInterval={selectedInterval}
              timelineInterval={[new Date(timelines[0].startTime),
              new Date(timelines[timelines.length - 1].endTime)]}
              onUpdateCallback={timelineScrubberErrorHandler}
              onChangeCallback={onChangeCallback}
              containerClassName="scrubber-container"
              disabledIntervals={timelineGaps}
              step={1}
              tooltipTag="Time:"
              formatTick={(ms) => format(new Date(ms), 'MM/dd HH:mm:ss')}
              formatTooltip={(ms) => format(new Date(ms), 'HH:mm:ss.SSS')}
            />
          </Box>
        )}
      </Card>
      <CameraInfoDrawer
        open={openDrawer}
        onClose={onCloseDrawer}
        info={drawerInfo}
        peerConnection={peerConnection}
      />
    </>
  );
}

VideoPlayer.propTypes = {
  camera: PropTypes.shape({
    firmwareVersion: PropTypes.string.isRequired,
    hardware: PropTypes.string.isRequired,
    hardwareId: PropTypes.string.isRequired,
    sensorId: PropTypes.string.isRequired,
    sensorIp: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    manufacturer: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    remoteDeviceName: PropTypes.string.isRequired,
    remoteDeviceLocation: PropTypes.string.isRequired,
    position: PropTypes.shape({
      depth: PropTypes.string.isRequired,
      direction: PropTypes.string.isRequired,
      fieldOfView: PropTypes.string.isRequired,
      gps: PropTypes.shape({
        latitude: PropTypes.string.isRequired,
        longitude: PropTypes.string.isRequired,
      }),
    }),
    serialNumber: PropTypes.string.isRequired,
    host: PropTypes.string.isRequired,
  }).isRequired,
  cameraInRow: PropTypes.number,
  page: PropTypes.string,
  onlyVideo: PropTypes.bool,
  closeCamera: PropTypes.func,
  recordingTest: PropTypes.bool,
  liveTest: PropTypes.bool,
  useVideoCoordinates: PropTypes.bool,
  videoWallList: PropTypes.array,
};

VideoPlayer.defaultProps = {
  cameraInRow: 2,
  onlyVideo: false,
  recordingTest: false,
  liveTest: false,
  useVideoCoordinates: false,
  videoWallList: [],
};
