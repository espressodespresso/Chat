import {Component, lazy} from 'solid-js';
import {Router} from "@solidjs/router";

const routes = [
    {
        path: "/",
        component: lazy(() => import("./pages/Home.tsx")),
    },
    {
        path: "/auth",
        component: lazy(() => import("./pages/Auth.tsx")),
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
