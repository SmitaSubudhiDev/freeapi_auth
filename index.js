const topbarHeading = document.getElementById("topbarHeading");
const topbarSubtitle = document.getElementById("topbarSubtitle");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authTabs = document.querySelectorAll(".auth-tab");
const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const authMessage = document.getElementById("authMessage");
const authSection = document.querySelector(".auth-section");
const profileSection = document.getElementById("profileSection");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const logoutBtn = document.getElementById("logoutBtn");

const authTokenKey = "freeapiAuthToken";
let authToken = localStorage.getItem(authTokenKey);
let profile = null;

function setActiveTab(mode) {
  authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  loginForm.classList.toggle("hidden", mode !== "login");
  registerForm.classList.toggle("hidden", mode !== "register");
}

function showMessage(message, type = "info") {
  authMessage.textContent = message;
  authMessage.style.color = type === "error" ? "#ff6b6b" : "#8fa6bb";
}

function updateAuthState() {
  const authenticated = Boolean(authToken);
  authSection.classList.toggle("hidden", authenticated);
  profileSection.classList.toggle("hidden", !authenticated);
  logoutBtn.classList.toggle("hidden", !authenticated);

  if (authenticated) {
    topbarHeading.textContent = profile?.name
      ? `Welcome back, ${profile.name}`
      : "Welcome back";
    topbarSubtitle.textContent = "Your profile is ready";
    profileName.textContent = profile?.name || "Profile";
    profileEmail.textContent =
      profile?.email || "Your profile details appear here.";
  } else {
    topbarHeading.textContent = "Sign in or register to continue";
    topbarSubtitle.textContent = "Welcome";
    profileName.textContent = "Profile";
    profileEmail.textContent = "Your profile details appear here.";
  }
}

async function apiRequest(path, body) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.text();
      return { error: error || `Request failed: ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    return { error: error.message || "Network error" };
  }
}

async function fetchProfile() {
  if (!authToken) {
    showMessage("Please log in first.", "error");
    return;
  }

  const response = await fetch(
    "https://api.freeapi.app/api/v1/users/current-user",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  
  if (!response.ok) {
    showMessage("Unable to load profile data.", "error");
    return;
  }

  profile = await response.json();
  updateAuthState();
  showMessage("Profile loaded successfully.");
}

function saveAuthToken(token) {
  authToken = token;
  localStorage.setItem(authTokenKey, token);
}

function clearAuthToken() {
  authToken = null;
  localStorage.removeItem(authTokenKey);
  profile = null;
}

async function handleLogin(event) {
  event.preventDefault();
  const username = loginForm.loginUsername.value.trim();
  const password = loginForm.loginPassword.value.trim();

  showMessage("Logging in...");
  const result = await apiRequest(
    "https://api.freeapi.app/api/v1/users/login",
    {
      username,
      password,
    },
  );

  if (result.error) {
    showMessage(result.error, "error");
    return;
  }

  const token = result.data?.accessToken || result.token;
  if (!token) {
    showMessage("Login completed, but no token returned.", "error");
    return;
  }

  saveAuthToken(token);
  profile = result.data?.profile || {
    name: username,
    email: result.data?.email || "",
  };
  await fetchProfile();
}

async function handleRegister(event) {
  event.preventDefault();
  const name = registerForm.registerName.value.trim();
  const email = registerForm.registerEmail.value.trim();
  const password = registerForm.registerPassword.value.trim();

  showMessage("Registering...");
  const result = await apiRequest(
    "https://api.freeapi.app/api/v1/users/register",
    {
      name,
      username: name,
      email,
      password,
      role: "ADMIN",
    },
  );

  if (result.error) {
    showMessage(result.error, "error");
    return;
  }

  const token = result.data?.accessToken || result.token;
  if (!token) {
    showMessage("Registration completed, but no token returned.", "error");
    return;
  }

  saveAuthToken(token);
  profile = { name, email };
  await fetchProfile();
}

function logOut() {
  clearAuthToken();
  updateAuthState();
  showMessage("Logged out successfully.");
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.dataset.mode);
    showMessage("");
  });
});

showLoginBtn.addEventListener("click", () => {
  setActiveTab("login");
  authSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

showRegisterBtn.addEventListener("click", () => {
  setActiveTab("register");
  authSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
logoutBtn.addEventListener("click", logOut);

setActiveTab("login");
updateAuthState();

if (authToken) {
  console.log("called auth token");
  fetchProfile();
}
