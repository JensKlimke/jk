import {API_ENV, PORT} from "./config/env";
import App, {init} from "./app";

init().then(() => {
  console.log('Database connected.')
});

App.listen(PORT, () => {
  console.log(`API server running on port ${PORT} in ${API_ENV} mode`);
});