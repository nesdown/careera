import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Questionnaire from "./pages/Questionnaire";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Success from "./pages/Success";
import Waitlist from "./pages/Waitlist";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Questionnaire" element={<Questionnaire />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/success" element={<Success />} />
        <Route path="/waitlist" element={<Waitlist />} />
      </Routes>
    </BrowserRouter>
  );
}
