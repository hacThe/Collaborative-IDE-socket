import { PersonRounded } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

const AVATAR_BOX_WIDTH = 200;
const AVATAR_BOX_HEIGHT = 150;

const Video = (props) => {
    const ref = useRef()

    useEffect(() => {
        props.peer.on('stream', stream => {
            ref.current.srcObject = stream
        })
    }, [])

    return (
        <video
            id={props.id}
            style={{ objectFit: 'cover', zIndex: 1, position: 'absolute', top: 0, left: 0 }}
            height={AVATAR_BOX_HEIGHT}
            width={AVATAR_BOX_WIDTH}
            autoPlay
            playsInline
            ref={ref}
        />
    )
}

function UserAvatarBox({ id, name, color, width, height, peer }) {
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
                position: "relative"
            }}>
            <Video peer={peer} id={id} />
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
            </Box>
        </Box>
    );
}

export default UserAvatarBox