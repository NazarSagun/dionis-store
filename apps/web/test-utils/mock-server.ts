import { setupServer} from "msw/node";
import { handlers } from "@repo/dionis-api/src/dionis/mock-handlers";

export const serviceWorker = setupServer(...handlers);