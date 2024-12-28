class APIError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
    success = false,
    data = ""
  ) {
    super();

    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = success;
    this.errors = errors;

    if (this.stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { APIError };
