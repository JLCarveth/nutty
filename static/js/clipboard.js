const button = document.getElementById("copy");
const codeBlock = document.getElementById("code-block");

button.onclick = async (event) => {
  event.preventDefault();
  try {
    let textToCopy = codeBlock.textContent;
    textToCopy = textToCopy.slice(0, -button.innerText.length);
    await navigator.clipboard.writeText(textToCopy);
    console.log(codeBlock.innerText.length + " characters copied to clipboard.");

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
}
