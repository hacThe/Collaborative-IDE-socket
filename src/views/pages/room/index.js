import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { Navigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Autocomplete, TextField, Button, Grid, Backdrop, CircularProgress, Collapse, IconButton, Divider, Container } from "@mui/material";
import { Box } from "@mui/system";
import {
  RemoteCursorManager,
  RemoteSelectionManager,
  EditorContentManager,
} from "@convergencelabs/monaco-collab-ext";
import { debounce } from "lodash";
import axios from "axios";
import Draggable from "react-draggable";
import Carousel from "nuka-carousel/lib/carousel";
import { KeyboardArrowLeftRounded, KeyboardArrowRightRounded } from "@mui/icons-material";
import UserAvatarBox from "./components/userAvatarBox";
import UserActionBar from "./components/userActionBar";
import SimplePeer from 'simple-peer';
import MainAvatarBox from "./components/mainAvatarBox";




const copyRightTemplate = `/*
  * Copyright (c) 2022 UIT KTPM2019
  * All rights reserved.
  * 19522496 Trần Lê Thanh Tùng
  * 19521743 Trương Kim Lâm
  * 19522252 Dương Hiển Thê
  */
 
 
  `;

const CURSOR_COLOR = {
  list: [
    "#FF0000",
    "#FFC0CB",
    "#FFA500",
    "#FFFF00",
    "#800080",
    "#008000",
    "#0000FF",
    "#A52A2A",
  ],
  default: "#808080",
};

const videoConstraint = {
  height: window.innerHeight / 2,
  width: window.innerWidth / 2
}


