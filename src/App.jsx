import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Questionnaire from "./pages/Questionnaire";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Questionnaire" element={<Questionnaire />} />
      </Routes>
    </BrowserRouter>
  );
}
