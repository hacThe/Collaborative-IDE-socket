import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { Navigate, useParams } from "react-router-dom";
import NameInputDialog from "../start/components/name_input_dialog";
import Editor from "@monaco-editor/react";
import { Button, Grid } from "@mui/material";
import { Box } from "@mui/system";
import { RemoteCursorManager, RemoteSelectionManager, EditorContentManager } from "@convergencelabs/monaco-collab-ext";
import { debounce } from 'lodash'
import axios from "axios";

const CURSOR_COLOR = {
  list: ["#FF0000", "#FFC0CB", "#FFA500",
    "#FFFF00", "#800080", "#008000", "#0000FF", "#A52A2A"],
  default: "#808080",
}

const socket = io("ws://192.168.90.12:3001", {
  transports: ["websocket", "polling"],
})

function CodeScreen(props) {
  var remoteCursorManager = null;
  var remoteSelectionManager = null;
  var contentManager = null;

  const usersRef = useRef(null);

  const { roomId } = useParams();
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [users, setUsers] = useState([]);
  const username = useSelector((state) => state.app).username;

  useEffect(() => {
    if (username) {
      socket.on("CODE_INSERT", (data) => {
        console.log("CODE_INSERT");
        contentManager.insert(data.index, data.text);
      });

      socket.on("CODE_REPLACE", (data) => {
        contentManager.replace(data.index, data.length, data.text);
      });

      socket.on("CODE_DELETE", (data) => {
        contentManager.delete(data.index, data.length);
      });

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

      socket.on("ROOM:CONNECTION", (data) => {
        setUsers(data.users);
        usersRef.current = data.users;
        addUserCursor(data.newUserId);
      });

      socket.on("ROOM:DISCONNECT", (userId) => {
        const users = usersRef.current.filter(item => item.id !== userId);
        setUsers(users);
        removeUserCursor(userId);
        usersRef.current = users;
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

  function removeUserCursor(oldUserId) {
    const users = usersRef.current;
    if (remoteCursorManager && remoteSelectionManager) {
      remoteCursorManager.removeCursor(oldUserId);
      remoteSelectionManager.removeSelection(oldUserId);

      const oldUserIndex = users.findIndex(item => item.id === oldUserId);
      const oldCursorColor = CURSOR_COLOR.list[oldUserIndex];
      CURSOR_COLOR.list = CURSOR_COLOR.list.splice(oldUserIndex, 1).push(oldCursorColor);
      console.log("CURSORS & SELECTIONS REMOVED");
    }
  }

  function addUserCursor(newUserId) {
    const users = usersRef.current;
    if (remoteCursorManager && remoteSelectionManager) {
      if (newUserId !== socket.id) {
        const newUserIndex = users.findIndex(item => item.id == newUserId);
        console.log("ME MAY:" + newUserId);
        console.log("ME MAY 1:" + JSON.stringify(users));
        const newUser = users[newUserIndex];
        console.log("NGU:" + newUser);

        const cursorColor = newUserIndex < CURSOR_COLOR.list.length ? CURSOR_COLOR.list[newUserIndex] : CURSOR_COLOR.default;
        remoteCursorManager.addCursor(newUser.id, cursorColor, newUser.username);
        remoteSelectionManager.addSelection(newUser.id, cursorColor, newUser.username);
        console.log("CURSORS & SELECTIONS ADDED");
      }
    }
  }

  function addInitialCursors() {
    const users = usersRef.current;

    for (let i in users) {
      let user = users[i];
      if (user.id !== socket.id) {
        const cursorColor = i < CURSOR_COLOR.list.length ? CURSOR_COLOR.list[i] : CURSOR_COLOR.default;
        remoteCursorManager.addCursor(user.id, cursorColor, user.username);
        remoteSelectionManager.addSelection(user.id, cursorColor, user.username);
      }
    }
    console.log("INITIAL CURSORS & SELECTIONS ADDED");
  }

  function handleOnMount(editor, monaco) {
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
        socket?.emit("CODE_INSERT", data);
      },
      onReplace(index, length, text) {
        const data = { index: index, length: length, text: text };
        socket?.emit("CODE_REPLACE", data);
      },
      onDelete(index, length) {
        const data = { index: index, length: length };
        socket?.emit("CODE_DELETE", data);
      }
    });

    addInitialCursors();

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
    const handleOnchange = debounce((value) => {
      setCode(value);
      axios.post('http://localhost:3001/data/save', {
        'roomId': roomId,
        'code': value,
      }).then((_) =>
        console.log('Save code successfully')
      ).catch((error) => {
        console.log(`Error when save code\n ${error}`)
        // TODO: handle error 
      })
      socket?.emit("CODE_CHANGED", value);
    }, 500)

    async function handleRunCompiler() {
      const res = await axios.post(
        "http://192.168.90.12:3001/compiler/execute",
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
              //value={code}
              defaultLanguage="javascript"
              defaultValue={copyRightTemplate + code}
              // onChange={handleOnchange}
              onMount={handleOnMount}
              theme="vs-dark"
              options={{
                cursorBlinking: "blink",
                cursorStyle: "line",
                fixedOverflowWidgets: "true"
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
                    className="icon right"
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
}

export default CodeScreen;
