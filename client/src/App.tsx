import {Component, lazy} from 'solid-js';
import {Router} from "@solidjs/router";

const routes = [
    {
        path: "/",
        component: lazy(() => import("./pages/Home.tsx")),
    },
    {
        path: "/login",
        component: lazy(() => import("./pages/auth/Login.tsx")),
    },
    {
        path: "/signup",
        component: lazy(() => import("./pages/auth/Signup.tsx")),
    },
    {
        path: "*",
        component: lazy(() => import("./pages/NotFound.tsx")),
    }
]

const App: Component = () => {
  return (
      <Router>
        {routes}
      </Router>
  );
};

export default App;
