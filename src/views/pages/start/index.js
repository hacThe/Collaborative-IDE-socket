import { Button, Grid, IconButton, Box } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SelectRoomDialog from "./components/select_room_dialog";
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import Carousel from "nuka-carousel";
import VideoChatRoundedIcon from '@mui/icons-material/VideoChatRounded';
import logo from '../../../assets/collab-coding-2.png';
import { ReactComponent as GithubLogo } from '../../../assets/github-logo.svg';
import { KeyboardArrowLeftRounded, KeyboardArrowRightRounded } from "@mui/icons-material";


function StartScreen() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Grid container
      sx={{
        height: "100vh",
        display: "flex",
      }}>
      <Grid 
        sx={{ 
          background: "#151515",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          lineHeight: 1.6,
          color: "#cccccc",
          overflow: "hidden !important",
          width: "100%",
          padding: "36px 0px 36px 0px",
        }} 
        item md={7}>
          <Carousel
            style={{
              width: "56vw",
            }}
            adaptiveHeight={true}
            renderCenterLeftControls={({ previousDisabled, previousSlide }) => (
              <IconButton sx={{ left: "1%" }} onClick={previousSlide} disabled={previousDisabled}>
                <KeyboardArrowLeftRounded />
              </IconButton>
            )}
            renderCenterRightControls={({ nextDisabled, nextSlide }) => (
              <IconButton sx={{ right: "1%" }} onClick={nextSlide} disabled={nextDisabled}>
                <KeyboardArrowRightRounded />
              </IconButton>
            )}
            slidesToShow={1}
            scrollMode="reminder">
              <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}>
                <CodeRoundedIcon sx={{
                  fontSize: "140px"
                }}/>
                <Box sx={{
                  width: "45vw",
                }}>
                  This is an online code editor that allows you to write, compile and execute your code online in many programming languages...
                </Box>
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}>
                <Groups2RoundedIcon sx={{
                  fontSize: "140px"
                }}/>
                <Box sx={{
                  width: "45vw",
                }}>
                  ...collaboratively with your teammates, and colleagues.
                </Box>
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}>
                <VideoChatRoundedIcon sx={{
                  fontSize: "140px"
                }}/>
                <Box sx={{
                  width: "45vw",
                }}>
                  When coding together, you and your teammates can also communicate with each other via messaging and video calling.
                </Box>
              </div>
          </Carousel>
      </Grid>
      <Grid 
        sx={{ 
          background: "#111111",
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "end",
          width: "100%",
          color: "#fff",
        }}
        item md={5}>
          
          <IconButton sx={{
            margin: "8px",
          }} onClick={() => {
            window.open("https://github.com/hacThe/Collaborative-IDE-socket/", '_blank');
          }}>
            <GithubLogo style={{
              width: "36px",
              height: "36px",
            }}/>
          </IconButton>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
          paddingBottom: "36px",
        }}>
          <img src={logo} alt="logo" style={{
            width: "15%",
            backgroundColor: "#222",
            borderRadius: "50%",
            padding: "16px",
            marginBottom: "18px",
          }}/>
          <p style={{ width: "130px", textAlign: "center", lineHeight: "1.6" }}>
            Welcome to <strong>Col-E</strong>
          </p>
          <Button
            sx={{
              marginTop: "18px",
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
              color: "#1976d2",
              backgroundColor: "#ffffff",
            }}
            variant="outlined"
            onClick={() => setOpen(true)}
          >
            Join room
          </Button>
          <SelectRoomDialog open={open} handleClose={() => setOpen(false)} />
        </Box>
      </Grid>
    </Grid>
  );
}

export default StartScreen;
