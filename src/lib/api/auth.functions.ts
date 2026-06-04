import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyPassword, issueSessionToken, verifySessionToken } from "../auth.server";

/** Attempt to unlock the app with a password. Returns a session token on success. */
export const unlockWithPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1).max(128) }))
  .handler(async ({ data }) => {
    const valid = await verifyPassword(data.password);
    if (!valid) {
      throw new Error("Incorrect password.");
    }
    return { token: issueSessionToken() };
  });

/** Check whether a session token is still valid */
export const checkSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    return { valid: verifySessionToken(data.token) };
  });
