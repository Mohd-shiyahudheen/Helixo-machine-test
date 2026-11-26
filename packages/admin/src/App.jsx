import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TimerList from "./pages/TimerList";
import TimerForm from "./pages/TimerForm";
import Analytics from "./pages/Analytics";
import Frame from "./components/Frame";

export default function App() {
  return (
    <BrowserRouter>
      <Frame>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timers" element={<TimerList />} />
          <Route path="/timers/new" element={<TimerForm />} />
          <Route path="/timers/:id" element={<TimerForm />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Frame>
    </BrowserRouter>
  );
}
