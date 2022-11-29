import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
const CodeScreen = React.lazy(() => import("."));


function AuthGuard(props) {
  const username = useSelector((state) => state.app).username;

  return username ? <CodeScreen /> : <Navigate to="/" replace />;
}

export default AuthGuard;
