import React, {useRef, useState,useEffect, useContext } from 'react'
import styles from '../styles/videoComponent.module.css';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import io from "socket.io-client";
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEnd from '@mui/icons-material/CallEnd';
import MicOnIcon from '@mui/icons-material/KeyboardVoice';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import Badge from '@mui/material/Badge';
import Icon from '@mui/material/Icon';
import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import server from "../environment.js";

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers":[
        { "urls" : "stun:stun.l.google.com:19302"}
    ]
}
 
const VideoPlayer = ({ stream }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={false}
      style={{ width: '300px', margin: '10px' }}
    />
  );
};


export default function VideoMeetComponent() {
    var socketRef =  useRef();
    let socketIdRef  = useRef();

    let localVideoRef = useRef();

    let [videoAvailable,setVideoAvailable] = useState(true);
    let [audioAvailable,setAudioAvailable] = useState(true);
    
    let [video,setVideo] = useState();

    let [audio,setAudio] = useState();

    let [screen ,setScreen] = useState();

    let [screenAvailable ,setScreenAvailable] = useState();

    let [showModal, setModal] = useState(true);

    let[messages,setMessages] = useState([]);

    let [message,setMessage] = useState("");

    let[newMessages,setNewMessages] = useState(3);

    let [askForUsername,setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");
    
    const videoRef = useRef([]);


    let [videos , setVideos] = useState([]);

    // if(isChrome() === false){
    //     //webRTC works only on chromium based browers like 
    //     // chrome ,ms edge,brave

    // }

    useEffect(()=>{
        console.log("HELLO");
        getPermissions();
    },[]);

    let routeTo = useNavigate();

    let getDisplayMediaSuccess = (stream) =>{
        try{
            window.localStream.getTracks.foEach(track=>track.stop())
        }catch(e){
            console.log(e);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections){
            if(id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description)=>[
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal",id,JSON.stringify({"sdp":connections[id].localDescription}))
                })
                .catch(e => console.log(e))
            ])
        }
        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream
            getUserMedia();
        })
    }
    let getDisplayMedia = () =>{
        if(screen){
            if(navigator.mediaDevices.getDisplayMedia){
                navigator.mediaDevices.getDisplayMedia({video:true,audio:true})
                .then(getDisplayMediaSuccess)
                .then((Stream) => { })
                .catch((e) => console.log(e))
            }
        }
    }

     const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };
    
     useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }
    }, [video, audio]);


    
    let getMedia = () =>{
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoRef.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }



    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }


  let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                
                console.log("FRONTEND user-joined called", id, clients);

                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

     let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
        // getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }

    useEffect(()=>{
        if(screen !== undefined){
            getDisplayMedia();
        }
    })
    let handleScreen = () =>{
        setScreen(!screen);
    } 

    let sendMessage = () =>{
        socketRef.current.emit("chat-message",message,username);
        setMessage("");
    }

    let handleEndCall = () =>{
        try{
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop())
        }catch(e){
            
        }
        routeTo("/home");
    }

     const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };


   
    let connect = () =>{
        setAskForUsername(false);
        getMedia();
        // getPermissions();
    }

    return (
    <div>
       {askForUsername ===true ?
       <div>
            <h2>Enter into Lobby</h2>
            <TextField id="outlined-basic" label="Username" variant="outlined" onChange={e=> setUsername(e.target.value)} />
            <Button variant="contained" onClick={connect}>Connect</Button>


            <div>
                <video ref={localVideoRef} autoPlay muted></video>
            </div>

        </div>:
        
        <div className={styles.meetVideoContainer}>
        
            {showModal ? <div className={styles.chatRoom}>
                <div className={styles.chatContainer}>    
                    <h1>Chat</h1>


                    <div className={styles.chattingDisplay}>
                        
                        {messages.length > 0 ? messages.map((item,index)=>{
                            return(
                                <div style={{marginBottom:"20px"}}  key={index}>
                                <p style={{fontWeight :"bold"}}>{item.sender}</p>
                                <p>{item.data}</p>

                                </div>
                            )
                        }):<p> No messages yet</p>}

                    </div>

                <div className={styles.chattingArea}>
                    <TextField id="outlined-basic" value={message} onChange={e => setMessage(e.target.value)} label="Enter your chat" variant="outlined" />
                    <Button variant='contained' onClick={sendMessage}>Send</Button>
                </div>


                </div>
            </div>:<></>}


        <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{color:"white"}}>
                {(video === true) ? <VideocamIcon/> : <VideocamOffIcon/> }
            </IconButton>

             <IconButton onClick={handleEndCall} style={{color:"white"}}>
                <CallEnd/>
             </IconButton>

             <IconButton onClick={handleAudio} style={{color:"white"}}>
                {(audio === true)? <MicOnIcon/> : <MicOffIcon/>}
             </IconButton>

             {screenAvailable ===true ?
             <IconButton onClick={handleScreen} style={{color:'white'}}>
                {(screen === true) ? <ScreenShareIcon/>:<StopScreenShareIcon/>}
             </IconButton>:<></>}

             <Badge badgeContent={newMessages} max={999} color='secondary'>
                <IconButton onClick={()=> setModal(!showModal)} style={{color:'white'}}>
                    <ChatIcon/>
                </IconButton>
             </Badge>
        </div>

     <div className={styles.conferenceView}>
        {videos.map((video) => (
            <VideoPlayer
                key={video.socketId}
                stream={video.stream}
                className={styles.remoteVideo}
                />
                 ))}
        </div>

        {/* Your Own Video */}
  <video
    ref={localVideoRef}
    autoPlay
    muted
    className={styles.localVideo}
  />
        </div>
    }  
    </div>
  )
}
