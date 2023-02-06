import { CircularProgress, Box } from "@mui/material";

function LoadingScreen() {
    return (
        <Box sx={{
            backgroundColor: "#151515",
            height: "100vh",
            width: "100vw",
            display: 'table-cell',
            verticalAlign: 'middle'

        }}>

            <Box sx={{
                marginLeft: 'auto',
                marginRight: 'auto',
                textAlign: 'center'
            }}>
                <CircularProgress sx={{
                    marginBottom: '16px', color: 'yellow'
                }} />
                <h5 style={{
                    fontSize: '16px'
                }}><strong style={{
                    color: 'white'
                }}>Generating information...</strong></h5>
            </Box>
        </Box>
    )
}

export default LoadingScreen