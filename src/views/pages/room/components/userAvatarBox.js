import { PersonRounded } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

function UserAvatarBox({ id, name, color, width, height }) {
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
                textAlign:"center",
                position: "relative"
            }}>
            <PersonRounded 
                fontSize="large" 
                sx={{
                height: "100%",
                }}/>
            <Box sx={{
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