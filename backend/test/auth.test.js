const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { after, mock, test } = require("node:test");
const User = require("../models/User");
const {
  AUTH_COOKIE,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
} = require("../controllers/userController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "test-only-secret-that-is-never-used-outside-tests";
after(() => {
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    cookies: {},
    clearedCookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    cookie(name, value, options) {
      this.cookies[name] = { value, options };
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookies.push({ name, options });
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

function userRecord(overrides = {}) {
  return {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    name: "Test User",
    email: "test@example.invalid",
    role: "user",
    ...overrides,
  };
}

test("registration always creates a normal user and never returns a password", async (t) => {
  let created;
  t.mock.method(User, "findOne", async () => null);
  t.mock.method(User, "create", async (document) => {
    created = document;
    return userRecord({ name: document.name, email: document.email, role: document.role });
  });

  const response = responseRecorder();
  await registerUser({
    body: {
      name: " Test User ",
      email: " TEST@example.invalid ",
      password: "example-password",
      role: "admin",
    },
  }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(created.role, "user");
  assert.equal(created.email, "test@example.invalid");
  assert.ok(created.password.startsWith("$2"));
  assert.equal(response.body.user.role, "user");
  assert.equal("password" in response.body.user, false);
});

test("registration rejects duplicate accounts without creating a user", async (t) => {
  t.mock.method(User, "findOne", async () => userRecord());
  const create = t.mock.method(User, "create", async () => assert.fail("duplicate account must not be created"));
  const response = responseRecorder();

  await registerUser({
    body: { name: "Test User", email: "test@example.invalid", password: "example-password" },
  }, response);

  assert.equal(response.statusCode, 409);
  assert.equal(create.mock.callCount(), 0);
});

test("login sets an HttpOnly cookie and returns only safe user details", async (t) => {
  const passwordHash = await bcrypt.hash("example-password", 4);
  const user = userRecord({ password: passwordHash, role: "admin" });
  t.mock.method(User, "findOne", () => ({ select: async () => user }));
  const response = responseRecorder();

  await loginUser({ body: { email: user.email, password: "example-password" } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.user.role, "admin");
  assert.equal("token" in response.body, false);
  assert.equal("password" in response.body.user, false);
  assert.equal(response.cookies[AUTH_COOKIE].options.httpOnly, true);
  assert.equal(response.cookies[AUTH_COOKIE].options.sameSite, "lax");
  assert.equal(jwt.verify(response.cookies[AUTH_COOKIE].value, process.env.JWT_SECRET).role, "admin");
});

test("login rejects an invalid password without setting a session", async (t) => {
  const passwordHash = await bcrypt.hash("example-password", 4);
  t.mock.method(User, "findOne", () => ({
    select: async () => userRecord({ password: passwordHash }),
  }));
  const response = responseRecorder();

  await loginUser({
    body: { email: "test@example.invalid", password: "incorrect-password" },
  }, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { message: "Invalid email or password" });
  assert.equal(Object.keys(response.cookies).length, 0);
});

test("authentication rejects stale role claims and checks current database role", async (t) => {
  const token = jwt.sign(
    { userId: "507f1f77bcf86cd799439011", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1m" },
  );
  t.mock.method(User, "findById", () => ({
    select: async () => userRecord({ role: "user" }),
  }));
  const response = responseRecorder();
  let nextCalled = false;

  await authenticateToken({
    cookies: { [AUTH_COOKIE]: token },
    get: () => undefined,
  }, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("profile returns safe user details in the session API response shape", async (t) => {
  const user = userRecord({ phone: "1234567890" });
  t.mock.method(User, "findById", async () => user);
  const response = responseRecorder();

  await getProfile({ user: { userId: user._id.toString() } }, response);

  assert.equal(response.body.user.id, user._id.toString());
  assert.equal(response.body.user.phone, "1234567890");
  assert.equal("password" in response.body.user, false);
});

test("admin authorization rejects a normal user", async (t) => {
  const middleware = authorizeRoles("admin");
  const response = responseRecorder();
  let nextCalled = false;

  await middleware({ user: { userId: "507f1f77bcf86cd799439011", role: "user" } }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("admin authorization accepts an authenticated admin", () => {
  const middleware = authorizeRoles("admin");
  const response = responseRecorder();
  let nextCalled = false;

  middleware({ user: { userId: "507f1f77bcf86cd799439011", role: "admin" } }, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test("logout clears the session cookie", () => {
  const response = responseRecorder();
  logoutUser({}, response);

  assert.equal(response.statusCode, 204);
  assert.equal(response.clearedCookies[0].name, AUTH_COOKIE);
  assert.equal(response.clearedCookies[0].options.httpOnly, true);
});
