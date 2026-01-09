const serverless = require("serverless-http");
const { app, initialize } = require("../server");

const handler = serverless(app);
let _initialized = false;
let _initPromise = null;

const ensureInit = async () => {
  if (_initialized) return;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    try {
      await initialize();
      _initialized = true;
    } catch (err) {
      console.error("Initialization failed:", err);
      // proceed anyway; requests may fail but we don't want to crash the lambda
    }
  })();
  return _initPromise;
};

module.exports = async (req, res) => {
  try {
    await ensureInit();
    return handler(req, res);
  } catch (err) {
    console.error("Unhandled handler error:", err);
    // Provide a small, non-sensitive error response to aid debugging in logs
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
};
