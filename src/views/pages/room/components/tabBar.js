import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import InfoIcon from '@mui/icons-material/Info';
import MessageIcon from '@mui/icons-material/Message';
import { color } from '@mui/system';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            style={{ padding: '10px' }}
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                [children]
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function BasicTabs({ components, labels }) {
    const [value, setValue] = React.useState(0);
    const icons = [<InfoIcon />, <MessageIcon />]

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} color={'rgb(247, 235, 3)'} onChange={handleChange} aria-label="basic tabs example" centered TabIndicatorProps={{
                    style: {
                        backgroundColor: "rgb(247, 235, 3)"
                    }
                }}>
                    {labels.map((item, index) => {
                        return <Tab icon={icons[index]} key={index} {...a11yProps(index)} />
                    })}
                </Tabs>
            </Box>
            {components.map((item, index) => {
                return <TabPanel children={item} value={value} index={index} key={index} />
            })}
        </Box>
    );
}
