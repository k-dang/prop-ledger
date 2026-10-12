import { Client } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { query, connect, end } = vi.hoisted(() => {
  vi.stubEnv("DATABASE_URL", "postgres://test:test@localhost/test");
  return { query: vi.fn(), connect: vi.fn(), end: vi.fn() };
});

import { withTransaction } from "./index";

vi.spyOn(Client.prototype, "connect").mockImplementation(connect);
vi.spyOn(Client.prototype, "query").mockImplementation(query);
vi.spyOn(Client.prototype, "end").mockImplementation(end);

beforeEach(() => {
  vi.clearAllMocks();
  query.mockResolvedValue({ rows: [] });
  connect.mockResolvedValue(undefined);
  end.mockResolvedValue(undefined);
});

afterAll(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("request-scoped transactions", () => {
  it("closes the connection when starting the transaction fails", async () => {
    const failure = new Error("BEGIN failed");
    query.mockRejectedValueOnce(failure);
    const action = vi.fn();
    await expect(withTransaction(action)).rejects.toMatchObject({
      cause: failure,
    });
    expect(action).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledOnce();
  });

  it("closes the client and reports connection failures", async () => {
    const failure = new Error("Connection failed");
    connect.mockRejectedValueOnce(failure);
    const action = vi.fn();
    await expect(withTransaction(action)).rejects.toBe(failure);
    expect(action).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledOnce();
  });

  it("commits successful writes and closes the connection", async () => {
    const result = await withTransaction(async (tx) => {
      await tx.execute(sql`select 1`);
      return "saved";
    });
    expect(result).toBe("saved");
    expect(query.mock.calls.map(([command]) => command.text.trim())).toEqual([
      "begin",
      "select 1",
      "commit",
    ]);
    expect(connect).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledOnce();
  });

  it("rolls back failed writes before closing the connection", async () => {
    const failure = new Error("insert failed");
    await expect(
      withTransaction(async (tx) => {
        await tx.execute(sql`select 1`);
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(query.mock.calls.map(([command]) => command.text.trim())).toEqual([
      "begin",
      "select 1",
      "rollback",
    ]);
    expect(end).toHaveBeenCalledOnce();
    expect(query.mock.invocationCallOrder.at(-1)).toBeLessThan(
      end.mock.invocationCallOrder[0],
    );
  });
});
