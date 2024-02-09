const url = document.getElementById("url");
const button = document.getElementById("copy");

button.onclick = async (event) => {
  event.preventDefault();
  try {
    await navigator.clipboard.writeText(url.textContent);

    /* Briefly set the button text to indicate text was copied */
    const buttonText = button.innerText;
    button.innerText = "Copied!";
    setTimeout(() => {
      button.innerText = buttonText;
    }, 2500);
  } catch (_err) {
    const buttonText = button.innerText;
    button.innerText = "Something Went Wrong";
    setTimeout(() => {
      button.innerText = buttonText;
    }, 2500);
  }
};
