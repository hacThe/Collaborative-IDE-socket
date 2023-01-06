import { useState } from 'react';
import Circle from '@uiw/react-color-circle';

const USER_COLORS = [
    "#355FFA",
    "#0ac285",
    "#F85212",
    "#bf4545",
    "#e599a6",
    "#a28144",
    "#e08300",
    "#A545EE",
    "#6565cd",
    '#669999',
];
const USER_DEFAULT_COLOR = "#808080";

function UserPalette({ userToColor }) {
    const [hex, setHex] = useState('#355FFA');
    return (
        <Circle
            colors={USER_COLORS}
            color={hex}
            onChange={(color) => {
                setHex(color.hex);
            }}
        />
    );
}
export default UserPalette;