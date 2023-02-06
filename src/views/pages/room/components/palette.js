import { useState } from 'react';
import Circle from '@uiw/react-color-circle/esm/index';
const USER_COLORS = [
    "#355ffa",
    "#0ac285",
    "#f85212",
    "#bf4545",
    "#e599a6",
    "#a28144",
    "#e08300",
    "#a545ee",
    "#6565cd",
    '#669999',
];

function UserPalette({ userToColor, userId, onChange }) {
    const [hex, setHex] = useState(userToColor[userId]);
    const userColors = USER_COLORS.map((color, index) => {
        return {
            color: color,
            title: color,
            disabled: userToColor[userId]?.toLowerCase() === color?.toLowerCase() ? false : isColorDisabled(color, userToColor),
        }
    })
    return (
        <Circle
            colors={userColors}
            color={hex}
            onChange={(color) => {
                setHex(color.hex);
                onChange(color.hex)
            }}
        />
    );
}

function isColorDisabled(color, rUserToColor) {
    const userToColor = new Map(Object.entries(rUserToColor))
    const values = Array.from(userToColor.values() ?? {}).map(item => item.toLowerCase())
    if (values.includes(color.toLowerCase())) {
        return true;
    }
    return false;
}

export default UserPalette;