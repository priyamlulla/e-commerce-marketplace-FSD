const assert = require("node:assert/strict");
const { test } = require("node:test");
const errorMiddleware = require("../middleware/errorMiddleware");

function responseRecorder() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("business conflicts return the safe actionable message", () => {
  const response = responseRecorder();
  errorMiddleware(
    { message: "Product stock changed during checkout. Refresh your cart and try again.", statusCode: 409 },
    {},
    response,
    () => {},
  );

  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.body, {
    message: "Product stock changed during checkout. Refresh your cart and try again.",
  });
});

test("duplicate database key errors do not expose database details", () => {
  const response = responseRecorder();
  errorMiddleware({ code: 11000, message: "duplicate key value: private details" }, {}, response, () => {});

  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.body, { message: "A resource with these details already exists" });
});

test("unexpected errors do not expose internal messages", () => {
  const response = responseRecorder();
  errorMiddleware({ message: "private database connection details" }, {}, response, () => {});

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { message: "Internal server error" });
});
