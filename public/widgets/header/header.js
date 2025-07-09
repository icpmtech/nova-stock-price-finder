
import { state }        from "../../utils/state.js";
import { t, setLang }   from "../../utils/i18n.js";
import { setCurrency }  from "../../utils/format.js";

export async function renderHeader() {
  const host = document.getElementById("headerContainer");
  if (!renderHeader.template) {
    const res = await fetch("widgets/header/header.html");
    renderHeader.template = await res.text();
  }
  host.innerHTML = renderHeader.template;

  // i18n
  document.getElementById("title").textContent    = t("title");
  document.getElementById("subtitle").textContent = t("subtitle");

  // selectors state
  document.getElementById("languageSelect").value = state.currentLang;
  document.getElementById("currencySelect").value = state.currentCurrency;

  // events
  document.getElementById("languageSelect").onchange = e => setLang(e.target.value);
  document.getElementById("currencySelect").onchange = e => setCurrency(e.target.value);
  document.getElementById("darkToggle").onclick = () => {
    state.isDark = !state.isDark;
    document.documentElement.classList.toggle("dark", state.isDark);
    const icon = document.querySelector("#darkToggle svg");
    icon.setAttribute("data-lucide", state.isDark ? "sun" : "moon");
    lucide.createIcons();
  };

  lucide.createIcons();
}

window.addEventListener("langChanged", renderHeader);
