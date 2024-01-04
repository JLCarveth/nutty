const resp = await fetch("/api/auth/status");

if (!resp.ok) {
  console.log(`Request failed. ${resp.status} ${resp.statusText}`);
}

const _status = await resp.text();

if (_status === "OK") {
  const welcomeElement = document.getElementById("welcome");
  welcomeElement.innerText = "Welcome back!";

  const logoutLink = document.createElement('a');
  logoutLink.href = "#";
  logoutLink.innerText = "Logout";
  logoutLink.onclick = logout;

  welcomeElement.parentElement.appendChild(logoutLink);
}

async function logout() {
  const resp = await fetch(`/api/logout`, { method: "POST" });
  if (!resp.ok) {
    console.error(`Error logging out. ${resp.status} ${resp.statusText}`);
  }

  if (resp.redirected) {
    window.location = resp.url;
  }
}
