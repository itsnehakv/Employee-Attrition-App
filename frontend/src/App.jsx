import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Predictionform from "./components/Predictionform";
import { useState } from "react";
import ReportsDashboard from "./components/ReportsDashboard";

function App() {
  const [prediction, setPrediction] = useState(null);
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto pt-4">
        <Navbar />
      </div>

      <main className="max-w-7xl mx-auto mt-12 px-6">
        <Routes>
          {/* HOME VIEW */}
          <Route
            path="/dashboard"
            element={
              <div className="flex flex-col items-center justify-center mt-32 text-center px-4">
                <h1 className="text-6xl font-bold text-white tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  Predict Employee Attrition <br />
                  <span className="text-blue-500">With AI Precision.</span>
                </h1>
                <p className="text-slate-400 max-w-2xl text-lg animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  Upload your workforce data and let our Machine Learning models
                  identify flight risks before they happen.
                </p>
              </div>
            }
          />
          {/* PREDICTOR VIEW */}
          <Route
            path="/predictor"
            element={<Predictionform setGlobalPrediction={setPrediction} />}
          />{" "}
          {/* REPORTS */}
          <Route
            path="/reports"
            element={<ReportsDashboard prediction={prediction} />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
