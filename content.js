console.log("Quiz Lockdown Extension is active.");

let strikeCount = 0;
const maxStrikes = 3;
let isNavigating = false;

// Detect clicks on buttons (like "Next", "Back", "Submit") to create a 1.5-second grace period
document.addEventListener("click", (event) => {
  const button = event.target.closest('div[role="button"], button');
  if (button) {
    isNavigating = true;
    setTimeout(() => {
      isNavigating = false;
    }, 1500);
  }
}, true);

// Function to handle violations with a 3-strike system
function triggerViolation(reason) {
  if (isNavigating) {
    console.log("Ignored false violation during page navigation:", reason);
    return;
  }

  strikeCount++;

  if (strikeCount < maxStrikes) {
    // Warnings for Strike 1 and 2: Show the overlay again so they can click back into fullscreen
    alert(`⚠️ WARNING ${strikeCount}/${maxStrikes}: ${reason}\nYou must return to full-screen mode to continue.`);
    createFullscreenOverlay(`Warning ${strikeCount}/${maxStrikes}: Exited Fullscreen`, "Return to Fullscreen");
  } else {
    // Final Strike (Strike 3)
    alert(`❌ STRIKE ${maxStrikes}/${maxStrikes}: ${reason}\nMaximum violations reached. Submitting quiz now.`);

    const submitButton = document.querySelector('div[role="button"] span');
    if (submitButton && (submitButton.textContent.includes("Submit") || submitButton.textContent.includes("Send"))) {
      const parentButton = submitButton.closest('div[role="button"]');
      if (parentButton) {
        parentButton.click();
      }
    }

    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "terminate_quiz" });
    }, 1000);
  }
}

// Reusable function to create the fullscreen overlay button
function createFullscreenOverlay(titleText = "Quiz Lockdown Enabled", buttonText = "Start Quiz (Enter Fullscreen)") {
  if (document.getElementById("quiz-lockdown-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "quiz-lockdown-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.color = "white";
  overlay.style.fontFamily = "Arial, sans-serif";

  overlay.innerHTML = `
    <h1 style="margin-bottom: 20px;">${titleText}</h1>
    <p style="margin-bottom: 30px; font-size: 18px;">You must be in full-screen mode to take this quiz. (Strikes: ${strikeCount}/${maxStrikes})</p>
    <button id="start-quiz-btn" style="padding: 12px 24px; font-size: 16px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">${buttonText}</button>
  `;

  document.body.appendChild(overlay);

  document.getElementById("start-quiz-btn").addEventListener("click", () => {
    document.documentElement.requestFullscreen().then(() => {
      overlay.remove();
    }).catch(err => {
      alert("Error entering full screen: " + err.message);
    });
  });
}

// Initial load overlay
window.addEventListener("load", () => {
  setTimeout(() => {
    createFullscreenOverlay("Quiz Lockdown Enabled", "Start Quiz (Enter Fullscreen)");
    enableMonitoring();
  }, 500);
});

function enableMonitoring() {
  console.log("Lockdown monitoring active.");

  // 1. TAB SWITCH / MINIMIZE DETECTION
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      triggerViolation("Switched to another tab or minimized browser!");
    }
  });

  // 2. FULLSCREEN EXIT DETECTION
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      triggerViolation("Exited full-screen mode!");
    }
  });
}