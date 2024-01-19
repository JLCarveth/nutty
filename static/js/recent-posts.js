/**
 * Fetches the most recent public pastes from `GET-/api/paste`
 * and updates a hidden element to display the pastes.
 */
const response = await fetch(`/api/paste`);
if (!response.ok) {
  throw new Error("Could not fetch recent posts.");
}
const posts = await response.json();

/* Update the #recent-posts HTML element */
const htmlElement = document.getElementById("recent-posts");
const list = document.createElement("ul");

const h1 = document.createElement("h1");
h1.innerText = 'Recent Posts';
htmlElement.appendChild(h1);

for (const uuid of posts) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.innerText = uuid;
  a.href = `/paste/${uuid}`;
  li.appendChild(a);
  list.appendChild(li);
}

htmlElement.style.display = "block";
htmlElement.appendChild(list);
