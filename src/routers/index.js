import { Route, Routes } from "react-router-dom";

import routes from "../routes.js";
import React from "react";
import LoadingScreen from "../views/pages/loading/index.js";


const Routers = () => {
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Routes>
        {routes?.map((route, idx) => {
          return (
            route.element && (
              <Route
                key={route.path}
                path={route.path}
                element={route.element} s
              />
            )
          );
        })}
      </Routes>
    </React.Suspense>
  );
};

export default Routers;
