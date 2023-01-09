import { Box, Grid } from "@mui/material";
import NameInputField from "./components/name_input_field";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CREATE_ROOM_URL, CHECK_DUPLICATE_USERNAME_URL } from "../../../constants";
import { useLocation } from "react-router-dom";
import MainAvatarBox from "../../common_components/mainAvatarBox";
import { useEffect, useRef, useState } from "react";
import IconButton from '@mui/material/IconButton';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import hark from "hark"
import { useDispatch } from "react-redux";
import { setAuthState } from "../../../redux/slices/app-slice";

function InputNameScreen() {
    const navigate = useNavigate();
    const location = useLocation()
    const userVideoRef = useRef(null)
    const [camState, setCamState] = useState(true)
    const [micState, setMicState] = useState(true)
    const [isSpeaking, setSpeakingState] = useState(false)
    const firstTime = useRef(true)
    const localStream = useRef(null)
    const dispatch = useDispatch()

    useEffect(() => {
        if (firstTime.current) {
            return
        }

        if (!camState) {
            if (userVideoRef.current && userVideoRef.current.srcObject) {
                // user want to turn off camera
                userVideoRef.current.srcObject.getVideoTracks()[0].stop()
                userVideoRef.current.srcObject = null
                localStream.current = null
            }
        } else {
            // user want to turn on camera
            navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                .then((stream) => {
                    userVideoRef.current.srcObject = stream
                    localStream.current = stream
                })
        }
    }, [camState])

    useEffect(() => {
        if (firstTime.current) {
            return
        }

        if (userVideoRef.current && userVideoRef.current.srcObject) {
            var track = userVideoRef.current.srcObject.getAudioTracks()
            userVideoRef.current.srcObject.getAudioTracks()[0].enabled = !track[0].enabled
            localStream.current.getAudioTracks()[0].enabled = !track[0].enabled
        }

    }, [micState])

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => {
                userVideoRef.current.srcObject = stream
                localStream.current = stream

                var speechEvent = hark(stream, {})

                speechEvent.on('speaking', () => {
                    setSpeakingState(true)
                })

                speechEvent.on('stopped_speaking', () => {
                    setSpeakingState(false)
                })
            })

        firstTime.current = false
    }, [])

    useEffect(() => {
        return () => {
            if (localStream.current) {
                localStream.current.getTracks().forEach(track => {
                    if (track.readyState === "live") {
                        track.stop();
                    }
                });
            }
        }
    }, [])

    function toggleCamera() {
        setCamState(!camState)
    }

    function toggleMicrophone() {
        setMicState(!micState)
    }


    async function createRoom() {
        const res = await axios.post(
            CREATE_ROOM_URL,
            {}
        );
        navigate(`/room/${res.data.roomId}`, {
            replace: true, state: {
                'micState': micState,
                'camState': camState
            }
        });
    }

    async function joinRoom(username) {
        const roomId = location.state.roomId

        // check duplicate name
        axios.get(CHECK_DUPLICATE_USERNAME_URL, {
            params: {
                'username': username,
                'roomId': roomId,
            }
        }).catch((err) => {
            console.log(err)
        }).then((res) => {
            if (res.data.isUsernameExist) {
                console.log('username is exist')
                // handle case when username is exist
            } else {
                navigate(`/room/${roomId}`, {
                    replace: true, state: {
                        'micState': micState,
                        'camState': camState
                    }
                });
            }
        })
    }

    function onPressHandler(username) {
        sessionStorage.setItem('username', username)
        dispatch(setAuthState(true))
        location.state?.isCreateRoom ?? false ? createRoom() : joinRoom(username)
    }

    return (
        <Grid sx={{
            height: '100vh',
            width: '100vw',
            background: "#151515",
            padding: '50px'
        }} container>
            <Grid item xs={6}>
                <Box sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    position: 'relative'
                }}>
                    <MainAvatarBox id={'userVideo'} name={''} color={'#808080'} height={'50%'} width={'80%'} isSpeaking={isSpeaking} videoRef={userVideoRef} />
                    <Box sx={{
                        position: 'absolute',
                        width: '90%',
                        height: '50%',
                        zIndex: 3,
                        display: 'flex',
                    }}>
                        <IconButton sx={{
                            outline: '1px solid',
                            outlineColor: micState ? 'white' : '#ea4335',
                            margin: 'auto 8px 16px auto',
                            backgroundColor: micState ? 'transparent' : '#ea4335',
                            '&:hover': {
                                backgroundColor: micState ? 'transparent' : '#ea4335',
                            }
                        }} onClick={() => { toggleMicrophone() }}>
                            {micState ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
                        </IconButton>
                        <IconButton sx={{
                            outline: '1px solid',
                            outlineColor: camState ? 'white' : '#ea4335',
                            margin: 'auto auto 16px 8px',
                            backgroundColor: camState ? 'transparent' : '#ea4335',
                            '&:hover': {
                                backgroundColor: camState ? 'transparent' : '#ea4335',
                            }
                        }} onClick={() => { toggleCamera() }}>
                            {camState ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon sx={{ color: 'red' }} />}
                        </IconButton>
                    </Box>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    display: 'flex'
                }}>
                    <NameInputField onPressHandler={onPressHandler} />
                </Box>
            </Grid>
        </Grid>
    )
}

export default InputNameScreen;