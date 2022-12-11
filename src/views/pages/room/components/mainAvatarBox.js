import { PersonRounded } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

function MainAvatarBox({ id, name, color, width, height, videoRef }) {
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
            <video
                style={{ objectFit: 'cover', zIndex: 1, position: 'absolute', top: 0, left: 0 }}
                id={id}
                height={height}
                width={width}
                muted ref={videoRef} autoPlay playsInline
            />
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

export default MainAvatarBox