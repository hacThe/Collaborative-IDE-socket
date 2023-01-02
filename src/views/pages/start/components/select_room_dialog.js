import {
  Box,
  Button,
  Dialog
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { FIND_ROOM_URL } from "../../../../constants";

function SelectRoomDialog({ open, handleClose }) {
  const [error, setError] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  return (
    <Dialog open={open} onClose={handleClose}>
      <Box
        sx={{
          background: "#151515",
          minWidth: "500px",
          padding: "24px",
        }}
      >
        <h2>Enter room id</h2>
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          type="text"
        />
        <h4 style={{ color: "red", display: "flex", justifyContent: "right", alignItems: "right", marginTop: "4px" }}>{error}</h4>
        <Box sx={{ display: "flex", marginTop: "12px" }}>
          <Button
            sx={{ marginRight: "12px", fontFamily: "Roboto Mono" }}
            variant="outlined"
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            sx={{ color: "white", fontFamily: "Roboto Mono" }}
            variant="contained"
            disabled={!roomId}
            onClick={() => {
              axios({
                method: 'GET',
                url: FIND_ROOM_URL,
                params: {
                  roomId: roomId
                },
              })
                .then((response) => {
                  const roomId = response.data["foundRoomIds"];
                  console.log(response);
                  navigate(`room/${roomId}`);
                }).catch((error) => {
                  setError(error.response.data);
                });
            }}
          >
            Go
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

export default SelectRoomDialog;
