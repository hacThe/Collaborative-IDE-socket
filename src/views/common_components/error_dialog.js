import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";


function ErrorDialog({ open, handleClose, errorMessage }) {

    return (
        <Dialog
            PaperProps={{
                className: "alert-dialog"
            }}
            open={open}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {"An error has occurred"}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {errorMessage}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button sx={{
                    fontFamily: "Roboto Mono",
                    textTransform: "unset !important",
                }} onClick={handleClose} autoFocus>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ErrorDialog