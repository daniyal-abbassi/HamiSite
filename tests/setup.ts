import { beforeEach } from "vitest";
import { resetDb } from "./helpers/db";

beforeEach(async () => {
  await resetDb();
});
