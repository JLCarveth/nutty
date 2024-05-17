const button = document.getElementById("copy");
const codeBlock = document.getElementById("code-block");

let timeoutID;

button.onclick = async (event) => {
  event.preventDefault();
  if (timeoutID != null) return;
  try {
    const textToCopy = codeBlock.innerText;
    const originalIcon = button.querySelector("svg");
    await navigator.clipboard.writeText(textToCopy);
    console.log(
      codeBlock.innerText.length + " characters copied to clipboard.",
    );

    /* Briefly set the button text to indicate text was copied */
    button.innerText = "Copied!";
    const successIcon = document.createElement("svg");
    successIcon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard2-check" viewBox="0 0 16 16">\
  <path d="M9.5 0a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5.5.5 0 0 1 .5.5V2a.5.5 0 0 1-.5.5h-5A.5.5 0 0 1 5 2v-.5a.5.5 0 0 1 .5-.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5z"/>\
  <path d="M3 2.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 0 0-1h-.5A1.5 1.5 0 0 0 2 2.5v12A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 1H12a.5.5 0 0 0 0 1h.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z"/>\
  <path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0z"/>\
</svg>';
    button.innerHTML = '';
    button.appendChild(successIcon);
    successIcon.classList.add('copied-animation');

    // Clear any existing timeouts
    clearTimeout(timeoutID);

    timeoutID = setTimeout(() => {
      button.innerText = "";
      button.appendChild(originalIcon);
      timeoutID = null;
    }, 2500);
  } catch (_err) {
    button.innerText = "Something Went Wrong";
    timeoutID = setTimeout(() => {
      button.innerText = "";
      button.appendChild(originalIcon);
      timeoutID = null;
    }, 2500);
  }
};
