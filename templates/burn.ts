export function Burn(url : string) {
  return `
<div class="middle" style="text-align: center">
  Here is your burnable URL: <p id="url" class="info">${url}</p>
  <button id="copy" class="button">Copy to Clipboard</button> 
</div>`;
}
