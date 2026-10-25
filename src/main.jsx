// Entry point. Prepare the stored data first, then load the app.
// The app is imported dynamically, so the Redux store is created after the data is ready.

import { prepareData } from "./api/bootstrap";
import { applyTheme, getTheme } from "./lib/theme";

async function start() {
  applyTheme(getTheme());
  try {
    await prepareData();
  } catch (error) {
    console.error("Could not prepare stored data", error);
  }
  const { mount } = await import("./mount");
  mount();
}

start();
