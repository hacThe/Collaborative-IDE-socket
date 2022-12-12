import { MicOffRounded, MicRounded, PersonRounded } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const AVATAR_BOX_WIDTH = 200;
const AVATAR_BOX_HEIGHT = 150;

const Video = (props) => {
    const videoRef = useRef(null)
  
    useEffect(() => {
      videoRef.current.srcObject = props.stream
    }, [props.stream])
  
    return (
        <video
            id={props.id}
            style={{ display: !props.stream ? 'none' : 'inline' , objectFit: 'cover', zIndex: 1, position: 'absolute', top: 0, left: 0 }}
            height={AVATAR_BOX_HEIGHT}
            width={AVATAR_BOX_WIDTH}
            autoPlay
            playsInline
            ref={videoRef}
        />
    )
}


const MicrophoneIcon = ({stream}) => {
    const [micState, setMicState] = useState(false)
    useEffect(()=>{
        console.log(JSON.stringify(stream))
        if (stream) {
            console.log('ha')
            var tracks = stream.getAudioTracks()
            // if (tracks.length !== 0) {
            //     setMicState(tracks[0].enabled)
            //     console.log(tracks[0].enabled)
            // } else {
            // setMicState(false)
            // }
            for (let track in tracks) {
                console.log(track)
            }
        } else {
            setMicState(false)
        }
    }, [stream?.getAudioTracks()])

    return micState ? <MicRounded fontSize="small"/> : <MicOffRounded fontSize="small"/>
}

const UserAvatarBox = ({id, name, color, width, height, peer, stream}) => {
    return (
        <Box
            key={id}
            id={id}
            sx={{
                background: color,
                height: height,
                width: width,
                borderRadius: 2,
                border: 1,
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
            }}>
            <Video peer={peer} id={id} stream={stream} />
            <PersonRounded
                fontSize="large"
                sx={{
                    zIndex: 0,
                    height: "100%",
                }} />
            <Box sx={{
                zIndex: 2,
                display: "inline-flex",
                position: "absolute",
                background: "#11111163",
                borderRadius: 1,
                left: 8,
                bottom: 8,
                padding: "3px 6px 0px 6px",
            }}>
                <Typography variant="caption" color="common.white">{name}</Typography>
                <MicrophoneIcon stream={stream}/> 
            </Box>
        </Box>
    );
}

export default UserAvatarBox