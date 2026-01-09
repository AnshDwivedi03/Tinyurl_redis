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
  await ensureInit();
  return handler(req, res);
};
