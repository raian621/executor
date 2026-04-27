import { createApp } from "./app";
import { DataStore } from "./datastore";

const PORT = 12345;

export const app = createApp(new DataStore());

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
