/**
 * Simple script to check if the frontend service is up and running
 */
const http = require("http");

const options = {
  host: "localhost",
  port: 8000,
  path: "/",
  timeout: 5000,
};

const request = http.get(options, (res) => {
  console.log(`Frontend healthcheck: Status ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", (err) => {
  console.error(`Frontend healthcheck failed: ${err.message}`);
  process.exit(1);
});

request.end();

request.on("error", (err) => {
  console.error("Frontend healthcheck error:", err);
  process.exit(1);
});

request.end();
