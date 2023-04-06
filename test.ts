// Import and run the paste server
import "./paste.ts";

async function testVersion() {
  const expectedVersion = "0.5.0";
  const response = await fetch("http://localhost:5335/api/version");
  const actualVersion = await response.text();
  return expectedVersion === actualVersion;
}

let testsPassed = true;
const testResults = {
  "testVersion": await testVersion(),
};
console.log(
  "Running test testVersion: ",
  (testResults["testVersion"]) ? "Passed ✓" : "Failed ✗",
);

testsPassed = Object.values(testsPassed).every((value) => value === true);
Deno.exit(testsPassed ? 0 : 1);
