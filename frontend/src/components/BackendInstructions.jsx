import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  CheckCircle,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronRight,
  Server,
  Play,
} from "lucide-react";

export default function BackendInstructions({ isVisible = false, onClose }) {
  const [expandedSection, setExpandedSection] = useState("quick-start");
  const [copiedStep, setCopiedStep] = useState(null);

  const handleCopy = async (text, stepId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(stepId);
      setTimeout(() => setCopiedStep(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Server className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Backend Setup Instructions
              </h2>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Status Alert */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                Backend Server Required
              </span>
            </div>
            <p className="text-yellow-700 mt-2">
              The Python Flask backend is not running. Follow these steps to
              start it and enable full AI functionality.
            </p>
          </div>

          {/* Quick Start Section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("quick-start")}
              className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  Quick Start (Recommended)
                </span>
              </div>
              {expandedSection === "quick-start" ? (
                <ChevronDown className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-blue-600" />
              )}
            </button>

            {expandedSection === "quick-start" && (
              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Terminal className="w-4 h-4 mr-2" />
                    Step 1: Navigate to backend directory
                  </h4>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-black text-green-400 p-3 rounded font-mono text-sm">
                      cd backend
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy("cd backend", "step1")}
                    >
                      {copiedStep === "step1" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Terminal className="w-4 h-4 mr-2" />
                    Step 2: Install Python dependencies
                  </h4>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-black text-green-400 p-3 rounded font-mono text-sm">
                      pip install -r requirements.txt
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopy("pip install -r requirements.txt", "step2")
                      }
                    >
                      {copiedStep === "step2" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Terminal className="w-4 h-4 mr-2" />
                    Step 3: Start the Flask server
                  </h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <code className="flex-1 bg-black text-green-400 p-3 rounded font-mono text-sm">
                      python src/main.py
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy("python src/main.py", "step3")}
                    >
                      {copiedStep === "step3" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Alternative:{" "}
                    <code className="bg-gray-200 px-1 rounded">
                      python -m src.main
                    </code>
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">
                    ✅ Success Indicators:
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Server starts on http://localhost:5000</li>
                    <li>• No more "connection failed" errors</li>
                    <li>• Yellow status indicator turns green</li>
                    <li>• "Mock Mode" banner disappears</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Troubleshooting Section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("troubleshooting")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  Troubleshooting
                </span>
              </div>
              {expandedSection === "troubleshooting" ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {expandedSection === "troubleshooting" && (
              <div className="mt-4 space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">
                    🐍 Python not found?
                  </h4>
                  <p className="text-red-700 text-sm mb-2">
                    Try these commands:
                  </p>
                  <div className="space-y-2">
                    <code className="block bg-black text-green-400 p-2 rounded font-mono text-sm">
                      python3 src/main.py
                    </code>
                    <code className="block bg-black text-green-400 p-2 rounded font-mono text-sm">
                      py src/main.py
                    </code>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">
                    📦 Dependencies missing?
                  </h4>
                  <p className="text-red-700 text-sm mb-2">
                    Try these installation methods:
                  </p>
                  <div className="space-y-2">
                    <code className="block bg-black text-green-400 p-2 rounded font-mono text-sm">
                      pip3 install -r requirements.txt
                    </code>
                    <code className="block bg-black text-green-400 p-2 rounded font-mono text-sm">
                      python -m pip install -r requirements.txt
                    </code>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">
                    🔌 Port 5000 already in use?
                  </h4>
                  <p className="text-red-700 text-sm">
                    Kill existing processes or change port in main.py
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Current Status */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">
              📊 Current Status:
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Frontend:</span>
                <span className="ml-2 text-green-600 font-medium">
                  ✅ Running (Port 3000)
                </span>
              </div>
              <div>
                <span className="text-blue-700">Backend:</span>
                <span className="ml-2 text-red-600 font-medium">
                  ❌ Not Running (Port 5000)
                </span>
              </div>
              <div>
                <span className="text-blue-700">API Mode:</span>
                <span className="ml-2 text-yellow-600 font-medium">
                  🔧 Mock (Testing only)
                </span>
              </div>
              <div>
                <span className="text-blue-700">AI Features:</span>
                <span className="ml-2 text-yellow-600 font-medium">
                  ⚠️ Limited (Mock responses)
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Mock mode provides limited functionality
              for testing the interface. Start the backend server for full
              AI-powered code analysis and improvements.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
