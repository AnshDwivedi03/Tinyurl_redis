const serverless = require("serverless-http");
const { app, initialize } = require("../server");

const handler = serverless(app);
let _initialized = false;
let _initPromise = null;

const ensureInit = async () => {
  console.log('ensureInit: called');
  if (_initialized) {
    console.log('ensureInit: already initialized');
    return;
  }
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    try {
      console.log('ensureInit: initializing...');
      await initialize();
      _initialized = true;
      console.log('ensureInit: initialization complete');
    } catch (err) {
      console.error('Initialization failed:', err);
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
