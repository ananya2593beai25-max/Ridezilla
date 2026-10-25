// Copy text to the clipboard. Works on https and localhost, with a fallback for older or stricter browsers.

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // The fallback: a hidden text box and the old copy command.
    try {
      const box = document.createElement("textarea");
      box.value = text;
      box.setAttribute("readonly", "");
      box.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.append(box);
      box.select();
      const ok = document.execCommand("copy");
      box.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
