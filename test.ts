// Set the DB_NAME env var to the test database
Deno.env.set("DB_NAME", "test.db");

// Import and run the paste server
import "./paste.ts";
import { PORT, version } from "./paste.ts";

const baseURL = `http://localhost:${PORT}`;
const testUser = { uuid: "", password: "password" };

function isValidUUID(uuid: string) {
  const regex = new RegExp(
    "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    "i",
  );
  return regex.test(uuid);
}

async function testVersion() {
  const expectedVersion = version;
  const response = await fetch(`${baseURL}/api/version`);
  const actualVersion = await response.text();
  return expectedVersion === actualVersion;
}

async function testRegister() {
  // Test registration with missing params
  const noParams = await fetch(`${baseURL}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  console.assert(
    noParams.status === 400,
    "Expected status was 400, server returned %d",
    noParams.status,
  );

  // Register a test account, expect UUID
  const registered = await fetch(`${baseURL}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "password": testUser.password,
    }),
  });

  testUser.uuid = await registered.text();

  console.assert(
    registered.status === 200,
    "Expected status was 200, server returned %d",
    registered.status,
  );

  console.assert(isValidUUID(testUser.uuid), "Invalid UUID %s", testUser.uuid);
  return registered.status === 200 && noParams.status === 400;
}

async function testLogin() {
  // Test login with no params
  const noParams = await fetch(`${baseURL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  console.assert(
    noParams.status === 400,
    "Expected status to be 400, server returned %d",
    noParams.status,
  );

  // Test login with invalid password
  const invalid = await fetch(`${baseURL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userid: testUser.uuid, password: "WRONGPASSWORD" }),
  });

  console.assert(
    invalid.status === 401,
    "Expected status to be 401, server returned %d",
    invalid.status,
  );
  return noParams.status === 400 && invalid.status === 401;
}

const testResults = {
  "testVersion": await testVersion(),
  "testRegister": await testRegister(),
  "testLogin": await testLogin(),
};

console.log(
  "Running test testVersion: ",
  (testResults["testVersion"]) ? "Passed ✓" : "Failed ✗",
);

console.log(
  "Running test testRegister: ",
  (testResults["testRegister"]) ? "Passed ✓" : "Failed ✗",
);

console.log(
  "Running test testLogin: ",
  (testResults["testLogin"]) ? "Passed ✓" : "Failed ✗",
);

Deno.exit(
  (Object.values(testResults).every((value) => value === true)) ? 0 : 1,
);
