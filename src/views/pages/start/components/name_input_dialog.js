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
import { setUserName } from "../../../../redux/slices/app-slice";

function NameInputDialog({ open }) {
  const [name, setName] = useState("");
  const dispatch = useDispatch();
  return (
    <Dialog
      sx={{
        display: 'block',
        background: "#151515",
        overflow: "hidden",
        borderRadius: "12px",
      }}
      open={open}
      onClose={null}
    >
      <Box
        sx={{
          background: "#151515",
          minWidth: "500px",
          padding: "24px",
        }}
      >
        <h2>Enter your name</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
        />

        <Button
          sx={{
            display: "flex",
            marginLeft: "auto",
            marginTop: "12px",
            fontFamily: "Roboto Mono",
          }}
          variant="contained"
          onClick={() => {
            dispatch(setUserName(name));
          }}
        >
          Save
        </Button>
      </Box>
    </Dialog>
  );
}

export default NameInputDialog;
