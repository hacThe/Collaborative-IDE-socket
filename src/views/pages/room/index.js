import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { Navigate, useParams } from "react-router-dom";
import NameInputDialog from "../start/components/name_input_dialog";
import Editor from "@monaco-editor/react";
import { Button, Grid } from "@mui/material";
import { Box } from "@mui/system";
import { RemoteCursorManager, RemoteSelectionManager } from "@convergencelabs/monaco-collab-ext";
import axios from "axios";

const CURSOR_COLOR = {
  list: ["#FF0000", "#FFC0CB", "#FFA500",
          "#FFFF00", "#800080", "#008000", "#0000FF", "#A52A2A"],
  default: "#808080",
}

function CodeScreen(props) {
  var remoteCursorManager = null;
  var remoteSelectionManager = null;

  const editorRef = useRef(null);
  const usersRef = useRef(null);

  const { roomId } = useParams();
  console.log({ roomId });
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [users, setUsers] = useState([]);
  const username = useSelector((state) => state.app).username;
  const [socket, setSocket] = useState(
    io("ws://localhost:3001", {
      transports: ["websocket"],
    })
  );

  useEffect(() => {
    if (username) {
      socket.on("CURSOR_CHANGED", (cursorData) => {
        console.log("CURSOR DATA RECEIVED");
        console.log(cursorData);
        console.log("CURSOR DATA SET");
        remoteCursorManager.setCursorOffset(cursorData.name, cursorData.offset);
      });

      socket.on("SELECTION_CHANGED", (selectionData) => {
        console.log("SELECTION DATA RECEIVED");
        console.log(selectionData);
        console.log("SELECTION DATA SET");
        remoteSelectionManager.setSelectionOffsets(selectionData.name, selectionData.startOffset, selectionData.endOffset);
      });

      socket.on("CODE_CHANGED", (code) => {
        console.log(code);
        setCode(code);
      });

      socket.on("OUTPUT_CHANGED", (output) => {
        setOutput(output);
      });

      console.log(socket);
      socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
      });

      socket.on("connect", () => {
        socket.emit("CONNECTED_TO_ROOM", { roomId, username });
      });

      socket.on("ROOM:CONNECTION", (users) => {
        setUsers(users);
        usersRef.current = usersRef.current === null ? users : users.filter(user => !usersRef.current.includes(user));
        if (remoteCursorManager && remoteSelectionManager) {
          addUserCursors();
        }
      });

      //  editor.on('change', (instance, changes) => {
      //    const { origin } = changes
      //    if (origin !== 'setValue') {
      //      socket.emit('CODE_CHANGED', instance.getValue())
      //    }
      //  })
      //  editor.on('cursorActivity', (instance) => {
      //     console.log(instance.cursorCoords())
      //  })

      return () => {
        socket.emit("DISSCONNECT_FROM_ROOM", { roomId, username });
      };
    }
  }, []);

  if (!username) return <Navigate to="/" replace />;

  const copyRightTemplate = `/*
  * Copyright (c) 2022 UIT KTPM2019
  * All rights reserved.
  * 19522496 Trần Lê Thanh Tùng
  * 19521743 Trương Kim Lâm
  * 19522252 Dương Hiển Thê
  */
 
 
  `;

  function addUserCursors() {
    const users = usersRef.current;
    for (let i in users) {
      const userId = users[i];
      if (userId !== socket.id) {
        const cursorColor = i < CURSOR_COLOR.list.length ? CURSOR_COLOR.list[i] : CURSOR_COLOR.default;
        remoteCursorManager.addCursor(userId, cursorColor, userId);
        remoteSelectionManager.addSelection(userId, cursorColor, userId);
      }
    }
        
    console.log("CURSORS & SELECTIONS ADDED");
  }

  function handleOnMount(editor, monaco) {
    remoteCursorManager = new RemoteCursorManager({
      editor: editor,
      tooltips: true,
      tooltipDuration: 1,
      showTooltipOnHover: true,
    });

    remoteSelectionManager = new RemoteSelectionManager({editor: editor});

    addUserCursors();

    editor.onDidChangeCursorPosition(e => {
      const offset = editor.getModel().getOffsetAt(e.position);
      const cursorData = { name: socket.id, offset: offset };

      socket?.emit("CURSOR_CHANGED", cursorData);
      console.log("CURSOR DATA SENT");
      console.log(cursorData);
    });

    editor.onDidChangeCursorSelection(e => {
      const startOffset = editor.getModel().getOffsetAt(e.selection.getStartPosition());
      const endOffset = editor.getModel().getOffsetAt(e.selection.getEndPosition());
      const selectionData = { name: socket.id, startOffset: startOffset, endOffset: endOffset };
      
      socket?.emit("SELECTION_CHANGED", selectionData);
      console.log("SELECTION SENT");
      console.log(selectionData);
    });
  }

  const handleOnchange = (value, e) => {
    setCode(value);
    socket?.emit("CODE_CHANGED", value);
  };

  async function handleRunCompiler() {
    const res = await axios.post(
      "http://localhost:3001/compiler/execute",
      {
        "script": code,
        "language": "dart",
        "versionIndex": 4
      }
    );
    const output = res.data.output;
    setOutput(output);
    socket?.emit("OUTPUT_CHANGED", output);
  }

  return (
    <>
      <Grid container>
        <Grid item xs={9}>
          <Editor
            height="100vh"
            value={code}
            defaultLanguage="javascript"
            defaultValue={copyRightTemplate + code}
            onChange={handleOnchange}
            onMount={handleOnMount}
            theme="vs-dark"
            options={{    
              cursorBlinking:"blink",
              cursorStyle:"line",
              fixedOverflowWidgets:"true"
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
                  class="icon right"
                >
                  <img
                    src="http://clipground.com/images/copy-4.png"
                    title="Click to Copy"
                  />
                </span>
              </h3>
              <h3>
                Room members: <strong> {users.length}</strong>
              </h3>
            </Box>

            <Box sx={{ marginTop: "24px" }}>
              <Button 
                variant="outlined" 
                onClick={handleRunCompiler}>
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
              <Box sx={{ flex: 1 }}>
                <h4>Input</h4>
                <textarea></textarea>
              </Box>

              <Box sx={{ flex: 1, marginTop: "36px" }}>
                <h4>Out put</h4>
                <Box className="result-banner">
                  <p>{output === "" ? "This is result banner" : output}</p>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default CodeScreen;
