import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { Navigate, useParams } from "react-router-dom";
import NameInputDialog from "../start/components/name_input_dialog";
import Editor from "@monaco-editor/react";
import { Button, Grid } from "@mui/material";
import { Box } from "@mui/system";
function CodeScreen(props) {
  const { roomId } = useParams();
  console.log({ roomId });
  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const username = useSelector((state) => state.app).username;
  const [socket, setSocket] = useState(
    io("ws://localhost:3001", {
      transports: ["websocket"],
    })
  );
  useEffect(() => {
    if (username) {
      socket.on("CODE_CHANGED", (code) => {
        console.log(code);
        setCode(code);
      });

      console.log(socket);
      socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
      });

      socket.on("connect", () => {
        socket.emit("CONNECTED_TO_ROOM", { roomId, username });
      });

      socket.on("disconnect", () => {
        socket.emit("DISSCONNECT_FROM_ROOM", { roomId, username });
      });

      socket.on("ROOM:CONNECTION", (users) => {
        setUsers(users);
        console.log(users);
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

  const handleOnchange = (value, e) => {
    setCode(value);
    socket?.emit("CODE_CHANGED", value);
  };
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
            theme="vs-dark"
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
              <Button variant="outlined">Run</Button>
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
                  <p>This is result banner</p>
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
