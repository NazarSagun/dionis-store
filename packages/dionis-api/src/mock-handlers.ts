import { getDefaultMock } from "./dionis/default/default.msw.js";
import { getDeleteUserMock } from "./dionis/delete-user/delete-user.msw.js";

export const handlers = [
  ...getDefaultMock(),
  ...getDeleteUserMock()
]