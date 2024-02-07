export function Burn(url : string) {
  return `
<div class="middle">
  Here is your burnable URL: <p id="url">${url}</p>
  <button id="copy">Copy to Clipboard</button> 
</div>`;
}
