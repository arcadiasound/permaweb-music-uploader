import { RouterProvider, createHashRouter } from "react-router-dom";
import { AppRouter } from "./router";
import { Home } from "./modules/home";
import { Upload } from "./modules/upload";

const router = createHashRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/upload",
    element: <Upload />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
