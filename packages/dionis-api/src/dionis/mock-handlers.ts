import { getDefaultMock } from "./default/default.msw.js";
import { getDeleteUserMock } from "./delete-user/delete-user.msw.js";

export const handlers = [
  ...getDefaultMock(),
  ...getDeleteUserMock()
]