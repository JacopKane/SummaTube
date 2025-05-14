// Simple script to check connectivity to backend
const http = require("http");
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://backend:8001/api";

console.log(`Attempting to connect to backend at: ${BACKEND_URL}`);

// Extract hostname and path from URL
const url = new URL(BACKEND_URL);
const options = {
  hostname: url.hostname,
  port: url.port || 80,
  path: url.pathname,
  method: "GET",
};

console.log(
  `Connecting to: ${options.hostname}:${options.port}${options.path}`
);

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

  res.on("data", (chunk) => {
    console.log(`BODY: ${chunk}`);
  });

  res.on("end", () => {
    console.log("Connection test completed successfully");
  });
});

req.on("error", (e) => {
  console.error(`Connection test failed: ${e.message}`);
});

req.end();
