const BASE_URL = Deno.env.get("BASE_URL");
export function Login() {
  return (`
    <div class="middle">
      <div class="alert" id="alert" style="display:none">
        Login failed, please try again.
      </div>
      <h2>Login</h2>
      <form method="POST" action="${BASE_URL}/login">
        <label for="email" class="form-label">Email</label>
        <input type="email" name="email" placeholder="janedoe@mail.com" class="form-control"/>
        <label for="password" class="form-label">Password</label>
        <input type="password" name="password" class="form-control" placeholder="●●●●●●●"/>
        <input type="submit" value="Login"/>
        <input type="reset" value="Reset"/>
      </form>
    </div>
    <script>
      console.log("script loaded");
     if (window.location.hash.indexOf("#failed") !== -1) {
        var alertElement = document.getElementById("alert");
        alertElement.style.display = "block";

        setTimeout(function() {
            alertElement.style.display = "none";
        }, 5000);
    } 
    </script>
  `);
}
