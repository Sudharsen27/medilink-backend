const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/auth");

describe("auth protect middleware", () => {
  const secret = process.env.JWT_SECRET || "test-secret";
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  const runProtect = (req) =>
    new Promise((resolve) => {
      const res = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.body = payload;
          resolve({ statusCode: this.statusCode, body: payload });
        },
      };
      protect(req, res, () => resolve({ statusCode: 200, body: null, next: true }));
    });

  test("rejects missing token", async () => {
    const result = await runProtect({ headers: {} });
    expect(result.statusCode).toBe(401);
    expect(result.body.success).toBe(false);
  });

  test("accepts valid bearer token", async () => {
    const token = jwt.sign({ id: 1, role: "user" }, secret);
    const result = await runProtect({
      headers: { authorization: `Bearer ${token}` },
    });
    expect(result.next).toBe(true);
  });

  test("rejects invalid token", async () => {
    const result = await runProtect({
      headers: { authorization: "Bearer not-a-real-token" },
    });
    expect(result.statusCode).toBe(403);
  });
});
