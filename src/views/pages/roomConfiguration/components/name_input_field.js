import {
  Box,
  Button
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setUserName } from "../../../../redux/slices/app-slice";

function NameInputField({ onPressHandler }) {
  const [name, setName] = useState("");
  const dispatch = useDispatch();
  return (
    <Box
      sx={{
        background: "#151515",
        width: "100%"
      }}
    >
      <h2 style={{
        display: 'flex',
        justifyContent: 'center',
      }}>Enter your name</h2>
      <input
        style={{
          width: '50%',
          marginTop: '12px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
        value={name}
        onChange={(e) => {
          // username = e.target.value
          setName(e.target.value)
        }}
        type="text"
      />

      <Button
        sx={{
          display: "flex",
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: "25px",
          width: '25%',
          fontFamily: "Roboto Mono",
        }}
        variant="contained"
        onClick={() => {
          dispatch(setUserName(name))
          onPressHandler(name)
        }}
      >
        Save
      </Button>
    </Box>
  );
}

export default NameInputField;
