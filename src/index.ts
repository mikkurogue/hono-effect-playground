import { initLogger } from "evlog";
import { type EvlogVariables, evlog } from "evlog/hono";
import { Hono } from "hono";
import { users } from "./users";

initLogger({
	env: {
		service: "my-api",
	},
});

const app = new Hono<EvlogVariables>();

app.use(evlog());

app.get("/", (c) => {
	c.get("log").set({ route: "/" });
	return c.text("Hello Hono!");
});

app.route("/users", users);

export default app;
