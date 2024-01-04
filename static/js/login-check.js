const resp = await fetch("/api/auth/status");

if (!resp.ok) {
  console.log(`Request failed. ${resp.status} ${resp.statusText}`);
}

const _status = await resp.text();

if (_status === "OK") {
  const welcomeElement = document.getElementById("welcome");
  welcomeElement.style.display = "block";
  welcomeElement.innerText = "Welcome back!";
}
