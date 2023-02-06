import React from "react";
const StartScreen = React.lazy(() => import("./views/pages/start"));
const AuthGuard = React.lazy(() => import("./views/pages/room/authGuard.js"));
const InputNameScreen = React.lazy(() => import("./views/pages/roomConfiguration"))


const routes = [
    { path: "/", name: "Home", element: <StartScreen /> },
    { path: "/inputName", name: "Input Name", element: <InputNameScreen /> },
    { path: "/room/:roomId", name: "Room", element: <AuthGuard /> },
]
export default routes;