import { HashRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Level1Page from "./pages/Level1Page";
import Level2Page from "./pages/Level2Page";
import Level3Page from "./pages/Level3Page";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/level/1" element={<Level1Page />} />
        <Route path="/level/2" element={<Level2Page />} />
        <Route path="/level/3" element={<Level3Page />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
