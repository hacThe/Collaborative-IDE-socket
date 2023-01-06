import { Box } from "@mui/material";
import NameInputDialog from "./components/name_input_dialog";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CREATE_ROOM_URL, CHECK_DUPLICATE_USERNAME_URL } from "../../../constants";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

function InputNameScreen() {
    const navigate = useNavigate();
    const location = useLocation()

    async function createRoom() {
        const res = await axios.post(
            CREATE_ROOM_URL,
            {}
        );
        navigate(`/room/${res.data.roomId}`);
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
            console.log(res.data)
            if (res.data.isUsernameExist) {
                console.log('username is exist')
                // handle case when username is exist
            } else {
                navigate(`/room/${roomId}`);
            }
        })
    }

    function onPressHandler(username) {
        location.state.isCreateRoom ? createRoom() : joinRoom(username)
    }

    return (
        <Box>
            <NameInputDialog onPressHandler={onPressHandler} />
        </Box>
    )
}

export default InputNameScreen;