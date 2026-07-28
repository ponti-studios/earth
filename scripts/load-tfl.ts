import "dotenv/config";
import { populateTflCameras } from "~/db/loaders";

populateTflCameras().catch((error) => {
  console.error("TFL population failed:", error);
  process.exit(1);
});