function CodeScreen(props) {
  var remoteCursorManager = null;
  var remoteSelectionManager = null;
  var contentManager = null;
  var socket = useRef(null)

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const usersRef = useRef(null);
  const { roomId } = useParams();
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [users, setUsers] = useState([]);
  const username = useSelector((state) => state.app).username;
  const [compileState, setCompileState] = useState(false)

  const compilerLanguages = useRef([])
  const [languageList, setLanguageList] = useState([]);
  const versionList = useRef([])
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(0);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [editorLanguage, setEditorLanguage] = useState(null);
  const peersRef = useRef([])
  const [peers, setPeers] = useState([])
  const userVideo = useRef(null)
  const [peerStreams, setPeerStreams] = useState([])
  const peerStreamsRef = useRef([])

  const AVATAR_BOX_WIDTH = 200;
  const AVATAR_BOX_HEIGHT = 150;
  const AVATAR_BOX_SPACING = 10;
  const MAX_AVATAR_SHOW = 3;

  const editorUIRef = useRef(null);
  const [editorBounds, setEditorBounds] = useState(null)

  const communicateBoxRef = useRef(null)
  const [communicateBoxWidth, setCommunicateBoxWidth] = useState(null)
  const [communicateBoxHeight, setCommunicateBoxHeight] = useState(null)

  const [expandVoiceTab, setExpandVoiceTab] = useState(true)

  useEffect(() => {
    if (!editorUIRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setEditorBounds(editorUIRef.current.getBoundingClientRect())
    });

    resizeObserver.observe(editorUIRef.current);

    return () => resizeObserver.disconnect();
  }, [])

  useEffect(() => {
    if (!communicateBoxRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setCommunicateBoxWidth(communicateBoxRef.current.clientWidth)
      setCommunicateBoxHeight(communicateBoxRef.current.clientHeight)
    });

    resizeObserver.observe(communicateBoxRef.current);

    return () => resizeObserver.disconnect();
  }, [])

  useEffect(() => {
    axios
      .get(`http://localhost:3001/compiler/get-programming-languages`)
      .then((response) => {
        const fetchCompilerLanguages = response.data.result;
        compilerLanguages.current = fetchCompilerLanguages
        setLanguageList(fetchCompilerLanguages.map((item) => item.name));
        versionList.current = fetchCompilerLanguages[selectedLanguageIndex].versions
      })
      .catch((error) => {
        console.log(`Error when get compiler languages\n ${error}`);
        // TODO: handle error
      });
  }, [])

  useEffect(() => {
    socket.current = io("http://localhost:3001", {
      transports: ["websocket"],
    });

    socket.current.on("CODE_INSERT", (data) => {
      contentManager.insert(data.index, data.text);
    });

    socket.current.on("CODE_REPLACE", (data) => {
      contentManager.replace(data.index, data.length, data.text);
    });

    socket.current.on("CODE_DELETE", (data) => {
      contentManager.delete(data.index, data.length);
    });

    socket.current.on("CURSOR_CHANGED", (cursorData) => {
      remoteCursorManager.setCursorOffset(cursorData.name, cursorData.offset);
    });

    socket.current.on("SELECTION_CHANGED", (selectionData) => {
      remoteSelectionManager.setSelectionOffsets(
        selectionData.name,
        selectionData.startOffset,
        selectionData.endOffset
      );
    });

    socket.current.on("CODE_CHANGED", (code) => {
      setCode(code);
    });

    socket.current.on("OUTPUT_CHANGED", (output) => {
      setOutput(output);
    });

    socket.current.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket.current.on("connect", () => {
      socket.current.emit("CONNECTED_TO_ROOM", { roomId, username });
    });

    socket.current.on("ROOM:CONNECTION", (data) => {
      setUsers(data.users);
      usersRef.current = data.users;
      addUserCursor(data.newUserId);
    });

    socket.current.on("ROOM:DISCONNECT", (userId) => {
      const users = usersRef.current.filter((item) => item.id !== userId);
      setUsers(users);
      removeUserCursor(userId);
      usersRef.current = users;
      // remove peer
    });

    socket.current.on('CHANGE_LANGUAGE', (newLanguage) => {
      const index = compilerLanguages.current.findIndex((item) => item.name === newLanguage);
      setSelectedLanguageIndex(index);
      if (index !== selectedLanguageIndex) {
        setSelectedVersionIndex(0);
        versionList.current = index !== -1 ? compilerLanguages.current[index].versions : []
      }
      changeEditorLanguage(compilerLanguages.current[index].languageCode);
    })

    socket.current.on('CHANGE_VERSION', (newVersionIndex) => {
      setSelectedVersionIndex(newVersionIndex);
    })

    socket.current.on('COMPILE_STATE_CHANGED', (compileState) => setCompileState(compileState))

    navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: true }).then(stream => {
      userVideo.current.srcObject = stream
      socket.current.emit('CONNECTED_TO_ROOM_MEDIA', { roomId })
      socket.current.on('ALL_USERS', (users) => {
        const temptPeers = []
        users.forEach(userId => {
          const peer = createPeer(userId, socket.current.id, stream)
          peersRef.current.push({
            peerId: userId,
            peer
          })
          temptPeers.push(peer)
        });
        setPeers(temptPeers)
      })

      socket.current.on('ROOM:CONNECTION_MEDIA', ({ signal, callerID }) => {
        const peer = addPeer(signal, callerID, stream)
        setPeers(users => [...users, peer])
        peersRef.current.push({
          peerId: callerID,
          peer
        })
      })

      socket.current.on('RECEIVE_RETURN_SIGNAL', ({ signal, id }) => {
        const item = peersRef.current.find(p => p.peerId === id)
        item.peer.signal(signal)
      })

      socket.current.on('ROOM:DISCONNECTION_MEDIA', (userId) => {
        var removePeer = peersRef.current.find(p => p.peerId === userId)
        if (removePeer) {
          removePeer.peer.destroy()
        }
        var remainPeers = peersRef.current.filter(item => item.peerId !== userId)
        peersRef.current = remainPeers
        setPeers(remainPeers.map(item => item.peer))

        var remainStreams = peerStreamsRef.current.filter(s => s.peerId !== userId)
        peerStreamsRef.current = remainStreams
        setPeerStreams(remainStreams.map(i => i.stream))
      })

    })

    return () => {
      socket.current.off("CODE_INSERT");
      socket.current.off("CODE_REPLACE");
      socket.current.off("CODE_DELETE");
      socket.current.off("CURSOR_CHANGED");
      socket.current.off("SELECTION_CHANGED");
      socket.current.off("CODE_CHANGED");
      socket.current.off("OUTPUT_CHANGED");
      socket.current.off("connect_error");
      socket.current.off("connect");
      socket.current.off("ROOM:CONNECTION");
      socket.current.off("ROOM:DISCONNECT");
      socket.current.off('CHANGE_LANGUAGE')
      socket.current.off('CHANGE_VERSION')
      socket.current.off('COMPILE_STATE_CHANGED')
    };
  }, []);

  function createPeer(userToSignal, callerID, stream) {
    console.log('function create peer')
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    })

    peer.on('signal', signal => {
      socket.current.emit('SIGNAL_SENT', { userToSignal, callerID, signal })
    })

    peer.on('stream', stream => {
      peerStreamsRef.current.push({
        peerId: userToSignal
        ,stream})
      setPeerStreams(old => [...old, stream])
    })

    return peer
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    })

    peer.on('signal', signal => {
      socket.current.emit('SIGNAL_RETURN', { signal, callerID })
    })

    peer.on('stream', stream => {
      peerStreamsRef.current.push({peerId: callerID, stream})
      setPeerStreams(old => [...old, stream])
    })

    peer.signal(incomingSignal)
    return peer
  }

  function removeUserCursor(oldUserId) {
    const users = usersRef.current;
    if (remoteCursorManager && remoteSelectionManager) {
      remoteCursorManager.removeCursor(oldUserId);
      remoteSelectionManager.removeSelection(oldUserId);

      const oldUserIndex = users.findIndex((item) => item.id === oldUserId);
      if (oldUserIndex > -1 && oldUserIndex < CURSOR_COLOR.list.length) {
        const oldCursorColor = CURSOR_COLOR.list[oldUserIndex];
        CURSOR_COLOR.list.splice(oldUserIndex, 1)
        CURSOR_COLOR.list.push(oldCursorColor);
      }
    }
  }

  function addUserCursor(newUserId) {
    const users = usersRef.current;
    if (remoteCursorManager && remoteSelectionManager) {
      const newUserIndex = users.findIndex((item) => item.id === newUserId);
      const newUser = users[newUserIndex];

      var cursorColor;
      if (newUserIndex < CURSOR_COLOR.list.length) {
        cursorColor = CURSOR_COLOR.list.pop()
        CURSOR_COLOR.list.unshift(cursorColor)
      } else {
        cursorColor = CURSOR_COLOR.default
      }

      if (newUserId !== socket.current.id) {
        remoteCursorManager.addCursor(
          newUser.id,
          cursorColor,
          newUser.username
        );
        remoteSelectionManager.addSelection(
          newUser.id,
          cursorColor,
          newUser.username
        );

      }
    }
  }


  if (!username) return <Navigate to="/" replace />;



  function addInitialCursors() {
    const users = usersRef.current;

    for (let i in users) {
      let user = users[users.length - i - 1];

      var cursorColor;
      if (i < CURSOR_COLOR.list.length) {
        cursorColor = CURSOR_COLOR.list.pop()
        CURSOR_COLOR.list.unshift(cursorColor)
      } else {
        cursorColor = CURSOR_COLOR.default
      }

      if (user.id !== socket.current?.id) {
        remoteCursorManager.addCursor(user.id, cursorColor, user.username);
        remoteSelectionManager.addSelection(
          user.id,
          cursorColor,
          user.username
        );
      }
    }
  }

  function handleOnMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    changeEditorLanguage(compilerLanguages.current[selectedLanguageIndex].languageCode);

    remoteCursorManager = new RemoteCursorManager({
      editor: editor,
      tooltips: true,
      tooltipDuration: 1,
      showTooltipOnHover: true,
    });

    remoteSelectionManager = new RemoteSelectionManager({ editor: editor });

    contentManager = new EditorContentManager({
      editor: editor,
      onInsert(index, text) {
        const data = { index: index, text: text };
        socket.current?.emit("CODE_INSERT", { roomId, data });
      },
      onReplace(index, length, text) {
        const data = { index: index, length: length, text: text };
        socket.current?.emit("CODE_REPLACE", { roomId, data });
      },
      onDelete(index, length) {
        const data = { index: index, length: length };
        socket.current?.emit("CODE_DELETE", { roomId, data });
      },
    });

    addInitialCursors();

    editor.onDidChangeCursorPosition((e) => {
      const offset = editor.getModel().getOffsetAt(e.position);
      const cursorData = { name: socket.current.id, offset: offset };

      socket.current?.emit("CURSOR_CHANGED", { roomId, cursorData });
    });

    editor.onDidChangeCursorSelection((e) => {
      const startOffset = editor
        .getModel()
        .getOffsetAt(e.selection.getStartPosition());
      const endOffset = editor
        .getModel()
        .getOffsetAt(e.selection.getEndPosition());
      const selectionData = {
        name: socket.current.id,
        startOffset: startOffset,
        endOffset: endOffset,
      };

      socket.current?.emit("SELECTION_CHANGED", { roomId, selectionData });
    });
  }

  const handleOnchange = debounce((value) => {
    if (code === value) {
      return;
    }

    setCode(value);
    axios
      .post("http://localhost:3001/data/save", {
        roomId: roomId,
        code: value,
      })
      .then((_) => console.log("Save code successfully"))
      .catch((error) => {
        console.log(`Error when save code\n ${error}`);
        // TODO: handle error
      });
  }, 500);

  async function handleRunCompiler() {
    setCompileState(true)
    socket.current?.emit('COMPILE_STATE_CHANGED', { roomId, state: true })

    axios.post("http://localhost:3001/compiler/execute", {
      script: code,
      language: compilerLanguages.current[selectedLanguageIndex].name,
      version:
        compilerLanguages.current[selectedLanguageIndex].versions[selectedVersionIndex],
    }).then((res) => {
      const output = res.data.output;
      setOutput(output);
      setCompileState(false)
      socket.current?.emit("OUTPUT_CHANGED", { roomId, output });
      socket.current?.emit('COMPILE_STATE_CHANGED', { roomId, state: false })
    })

  }

  function changeEditorLanguage(languageCode) {
    switch (languageCode) {
      case "nodejs":
        setEditorLanguage("javascript");
        break;
      default:
        setEditorLanguage(null);
        var oldModel = editorRef.current.getModel();
        var newModel = monacoRef.current.editor.createModel(oldModel.getValue(), languageCode.replace(/[0-9]/g, ''));
        editorRef.current.setModel(newModel);
        if (oldModel) {
          oldModel.dispose();
        }
        break;
    }
  }

  function handleOnLanguageChange(event, value) {
    console.log('onChangeLanguage function')
    const index = compilerLanguages.current.findIndex((item) => item.name === value);
    setSelectedLanguageIndex(index);
    if (index !== selectedLanguageIndex) {
      setSelectedVersionIndex(0);
      versionList.current = index !== -1 ? compilerLanguages.current[index].versions : []
    }
    changeEditorLanguage(compilerLanguages.current[index].languageCode);

    socket.current?.emit('CHANGE_LANGUAGE', {
      'roomId': roomId,
      'newLanguage': value
    })
  }

  function handleOnLanguageVersionChange(event, value) {
    const newIndex = versionList.current.indexOf(value)
    setSelectedVersionIndex(newIndex);
    socket.current?.emit('CHANGE_VERSION', {
      'roomId': roomId,
      'newVersionIndex': newIndex
    })
  }

  function turnOnOffCamera() {
    for (let index in userVideo.current.srcObject.getVideoTracks()) {
      userVideo.current.srcObject.getVideoTracks()[index].enabled = !userVideo.current.srcObject.getVideoTracks()[index].enabled
    }
  }

  function turnOnOffMicrophone() {
    for (let index in userVideo.current.srcObject.getAudioTracks()) {
      userVideo.current.srcObject.getAudioTracks()[index].enabled = !userVideo.current.srcObject.getAudioTracks()[index].enabled
    }
  }

  function isUserTurnOnCamera() {
    var tracks = userVideo.current.srcObject.getVideoTracks()
    if (tracks.length !== 0) {
      return tracks[0].enabled
    }
    return false
  }

  function isUserTurnOnMicrophone() {
    var tracks = userVideo.current.srcObject.getAudioTracks()
    if (tracks.length !== 0) {
      return tracks[0].enabled
    }
    return false
  }

  return (
    <>
      <Grid container>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={compileState}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Grid item xs={9}
          ref={editorUIRef}>
          <Draggable 
            handle="#draggableHandler"
            bounds={{
              left: editorBounds?.left,
              top: editorBounds?.top,
              right: editorBounds?.right - communicateBoxWidth,
              bottom: editorBounds?.bottom - communicateBoxHeight,
            }}>
            <Box
              ref={communicateBoxRef}
              sx={{
                top: "0px",
                left: "0px",
                position: "absolute",
                minWidth: "150px",
                zIndex: 1,
                boxShadow: 1,
              }}>
              <UserActionBar
                id="draggableHandler"
                width={communicateBoxWidth - AVATAR_BOX_SPACING}
                onCollapsed={(collapsed) => {
                  setExpandVoiceTab(!collapsed)
                }}
                onCamera={turnOnOffCamera}
                onMic={turnOnOffMicrophone} />
              <Collapse in={expandVoiceTab}>
                <div 
                  style={{
                    display: "flex",
                    flexDirection: "row",
                  }}>
                  <MainAvatarBox 
                    id="userVideo" 
                    name="You" 
                    color={CURSOR_COLOR.default}
                    height={AVATAR_BOX_HEIGHT}
                    width={AVATAR_BOX_WIDTH}
                    videoRef={userVideo}/>
                  <Divider 
                    sx={{
                      margin: "54px 8px 54px 8px",
                      width: "1px",
                      backgroundColor: "#FFFFFF15",
                    }}
                  />
                  <Box
                    sx={{
                      display: peers.length > 0 ? "inline" : "none",
                      width: (AVATAR_BOX_WIDTH + AVATAR_BOX_SPACING) * (peers.length < MAX_AVATAR_SHOW ? peers.length : MAX_AVATAR_SHOW),
                    }}>
                      <Carousel
                      sx={{
                        position: "relative",
                      }}
                      renderBottomCenterControls="null"
                      renderCenterLeftControls={({ previousDisabled, previousSlide }) => (
                        <IconButton sx={{ left: "0px" }} onClick={previousSlide} disabled={previousDisabled}>
                          <KeyboardArrowLeftRounded />
                        </IconButton>
                      )}
                      renderCenterRightControls={({ nextDisabled, nextSlide }) => (
                        <IconButton sx={{ right: AVATAR_BOX_SPACING }} onClick={nextSlide} disabled={nextDisabled}>
                          <KeyboardArrowRightRounded />
                        </IconButton>
                      )}
                      slidesToShow={peers.length < MAX_AVATAR_SHOW ? peers.length : MAX_AVATAR_SHOW}
                      scrollMode="remainder">
                      {/* <UserAvatarBox 
                        color="#A545EE" 
                        name="Trương Kim Lâm"
                        width={AVATAR_BOX_WIDTH}
                        height={AVATAR_BOX_HEIGHT}
                        />
                      <UserAvatarBox 
                        color="#F85212" 
                        name="Trần Lê Thanh Tùng"
                        width={AVATAR_BOX_WIDTH}
                        height={AVATAR_BOX_HEIGHT}
                        />
                      <UserAvatarBox 
                        color="#355FFA" 
                        name="Dương Hiển Thế"
                        width={AVATAR_BOX_WIDTH}
                        height={AVATAR_BOX_HEIGHT}
                        /> */}
                      {peers.map((p, index) => {
                        var userId = peersRef.current[index].peerId
                        var username = usersRef.current.find(u => u.id === userId).username
                        const stream = peerStreams[index]

                        

                        return UserAvatarBox({ stream: stream,  id: userId, name: username, color: CURSOR_COLOR.default, width: AVATAR_BOX_WIDTH, height: AVATAR_BOX_HEIGHT, peer: p, })
                      })}
                    </Carousel>
                  </Box>
                </div>
              </Collapse>
            </Box>
          </Draggable>
          <Editor
            sx={{ zIndex: 0, }}
            height="100vh"
            value={code}
            defaultLanguage="undefined"
            language={editorLanguage}
            defaultValue={copyRightTemplate + code}
            onChange={handleOnchange}
            onMount={handleOnMount}
            theme="vs-dark"
            options={{
              cursorBlinking: "blink",
              cursorStyle: "line",
              fixedOverflowWidgets: "true",
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <Box
            sx={{
              background: "#1e1e1e",
              padding: "24px",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
            }}
          >
            <Box>
              <h3>
                Username: <strong>{username}</strong>
              </h3>
              <h3>
                Room Id: <strong>{roomId}</strong>{" "}
                <span
                  style={{ display: "inline-block" }}
                  onClick={() => {
                    navigator.clipboard.writeText(roomId);
                  }}
                  className="icon right"
                >
                  <img
                    src="http://clipground.com/images/copy-4.png"
                    title="Click to Copy"
                    alt="Copy room id"
                  />
                </span>
              </h3>
              <h3>
                Room members: <strong> {users.length}</strong>
              </h3>
            </Box>

            <Autocomplete
              disableClearable
              id="compiler-language"
              options={languageList}
              sx={{
                marginTop: "12px",
                ".MuiOutlinedInput-root": {
                  borderColor: "white",
                  borderWidth: 10,
                },
              }}
              onChange={handleOnLanguageChange}
              value={languageList[selectedLanguageIndex] ?? ""}
              renderInput={(params) => (
                <TextField {...params} label="Languages" />
              )}
            />

            <Autocomplete
              disableClearable
              id="compiler-language-version"
              options={versionList.current}
              sx={{ marginTop: "12px" }}
              onChange={handleOnLanguageVersionChange}
              value={versionList.current[selectedVersionIndex] ?? ""}
              renderInput={(params) => (
                <TextField {...params} label="Language versions" />
              )}
            />

            {/* <Box sx={{ marginTop: "12px" }}>
              <Button
                variant="contained"
                fullWidth={true}
                size="small"
                onClick={handleRunCompiler}>
                Save compiler language
              </Button>
            </Box> */}
            <Box sx={{ marginTop: "24px" }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth={true}
                onClick={handleRunCompiler}
              >
                Run
              </Button>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                marginTop: "24px",
              }}
            >
              {/* <Box sx={{ flex: 1 }}>
                <h4>Input</h4>
                <textarea></textarea>
              </Box> */}

              <Box sx={{ flex: 1 }}>
                <h4>Output</h4>
                <Box
                  className={
                    output === "" ? "result-banner" : "active-result-banner"
                  }
                  sx={{ overflow: "auto", height: "32vh" }}
                >
                  <p>{output === "" ? "This is result banner" : output}</p>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );


  // return (
  //   <Container
  //     padding='20px'
  //     display='flex'
  //     height='100vh'
  //     width='90%'
  //     margin='auto'
  //     flex-wrap='wrap'
  //   >
  //     <h3>
  //       Room Id: <strong>{roomId}</strong>{" "}
  //       <span
  //         style={{ display: "inline-block" }}
  //         onClick={() => {
  //           navigator.clipboard.writeText(roomId);
  //         }}
  //         className="icon right"
  //       >
  //         <img
  //           src="http://clipground.com/images/copy-4.png"
  //           title="Click to Copy"
  //           alt="Copy room id"
  //         />
  //       </span>
  //     </h3>
  //     <video
  //       id="userVideo"
  //       height='40%'
  //       width='50%'
  //       muted ref={userVideo} autoPlay playsInline
  //     />
  //     {peers.map((peer, index) => {
  //       const stream = peerStreams[index]

  //       return <Video id={`remote ${index}`} key={index} peer={peer} stream={stream} />
  //     })}
  //     <Button onClick={turnOnOffCamera}>Turn on/off camera</Button>
  //     <Button onClick={turnOnOffMicrophone}>Turn on/off mic</Button>
  //   </Container>
  // );
}

// const Video = (props) => {
//   const [stream, setStream] = useState(null)
//   const videoRef = useRef(null)

//   useEffect(() => {
//     console.log(props.stream)
//     videoRef.current.srcObject = props.stream
//   }, [props.stream])

//   return (
//       <video
//           id={props.id}
//           style={{ objectFit: 'cover', zIndex: 1, position: 'absolute', top: 0, left: 0 }}
//           height={150}
//           width={200}
//           autoPlay
//           playsInline
//           ref={videoRef}
//       />
//   )
// }

export default CodeScreen;
