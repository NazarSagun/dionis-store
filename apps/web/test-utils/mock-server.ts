import { setupServer} from "msw/node";
import { handlers } from "@repo/dionis-api/src/mock-handlers";

export const serviceWorker = setupServer(...handlers);