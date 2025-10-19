import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Practice from "./pages/practice";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/practice" element={<Practice />} />
      </Routes>
    </BrowserRouter>
  );
}
