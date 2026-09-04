import "./instrument.js"; // must load first — see Sentry Node SDK setup

import { app, installProcessCrashGuards } from "./app.js";

installProcessCrashGuards();

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`RotiRadar API listening on :${port}`);
});
