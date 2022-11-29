import React from "react";
const StartScreen = React.lazy(() => import("./views/pages/start"));
const AuthGuard = React.lazy(() => import("./views/pages/room/authGuard.js"));
const routes = [
    { path: "/", name: "Home", element: <StartScreen /> },
    { path: "/room/:roomId", name: "Home", element: <AuthGuard /> },
]
export default routes;