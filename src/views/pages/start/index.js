import { Button, Box } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import SelectRoomDialog from "./components/select_room_dialog";


function StartScreen() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const appState = useSelector((state) => state.app);


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
        {/* <h2 style={{ display: "inline-block" }}>Hello <strong> {appState?.username} </strong></h2> */}
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
            onClick={() => {
              navigate(`inputName`, {
                state: { 'isCreateRoom': true }
              })
            }}
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
          <SelectRoomDialog open={open} handleClose={() => setOpen(false)} />
        </Box>
      </Box>
    </Box>
  );
}

export default StartScreen;
