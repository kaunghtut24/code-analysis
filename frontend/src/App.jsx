import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Dashboard from "./components/Dashboard";
import RepositoryExplorer from "./components/RepositoryExplorer";
import CodeAnalyzer from "./components/CodeAnalyzer";
import CodeCanvas from "./components/CodeCanvas";
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import ChatDemo from "./components/ChatDemo";
import "./App.css";

function App() {
  const [githubToken, setGithubToken] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Load saved tokens from localStorage
    const savedGithubToken = localStorage.getItem("githubToken");
    const savedOpenaiKey = localStorage.getItem("openaiKey");

    if (savedGithubToken) setGithubToken(savedGithubToken);
    if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  githubToken={githubToken}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route
              path="/repositories"
              element={
                <RepositoryExplorer
                  githubToken={githubToken}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route
              path="/analyzer"
              element={
                <CodeAnalyzer
                  githubToken={githubToken}
                  openaiKey={openaiKey}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route
              path="/code-canvas"
              element={<CodeCanvas setSidebarOpen={setSidebarOpen} />}
            />
            <Route
              path="/settings"
              element={
                <Settings
                  githubToken={githubToken}
                  setGithubToken={setGithubToken}
                  openaiKey={openaiKey}
                  setOpenaiKey={setOpenaiKey}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route path="/chat-demo" element={<ChatDemo />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
