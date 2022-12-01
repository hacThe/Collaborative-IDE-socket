import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { Navigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Autocomplete, TextField, Button, Grid, Backdrop, CircularProgress } from "@mui/material";
import { Box } from "@mui/system";
import {
  RemoteCursorManager,
  RemoteSelectionManager,
  EditorContentManager,
} from "@convergencelabs/monaco-collab-ext";
import { debounce } from "lodash";
import axios from "axios";
import { usePromiseTracker, trackPromise } from "react-promise-tracker";

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



function CodeScreen(props) {
  var remoteCursorManager = null;
  var remoteSelectionManager = null;
  var contentManager = null;
  var socket = useRef(null)

  const usersRef = useRef(null);
  const { roomId } = useParams();
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [users, setUsers] = useState([]);
  const username = useSelector((state) => state.app).username;

  const compilerLanguages = useRef([])
  const [languageList, setLanguageList] = useState([]);
  const versionList = useRef([])
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(0);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const [editorLanguage, setEditorLanguage] = useState(null);

  const { promiseInProgress } = usePromiseTracker();

  useEffect(() => {
    axios
      .get(`http://localhost:3001/compiler/get-programming-languages`)
      .then((response) => {
        const fetchCompilerLanguages = response.data.result;
        compilerLanguages.current = fetchCompilerLanguages
        setLanguageList(fetchCompilerLanguages.map((item) => item.name));
        versionList.current = fetchCompilerLanguages[selectedLanguageIndex].versions

        changeEditorLanguage(fetchCompilerLanguages[selectedLanguageIndex].name);
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
    });

    socket.current.on('CHANGE_LANGUAGE', (newLanguage) => {
      const index = compilerLanguages.current.findIndex((item) => item.name === newLanguage);
      setSelectedLanguageIndex(index);
      if (index !== selectedLanguageIndex) {
        setSelectedVersionIndex(0);
        versionList.current = index !== -1 ? compilerLanguages.current[index].versions : []
      }
      changeEditorLanguage(newLanguage);
    })

    socket.current.on('CHANGE_VERSION', (newVersionIndex) => {
      setSelectedVersionIndex(newVersionIndex);
    })


    function removeUserCursor(oldUserId) {
      const users = usersRef.current;
      if (remoteCursorManager && remoteSelectionManager) {
        remoteCursorManager.removeCursor(oldUserId);
        remoteSelectionManager.removeSelection(oldUserId);

        const oldUserIndex = users.findIndex((item) => item.id === oldUserId);
        const oldCursorColor = CURSOR_COLOR.list[oldUserIndex];
        CURSOR_COLOR.list = CURSOR_COLOR.list
          .splice(oldUserIndex, 1)
          .push(oldCursorColor);
      }
    }

    function addUserCursor(newUserId) {
      const users = usersRef.current;
      if (remoteCursorManager && remoteSelectionManager) {
        if (newUserId !== socket.current.id) {
          const newUserIndex = users.findIndex((item) => item.id === newUserId);
          const newUser = users[newUserIndex];

          const cursorColor =
            newUserIndex < CURSOR_COLOR.list.length
              ? CURSOR_COLOR.list[newUserIndex]
              : CURSOR_COLOR.default;
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
    };
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

  function addInitialCursors() {
    const users = usersRef.current;

    for (let i in users) {
      let user = users[i];
      if (user.id !== socket.current?.id) {
        const cursorColor =
          i < CURSOR_COLOR.list.length
            ? CURSOR_COLOR.list[i]
            : CURSOR_COLOR.default;
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
    trackPromise(
      axios.post("http://localhost:3001/compiler/execute", {
        script: code,
        language: compilerLanguages.current[selectedLanguageIndex].name,
        version:
          compilerLanguages.current[selectedLanguageIndex].versions[selectedVersionIndex],
      }).then((res) => {
        const output = res.data.output;
        setOutput(output);
        socket.current?.emit("OUTPUT_CHANGED", { roomId, output });   
      })
    )
  }

  function changeEditorLanguage(name) {
    switch (name) {
      case "NodeJS":
        setEditorLanguage("javascript");
        break;
      default:
        setEditorLanguage(null);
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
    changeEditorLanguage(value);

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

  return (
    <>
      <Grid container>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={promiseInProgress}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Grid item xs={9}>
          <Editor
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
              minHeight: "100vh",
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
              label="Ngu"
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
}

export default CodeScreen;
