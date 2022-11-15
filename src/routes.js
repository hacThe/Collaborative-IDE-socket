import React from "react";
const StartScreen = React.lazy(() => import("./views/pages/start"));
const CodeScreen = React.lazy(() => import("./views/pages/room"));
const routes = [
    { path: "/", name: "Home", element: <StartScreen /> },
    { path: "/room/:roomId", name: "Home", element: <CodeScreen /> },
]
export default routes;