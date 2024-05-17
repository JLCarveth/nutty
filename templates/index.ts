export function Index() {
  return `
    <form action="/api/paste" method="post">
      <textarea name="text" placeholder="Enter your message here" rows="20" required></textarea><br>
      <div class="burn">
        <input type="checkbox" id="burn" name="burn" value="true">
        <label for="burn">Burn after reading</label><br>
      </div>
      <div class="buttons">
        <button type="submit" class="inset" value="Submit">Submit</button>
        <button type="reset" value="Reset">Reset</button>
      </div>
    </form>
    <div id="recent-posts" class="recent-posts"></div>`;
}
