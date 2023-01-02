import { Button, Typography, Box } from "@mui/material";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import NameInputDialog from "./components/name_input_dialog";
import SelectRoomDialog from "./components/select_room_dialog";
import axios from "axios";
import { CREATE_ROOM_URL } from "../../../constants";

function StartScreen(props) {
  const appState = useSelector((state) => state.app);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const handleCreateRoom = async () => {
    const res = await axios.post(
      CREATE_ROOM_URL,
      {}
    );
    navigate(`room/${res.data.roomId}`);
  };

  return (
    <Box
      sx={{
        background: "#222",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h2 style={{ display: "inline-block" }}>Hello <strong> {appState?.username} </strong></h2>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            sx={{
              marginTop: "12px",
              minWidth: "200px",
              fontFamily: "Roboto Mono",
            }}
            variant="contained"
            onClick={handleCreateRoom}
          >
            Create room
          </Button>
          <Button
            sx={{
              marginTop: "12px",
              minWidth: "200px",
              fontFamily: "Roboto Mono",
            }}
            variant="outlined"
            onClick={() => setOpen(true)}
          >
            Join room
          </Button>
          <NameInputDialog open={!appState.username} />
          <SelectRoomDialog open={open} handleClose={() => setOpen(false)} />
        </Box>
      </Box>
    </Box>
  );
}

export default StartScreen;
