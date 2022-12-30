import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import InfoIcon from '@mui/icons-material/Info';
import MessageIcon from '@mui/icons-material/Message';
import { color } from '@mui/system';
import { Badge } from '@mui/material';
import scrollMessageListToBottom from '../utility';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
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

export default function BasicTabs({ tabIndexRef, components, labels, dotState, setDotState }) {
    const icons = [<InfoIcon />, <MessageIcon />]
    const [tabIndex, setTabIndex] = React.useState(0)
    const handleChange = (event, newValue) => {
        if (newValue === 1) {
            setDotState(true)
        }
        setTabIndex(newValue)
        tabIndexRef.current = newValue
    };

    React.useEffect(() => {
        if (tabIndex === 1) {
            scrollMessageListToBottom()
        }
    }, [tabIndex])

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: '#2e2e2e' }}>
                <Tabs value={tabIndex} color={'rgb(247, 235, 3)'} onChange={handleChange} aria-label="basic tabs example" centered TabIndicatorProps={{
                    style: {
                        backgroundColor: "rgb(247, 235, 3)"
                    }
                }}>
                    {labels.map((item, index) => {
                        var icon = index === 1 ? <Badge invisible={dotState} variant='dot' color='info'> {icons[index]} </Badge> : icons[index]

                        return <Tab sx={{ width: '50%' }} icon={icon} key={index} {...a11yProps(index)} />
                    })}
                </Tabs>
            </Box>
            {components.map((item, index) => {
                return <TabPanel children={item} value={tabIndex} index={index} key={index} />
            })}
        </Box>
    );
}
