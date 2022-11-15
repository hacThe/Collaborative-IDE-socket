import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUserName } from "../../../../redux/slices/app-slice";

function SelectRoomDialog({ open, handleClose }) {
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
              navigate(`room/${roomId}`);
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
