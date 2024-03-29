import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Autocomplete, TextField, Button, Grid, Backdrop, CircularProgress, Collapse, IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from "@mui/material";
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
import MainAvatarBox from "../../common_components/mainAvatarBox";
import BasicTabs from "./components/tabBar";
import "react-chat-elements/dist/main.css"
import { MessageList, Input } from 'react-chat-elements/build/index';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import hark from "hark"
import scrollMessageListToBottom from "./utility";
import { BASE_BACKEND_URL, GET_COMPILER_LANGUAGE_URL, RUN_COMPILER_URL, SAVE_CODE_URL } from "../../../constants";
import UserPalette from "./components/palette";
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import ErrorDialog from "../../common_components/error_dialog";

const configuration = {
  // Using From https://www.metered.ca/tools/openrelay/
  "iceServers": [
    {
      urls: "stun:openrelay.metered.ca:80"
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
}

const USER_DEFAULT_COLOR = "#808080";

const videoConstraint = {
  height: window.innerHeight / 2,
  width: window.innerWidth / 2
}


function CodeScreen({ username }) {
  const navigate = useNavigate();

  var remoteCursorManager = null;
  var remoteSelectionManager = null;
  var contentManager = null;
  var socket = useRef(null)
  var isSetInitial = false

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const usersRef = useRef([]);
  const { roomId } = useParams();
  const [initialCode, setInitialCode] = useState("");
  const code = useRef("")
  const [output, setOutput] = useState("");
  const [users, setUsers] = useState([]);
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
  const localStream = useRef(null)
  const [speakingUsers, setSpeakingUsers] = useState([])

  const AVATAR_BOX_WIDTH = 200;
  const AVATAR_BOX_HEIGHT = 150;
  const AVATAR_BOX_SPACING = 10;
  const EDITOR_BOUND_PADDING = 8;
  const [maxAvatarShow, setMaxAvatarShow] = useState(3);

  const editorUIRef = useRef(null);
  const [editorBounds, setEditorBounds] = useState(null)

  const communicateBoxRef = useRef(null)
  const [communicateBoxWidth, setCommunicateBoxWidth] = useState(null)
  const [communicateBoxHeight, setCommunicateBoxHeight] = useState(null)

  const communicateBoxPositionRef = useRef({ x: 0, y: 0 })
  const [communicateBoxPosition, setCommunicateBoxPosition] = useState({ x: 0, y: 0 })

  const [expandVoiceTab, setExpandVoiceTab] = useState(true)
  const [micState, setMicState] = useState(true)
  const [camState, setCamState] = useState(true)
  const inputRef = useRef(null)

  const [userColors, setUserColors] = useState({})
  const userColorsRef = useRef({})

  const [messageList, setMessageList] = useState([])
  const [isDotInvisible, setDotInvisible] = useState(true)
  const tabIndexRef = useRef(0)

  const someOneChangeCode = useRef(false)
  const location = useLocation()

  const [openTemplateDialog, setOpenTemplateDialog] = useState(false)
  const newLanguageValueRef = useRef(null)
  const [isShowDialog, setShowDialog] = useState(false)
  const errorMessageRef = useRef(null)

  useEffect(() => {
    if (!editorUIRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const editorBounds = editorUIRef.current.getBoundingClientRect()
      const lastPosition = communicateBoxPositionRef.current
      const communicateBoxSize = communicateBoxRef.current
      setEditorBounds(editorBounds)
      const newX = lastPosition.x + communicateBoxSize.clientWidth > editorBounds.right
        ? editorBounds.right - communicateBoxSize.clientWidth - EDITOR_BOUND_PADDING : lastPosition.x
      const newY = lastPosition.y + communicateBoxSize.clientHeight > editorBounds.bottom
        ? editorBounds.bottom - communicateBoxSize.clientHeight - EDITOR_BOUND_PADDING : lastPosition.y;
      setCommunicateBoxPosition({
        x: newX,
        y: newY
      })

      const newMaxAvatarShow = editorUIRef.current.clientWidth / (AVATAR_BOX_WIDTH + AVATAR_BOX_SPACING) - 2;
      setMaxAvatarShow(newMaxAvatarShow < 0 ? 0 : newMaxAvatarShow)
    });

    resizeObserver.observe(editorUIRef.current);

    return () => resizeObserver.disconnect();
  }, [])

  useEffect(() => {
    if (!communicateBoxRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setCommunicateBoxWidth(communicateBoxRef.current.clientWidth)
      setCommunicateBoxHeight(communicateBoxRef.current.clientHeight)

      const editorBounds = editorUIRef.current.getBoundingClientRect()
      const lastPosition = communicateBoxPositionRef.current
      const communicateBoxSize = communicateBoxRef.current
      const newX = lastPosition.x + communicateBoxSize.clientWidth > editorBounds.right
        ? editorBounds.right - communicateBoxSize.clientWidth - EDITOR_BOUND_PADDING : lastPosition.x
      const newY = lastPosition.y + communicateBoxSize.clientHeight > editorBounds.bottom
        ? editorBounds.bottom - communicateBoxSize.clientHeight - EDITOR_BOUND_PADDING : lastPosition.y;
      setCommunicateBoxPosition({
        x: newX,
        y: newY
      })
    });

    resizeObserver.observe(communicateBoxRef.current);

    return () => resizeObserver.disconnect();
  }, [])

  useEffect(() => {
    axios
      .get(GET_COMPILER_LANGUAGE_URL)
      .then((response) => {
        const fetchCompilerLanguages = response.data.result;
        compilerLanguages.current = fetchCompilerLanguages
        setLanguageList(fetchCompilerLanguages.map((item) => item.name));
        versionList.current = fetchCompilerLanguages[selectedLanguageIndex].versions
        // setLanguageTemplate(fetchCompilerLanguages[selectedLanguageIndex].template)
        code.current = fetchCompilerLanguages[selectedLanguageIndex].template
        setInitialCode(fetchCompilerLanguages[selectedLanguageIndex].template)
      })
      .catch((error) => {
        console.log(`Error when get compiler languages\n ${error}`);
        // TODO: handle error
      });
  }, [])

  useEffect(() => {
    socket.current = io(BASE_BACKEND_URL, {
      transports: ["polling", "websocket"],
    });

    socket.current.on("CODE_INSERT", (data) => {
      someOneChangeCode.current = true
      contentManager.insert(data.index, data.text);
    });

    socket.current.on("CODE_REPLACE", (data) => {
      someOneChangeCode.current = true
      contentManager.replace(data.index, data.length, data.text);
    });

    socket.current.on("CODE_DELETE", (data) => {
      someOneChangeCode.current = true
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

    socket.current.on("CODE_CHANGED", (newCode) => {
      code.current = newCode
      setInitialCode(newCode)
      someOneChangeCode.current = true
    });

    socket.current.on("COLOR_CHANGED", async (data) => {
      const userToColor = data.userToColor
      const userId = data.userId
      setUserColors(userToColor)
      userColorsRef.current = userToColor

      await remoteCursorManager.removeCursor(userId)
      await remoteSelectionManager.removeSelection(userId)
      addUserCursor(userId, userToColor[userId])
    })

    socket.current.on("OUTPUT_CHANGED", (output) => {
      setOutput(output);
    });

    socket.current.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket.current.on("connect", () => {
      // socket.current.emit("CONNECTED_TO_ROOM", { roomId, username });
    });

    socket.current.on("ROOM:CONNECTION", (data) => {
      setUsers(data.users);
      usersRef.current = data.users;
      setUserColors(data.userColors)
      userColorsRef.current = data.userColors

      if (!isSetInitial) {
        addInitialCursors(data.userColors)
        isSetInitial = true
      } else {
        addUserCursor(data.newUserId, data.userColors[data.newUserId]);
      }
    });

    socket.current.on("ROOM:DISCONNECT", (userId) => {
      const users = usersRef.current.filter((item) => item.id !== userId);
      setUsers(users);
      removeUserCursor(userId);
      usersRef.current = users;

      delete userColorsRef.current[userId];
      setUserColors(userColorsRef.current);
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

    socket.current.on('CHAT_MESSAGE', ({ senderName, message, date }) => {
      addMessage(senderName, message, date, false)
      tabIndexRef.current === 1 ? setDotInvisible(true) : setDotInvisible(false)
    })

    socket.current.on('LOAD_ROOM_MESSAGES', roomMessages => {
      roomMessages = roomMessages.map((e, index) => {
        const userId = usersRef.current.find(item => item.username === e.username).id
        const messageDateTime = e.date
        const messageEntity = {
          position: 'left',
          type: "text",
          title: e.username,
          text: e.message,
          titleColor: userId ? userColorsRef.current[userId] : USER_DEFAULT_COLOR,
        }

        const now = new Date().setHours(0, 0, 0, 0)
        if (messageDateTime < now) {
          messageEntity.dateString = _createDateFormat(messageDateTime)
        } else {
          messageDateTime.date = messageDateTime
        }

        return messageEntity
      })

      setMessageList(roomMessages)
    })

    socket.current.on('LISTEN_TO_SPEAKER', ({ userId, isSpeaking }) => {
      if (isSpeaking) {
        setSpeakingUsers(old => [...old, userId])
      } else {
        setSpeakingUsers(speakingUsers.filter(id => id !== userId))
      }
    })

    socket.current.on('DB_ERROR', (message) => {
      showErrorDialog(message)
    })


    return () => {
      socket.current.off("CODE_INSERT");
      socket.current.off("CODE_REPLACE");
      socket.current.off("CODE_DELETE");
      socket.current.off("CURSOR_CHANGED");
      socket.current.off("SELECTION_CHANGED");
      socket.current.off("CODE_CHANGED");
      socket.current.off("COLOR_CHANGED");
      socket.current.off("OUTPUT_CHANGED");
      socket.current.off("connect_error");
      socket.current.off("connect");
      socket.current.off("ROOM:CONNECTION");
      socket.current.off("ROOM:DISCONNECT");
      socket.current.off('CHANGE_LANGUAGE')
      socket.current.off('CHANGE_VERSION')
      socket.current.off('COMPILE_STATE_CHANGED')
      socket.current.off('ALL_USERS')
      socket.current.off('ROOM:CONNECTION_MEDIA')
      socket.current.off('RECEIVE_RETURN_SIGNAL')
      socket.current.off('ROOM:DISCONNECTION_MEDIA')
      socket.current.off('SOMEONE_TOGGLE_MICROPHONE')
      socket.current.off('SOMEONE_TOGGLE_CAMERA')
      socket.current.off('CHAT_MESSAGE')
      socket.current.off('LOAD_ROOM_MESSAGES')
      socket.current.off('LISTEN_TO_SPEAKER')
      socket.current.off('DB_ERROR')
    };
  }, []);

  useEffect(() => {
    const initialMicState = location.state?.micState ?? true
    const initialCamState = location.state?.camState ?? true

    initUserMedia(initialMicState, initialCamState)
  }, [])

  useEffect(() => {
    scrollMessageListToBottom()
  }, [messageList])

  useEffect(() => {
    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          if (track.readyState === "live") {
            track.stop();
          }
        })
      }
      userVideo.current = null
      localStream.current = null
    }
  }, [])

  function initUserMedia(initMicState, initCamState) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      userVideo.current.srcObject = stream
      localStream.current = stream

      if (!initMicState) {
        turnOnOffMicrophone()
      }

      if (!initCamState) {
        turnOnOffCamera()
      }

      var speechEvent = hark(localStream.current, {})

      speechEvent.on('speaking', () => {
        setSpeakingUsers(old => [...old, socket.current.id])
        socket.current.emit('LISTEN_TO_SPEAKER', { roomId, isSpeaking: true })
      })

      speechEvent.on('stopped_speaking', () => {
        setSpeakingUsers(speakingUsers.filter(id => id !== socket.current.id))
        socket.current.emit('LISTEN_TO_SPEAKER', { roomId, isSpeaking: false })
      })

      socket.current.emit('CONNECTED_TO_ROOM_MEDIA', { roomId })
      socket.current.on('ALL_USERS', (users) => {
        const temptPeers = []
        users.forEach(user => {
          const peer = createPeer(user.id, socket.current.id, localStream.current)
          peersRef.current.push({
            peerId: user.id,
            peer,
            micState: user.micState,
            camState: user.camState,
          })
          temptPeers.push({ peer, micState: user.micState, camState: user.camState })
        });
        setPeers(temptPeers)
      })

      socket.current.on('ROOM:CONNECTION_MEDIA', ({ signal, callerID }) => {
        const peer = addPeer(signal, callerID, localStream.current)
        setPeers(users => [...users, { peer, micState: true, camState: true }])
        peersRef.current.push({
          peerId: callerID,
          peer,
          micState: true,
          camState: true
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

      socket.current.on('SOMEONE_TOGGLE_MICROPHONE', ({ userId, micState }) => {
        var peerIndex = peersRef.current.findIndex(p => p.peerId === userId)

        var newList = peersRef.current.map((p, index) => {
          if (index === peerIndex) {
            p.micState = micState
          }
          return { peer: p.peer, micState: p.micState, camState: p.camState }
        })
        setPeers(newList)
      })

      socket.current.on('SOMEONE_TOGGLE_CAMERA', ({ userId, camState }) => {
        var peerIndex = peersRef.current.findIndex(p => p.peerId === userId)

        var newList = peersRef.current.map((p, index) => {
          if (index === peerIndex) {
            p.camState = camState
          }
          return { peer: p.peer, micState: p.micState, camState: p.camState }
        })
        setPeers(newList)
      })
    }).catch(err => {
      console.log(err)
      showErrorDialog('Can\'t start your webcam. Please reload your browser')
    })
  }

  function sendChatMessage() {
    if (inputRef.current.value === '') return
    const sendDate = Date()

    addMessage(username, inputRef.current.value, sendDate, true)
    socket.current.emit('CHAT_MESSAGE', {
      'username': username,
      roomId,
      'message': inputRef.current.value,
      'date': sendDate,
    })
    inputRef.current.value = ''
  }

  function createPeer(userToSignal, callerID, stream) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: configuration
    })

    peer.on('signal', signal => {
      socket.current.emit('SIGNAL_SENT', { userToSignal, callerID, signal })
    })

    peer.on('stream', stream => {
      peerStreamsRef.current.push({
        peerId: userToSignal
        , stream
      })
      setPeerStreams(old => [...old, stream])
    })

    peer.on('track', (track, stream) => {
      if (track.kind === 'audio') {
        track.addEventListener('mute', (event) => {
          console.log('event mute')
        })

        track.addEventListener('unmute', (event) => {
          console.log('event unmute')
        })
      }
    })

    return peer
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
      config: configuration
    })

    peer.on('signal', signal => {
      socket.current.emit('SIGNAL_RETURN', { signal, callerID })
    })

    peer.on('stream', stream => {
      peerStreamsRef.current.push({ peerId: callerID, stream })
      setPeerStreams(old => [...old, stream])
    })

    peer.on('track', (track, stream) => {
      console.log(track)
    })


    peer.signal(incomingSignal)
    return peer
  }

  function removeUserCursor(oldUserId) {
    if (remoteCursorManager && remoteSelectionManager) {
      remoteCursorManager.removeCursor(oldUserId);
      remoteSelectionManager.removeSelection(oldUserId);
    }
  }

  function addUserCursor(newUserId, cursorColor) {
    const users = usersRef.current;
    if (remoteCursorManager && remoteSelectionManager) {
      const newUserIndex = users.findIndex((item) => item.id === newUserId);
      const newUser = users[newUserIndex];

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


  // if (!username) return <Navigate to="/" replace />;



  function addInitialCursors(userColors) {
    const users = usersRef.current;

    for (let i in users) {
      let user = users[users.length - i - 1];

      if (user.id !== socket.current?.id) {
        const cursorColor = userColors[user.id]
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

    if (compilerLanguages.current) {
      changeEditorLanguage(compilerLanguages.current[selectedLanguageIndex].languageCode);
    }

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
        if (isSetInitial) { return }
        socket.current?.emit("CODE_REPLACE", { roomId, data });
      },
      onDelete(index, length) {
        const data = { index: index, length: length };
        socket.current?.emit("CODE_DELETE", { roomId, data });
      },
    });

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

    socket.current.emit("CONNECTED_TO_ROOM", { roomId, username });

    setDefaultCallingBarPosition()
  }

  const handleOnchange = debounce((value) => {
    code.current = value
    if (!someOneChangeCode.current) {
      axios
        .post(SAVE_CODE_URL, {
          roomId: roomId,
          code: value,
        })
        .then((_) => console.log("Save code successfully"))
        .catch((error) => {
          console.log(`Error when save code\n ${error}`);
          // TODO: handle error
        });
    }

    someOneChangeCode.current = false
  }, 500);

  async function handleRunCompiler() {
    setCompileState(true)
    socket.current?.emit('COMPILE_STATE_CHANGED', { roomId, state: true })
    axios.post(RUN_COMPILER_URL, {
      script: code.current,
      language: compilerLanguages.current[selectedLanguageIndex].name,
      version:
        compilerLanguages.current[selectedLanguageIndex].versions[selectedVersionIndex],
    }).then((res) => {
      const output = res.data.output;
      setOutput(output);
      setCompileState(false)
      socket.current?.emit("OUTPUT_CHANGED", { roomId, output });
      socket.current?.emit('COMPILE_STATE_CHANGED', { roomId, state: false })
    }).catch((err) => {
      // TODO: Loz Lam show dialog
      setCompileState(false)
    })

  }

  function changeEditorLanguage(rawLanguageCode) {
    if (!rawLanguageCode) { return }
    const languageCode = rawLanguageCode === "nodejs" ? "javascript" : rawLanguageCode.replace(/[0-9]/g, '')
    setEditorLanguage(null)
    var oldModel = editorRef.current.getModel();
    var newModel = monacoRef.current.editor.createModel(oldModel.getValue(), languageCode);
    editorRef.current.setModel(newModel);
    if (oldModel) {
      oldModel.dispose();
    }
  }


  function handleOnLanguageChange(changeTemplate) {
    const value = newLanguageValueRef.current

    if (value) {
      const index = compilerLanguages.current.findIndex((item) => item.name === value);
      setSelectedLanguageIndex(index);

      if (changeTemplate) {
        code.current = compilerLanguages.current[index].template
        setInitialCode(compilerLanguages.current[index].template)
      }

      if (index !== selectedLanguageIndex) {
        setSelectedVersionIndex(0);
        versionList.current = index !== -1 ? compilerLanguages.current[index].versions : []
      }
      changeEditorLanguage(compilerLanguages.current[index].languageCode);

      socket.current?.emit('CHANGE_LANGUAGE', {
        'roomId': roomId,
        'newLanguage': value,
        'changeTemplate': changeTemplate,
      })
    }
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
    if (userVideo.current.srcObject !== null) {
      localStream.current.getVideoTracks()[0].stop()
      userVideo.current.srcObject = null
      socket.current.emit('TOGGLE_CAMERA', ({
        'userId': socket.current.id,
        'roomId': roomId,
        'camState': false
      }))

      setCamState(false)

    } else {
      navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: true })
        .then(stream => {
          userVideo.current.srcObject = stream

          if (localStream.current.getAudioTracks()[0].enabled === false) {
            stream.getAudioTracks()[0].enabled = false
          }

          localStream.current = stream
          peersRef.current.forEach((peerInfo, index) => {
            let currentStream = peerInfo.peer.streams[0]
            let oldVideoTrack = currentStream.getVideoTracks()[0]
            let oldAudioTrack = currentStream.getAudioTracks()[0]
            let newVideoTrack = stream.getVideoTracks()[0]
            let newAudioTrack = stream.getAudioTracks()[0]
            peerInfo.peer.replaceTrack(oldVideoTrack, newVideoTrack, currentStream)
            peerInfo.peer.replaceTrack(oldAudioTrack, newAudioTrack, currentStream)
          })

          socket.current.emit('TOGGLE_CAMERA', ({
            'userId': socket.current.id,
            'roomId': roomId,
            'camState': true
          }))

          setCamState(true)
        }).catch(err => {
          console.log(err)
          showErrorDialog('Can\'t start your webcam. Please reload your browser')
        })
    }
  }

  function turnOnOffMicrophone() {
    var track = localStream.current.getAudioTracks()
    if (track) {
      localStream.current.getAudioTracks()[0].enabled = !track[0].enabled
      setMicState(localStream.current.getAudioTracks()[0].enabled)
      socket.current.emit('TOGGLE_MICROPHONE', {
        'userId': socket.current.id,
        'roomId': roomId,
        'micState': localStream.current.getAudioTracks()[0].enabled
      })
    }
  }

  function _createDateFormat(dateTime) {
    var time = ''
    const isAfternoon = dateTime.getHours() > 12 ? true : false
    if (isAfternoon) {
      time = `${dateTime.getHours() - 12}:${dateTime.getMinutes()} PM`
    } else {
      time = `${dateTime.getHours()}:${dateTime.getMinutes()} AM`
    }

    const date = `${dateTime.getDate()}-${dateTime.getMonth()}-${dateTime.getFullYear().toString().substr(-2)}`
    return `${time} ${date}`
  }


  function addMessage(senderName, message, date, isRight) {
    const userId = usersRef.current.find(item => item.username === senderName).id
    const messageDate = new Date(date)

    var messageEntity = {
      position: isRight ? "right" : 'left',
      type: "text",
      title: isRight ? null : senderName,
      text: message,
      titleColor: userId ? userColorsRef.current[userId] : USER_DEFAULT_COLOR,
      date: messageDate
      // use date property if in day 
      // use dateString property if not in day
    }

    setMessageList(oldArray => [...oldArray, messageEntity])
  }



  const infoTab = () => {
    return <>
      <Box sx={{ marginTop: "16px", marginLeft: "18px", marginRight: "22px" }}>
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
            marginTop: "36px",
            ".MuiOutlinedInput-root": {
              borderColor: "white",
              borderWidth: 10,
            },
          }}
          onChange={(event, value) => {
            newLanguageValueRef.current = value
            setOpenTemplateDialog(true)
          }}
          value={languageList[selectedLanguageIndex] ?? ""}
          renderInput={(params) => (
            <TextField {...params} label="Languages" />
          )}
        />

        <Autocomplete
          disableClearable
          id="compiler-language-version"
          options={versionList.current}
          sx={{ marginTop: "16px" }}
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
        <Box sx={{ marginTop: "12px" }}>
          <Button
            sx={{
              fontFamily: "Roboto Mono",
            }}
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
            marginTop: "36px",
          }}
        >
          {/* <Box sx={{ flex: 1 }}>
      <h4>Input</h4>
      <textarea></textarea>
    </Box> */}

          <Box sx={{ flex: 1 }}>
            <h3>Output</h3>
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
    </>
  }

  const settingTab = () => {
    return (
      <Box sx={{ marginTop: "16px", marginLeft: "18px", }}>
        <h3>Change your color:</h3>
        <Box sx={{ minHeight: "50px", maxHeight: "26vh", padding: "4px 0px 8px 0px", overflow: "visible" }}>
          <UserPalette
            userToColor={userColors}
            userId={socket.current?.id}
            onChange={(color) => {
              let newUserColors = userColorsRef.current
              newUserColors[socket.current?.id] = color
              setUserColors(state => ({
                ...state,
                ...newUserColors
              }))
              userColorsRef.current = newUserColors
              socket.current?.emit('COLOR_CHANGED', { userId: socket.current?.id, color: color })
            }} />
        </Box>
        <Box sx={{ marginTop: "12px", marginRight: "18px" }}>
          <Button
            sx={{
              fontFamily: "Roboto Mono",
            }}
            variant="contained"
            color="error"
            fullWidth={true}
            onClick={() => {
              socket.current.disconnect()
              navigate(`/`, { replace: true })
            }}
          >
            Leave room
          </Button>
        </Box>
      </Box>
    )
  }

  const messageTab = () => {
    return (
      <>
        <Box sx={{ marginTop: "4px" }}>
          {
            messageList.length === 0 ?
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "auto",
                height: "85vh",
                width: "100%",
                padding: "0px 36px 4px 36px",
                textAlign: "center",
                color: "#808080",
                fontSize: "0.8rem"
              }}>
                <ForumRoundedIcon sx={{
                  paddingBottom: "16px",
                  fontSize: "4rem",
                  fill: "#808080 !important"
                }} />
                This is room conversation, let's begin to chat with each other.
              </Box>
              :
              <MessageList
                className='message-list'
                lockable={false}
                toBottomHeight={'100%'}
                downButton={true}
                notchStyle={{ display: 'none' }}
                downButtonBadge={10}
                sendMessagePreview={true}
                messageBoxStyles={{ maxWidth: '80%', boxShadow: 'none', borderRadius: '8px', margin: '0px 8px 0px 10px', }}
                dataSource={[
                  ...messageList
                ]}
              />
          }
          <Grid container spacing={1} sx={{ padding: "0px 8px 4px 10px" }}>
            <Grid item xs={10}>
              <Input
                placeholder="Type here to send message..."
                referance={inputRef}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    sendChatMessage()
                  }
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Button
                style={{ backgroundColor: '#1976d2', width: '100%', height: '100%', color: 'white', borderRadius: '5px', minWidth: 'unset' }}
                onClick={() => {
                  sendChatMessage()
                }}>
                <SendRoundedIcon fontSize="small" />
              </Button>
            </Grid>
          </Grid>
        </Box>

      </>)
  }

  function handleDragCallingBox(e, ui) {
    const position = {
      x: ui.lastX + ui.deltaX,
      y: ui.lastY + ui.deltaY
    }
    setCommunicateBoxPosition(position)
    communicateBoxPositionRef.current = position
  };

  function setDefaultCallingBarPosition() {
    setCommunicateBoxPosition({
      x: EDITOR_BOUND_PADDING,
      y: (editorUIRef.current.getBoundingClientRect().bottom - communicateBoxRef.current.clientHeight - EDITOR_BOUND_PADDING) ?? EDITOR_BOUND_PADDING
    })
  }

  function showErrorDialog(message) {
    setShowDialog(true)
    errorMessageRef.current = message
  }

  return (
    <>
      <Grid container>
        <Dialog
          PaperProps={{
            className: "alert-dialog"
          }}
          open={openTemplateDialog}
          onClose={() => {
            setOpenTemplateDialog(false);
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Change the new language template?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Do you want to keep or replace the old code with the new language template?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button sx={{
              fontFamily: "Roboto Mono",
              textTransform: "unset !important",
              color: "#808080"
            }} onClick={() => {
              handleOnLanguageChange(false)
              setOpenTemplateDialog(false)
            }}>
              Keep the old code
            </Button>
            <Button sx={{
              fontFamily: "Roboto Mono",
              textTransform: "unset !important",
            }} onClick={() => {
              handleOnLanguageChange(true)
              setOpenTemplateDialog(false)
            }} autoFocus>
              Change to new template
            </Button>
          </DialogActions>
        </Dialog>
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
            defaultPosition={{ x: 0, y: 0 }}
            position={communicateBoxPosition}
            onDrag={handleDragCallingBox}
            bounds={{
              left: editorBounds?.left + EDITOR_BOUND_PADDING,
              top: editorBounds?.top + EDITOR_BOUND_PADDING,
              right: editorBounds?.right - communicateBoxWidth - EDITOR_BOUND_PADDING,
              bottom: editorBounds?.bottom - communicateBoxHeight - EDITOR_BOUND_PADDING,
            }}>
            <Box
              ref={communicateBoxRef}
              sx={{
                top: "0px",
                left: "0px",
                position: "absolute",
                minWidth: "150px",
                zIndex: 1,
              }}>
              <UserActionBar
                id="draggableHandler"
                width={communicateBoxWidth - AVATAR_BOX_SPACING}
                onCollapsed={(collapsed) => {
                  setExpandVoiceTab(!collapsed)
                }}
                camState={camState}
                micState={micState}
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
                    isSpeaking={!socket.current ? false : speakingUsers.includes(socket.current.id)}
                    color={!socket.current ? USER_DEFAULT_COLOR : userColors[socket.current.id]}
                    height={AVATAR_BOX_HEIGHT}
                    width={AVATAR_BOX_WIDTH}
                    videoRef={userVideo} />
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
                      width: (AVATAR_BOX_WIDTH + AVATAR_BOX_SPACING) * (peers.length < maxAvatarShow ? peers.length : maxAvatarShow),
                      overflow: "hidden",
                      borderRadius: 2,
                    }}>
                    <Carousel
                      sx={{
                        position: "relative",
                        overflow: "visible"
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
                      slidesToShow={peers.length < maxAvatarShow ? peers.length : maxAvatarShow}
                      scrollMode="remainder">
                      {peers.map((p, index) => {
                        var userId = peersRef.current[index].peerId
                        var user = usersRef.current.find(u => u.id === userId)
                        const stream = peerStreams[index]
                        const isSpeaking = speakingUsers.includes(userId)

                        return user !== undefined && UserAvatarBox({ stream: stream, id: userId, name: user.username, color: userColors[userId], width: AVATAR_BOX_WIDTH, height: AVATAR_BOX_HEIGHT, peer: p.peer, micState: p.micState, camState: p.camState, isSpeaking: isSpeaking })
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
            value={initialCode}
            defaultLanguage="undefined"
            language={editorLanguage}
            // defaultValue={languageTemplate}
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
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
            }}
          >
            <BasicTabs tabIndexRef={tabIndexRef} labels={['Info', 'Message', 'Setting']} components={[
              infoTab(), messageTab(), settingTab(),
            ]} dotState={isDotInvisible} setDotState={setDotInvisible} />

          </Box>
        </Grid>
      </Grid>
      <ErrorDialog open={isShowDialog}
        handleClose={
          () => {
            setShowDialog(false)
            errorMessageRef.current = ''
          }
        } errorMessage={errorMessageRef.current} />
    </>
  );
}

export default CodeScreen;
