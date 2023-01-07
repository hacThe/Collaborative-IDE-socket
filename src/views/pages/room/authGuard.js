import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const CodeScreen = React.lazy(() => import("."));

function AuthGuard() {
  const username = useSelector((state) => state.app).username || sessionStorage.getItem('username');
  const pathname = useLocation().pathname
  const roomId = pathname.substring(pathname.lastIndexOf('/') + 1)

  return username ? <CodeScreen username={username} /> : <Navigate to="/inputName" replace state={{ 'isCreateRoom': false, 'roomId': roomId }} />;
}

export default AuthGuard;
