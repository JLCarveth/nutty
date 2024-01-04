const resp = await fetch("/api/auth/status");

if (!resp.ok) {
  console.log(`Request failed. ${resp.status} ${resp.statusText}`);
}

const status = await resp.text();
console.log(status);
