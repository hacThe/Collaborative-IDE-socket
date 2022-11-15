import { Route, Routes, Navigate } from "react-router-dom";
import routes from "../routes.js";
import React from "react";


const Routers = () => {
  return (
    <React.Suspense fallback={<h1>Loading...</h1>}>
      <Routes>
        {routes?.map((route, idx) => {
          return (
            route.element && (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}s
              />
            )
          );
        })}
      </Routes>
    </React.Suspense>
  );
};

export default Routers;
