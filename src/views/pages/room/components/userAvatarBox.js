import { MicOffRounded, MicRounded, PersonRounded } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

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
            style={{ display: !props.stream ? 'none' : 'inline', objectFit: 'cover', zIndex: 1, position: 'absolute', top: 0, left: 0 }}
            height={AVATAR_BOX_HEIGHT}
            width={AVATAR_BOX_WIDTH}
            autoPlay
            playsInline
            ref={videoRef}
        />
    )
}


const MicrophoneIcon = ({ micState }) => {
    if (micState) {
        return <MicRounded fontSize="small" />
    } else {
        return <MicOffRounded fontSize="small" />
    }

}

const UserAvatarBox = ({ id, name, color, width, height, peer, stream, micState, camState }) => {
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
            {camState === true && <Video peer={peer} id={id} stream={stream} />}
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
                <MicrophoneIcon micState={micState} />
            </Box>
        </Box>
    );
}

export default UserAvatarBox