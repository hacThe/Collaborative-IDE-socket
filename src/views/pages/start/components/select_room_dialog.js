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
    <Dialog PaperProps={{ style: { backgroundColor: "transparent" } }} open={open} onClose={() => {
      handleClose()
      setRoomId("")
      setError("")
    }}>
      <Box
        sx={{
          backgroundColor: "#151515",
          minWidth: "500px",
          padding: "24px",
          borderRadius: "8px",
        }}
      >
        <h2>Enter room id</h2>
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          type="text"
        />
        <h4 style={{ color: "red", display: "flex", justifyContent: "right", alignItems: "right", marginTop: "4px" }}>{error}</h4>
        <Box sx={{ display: "flex", marginTop: "12px", justifyContent: "right", alignItems: "right", }}>
          <Button className="cancel-button"
            sx={{ marginRight: "8px", fontFamily: "Roboto Mono" }}
            variant="text"
            onClick={(() => {
              handleClose()
              setError("")
              setRoomId("")
            })}
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
                  navigate(`inputName`, {
                    state: { 'isCreateRoom': false, 'roomId': roomId }
                  })
                }).catch((error) => {
                  setError(error.response.data);
                });
            }}
          >
            Join
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

export default SelectRoomDialog;
