const errorHandler = function (err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  console.log(`Error caught: ${err}`);

  //MongoDB bad onjectId error
  if (err.name === "CastError")
    error = { message: "Resource not found", statusCode: 404 };

  //MongoDB duplicate key error
  if (err.code === 11000) {
    console.log(err);
    error = { message: "Duplicate field value", statusCode: 400 };
  }

  //MongoDB validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors);
    error = { name: err.name, message, statusCode: 400 };
  }

  if (err.name === "ExpressValidatorError") {
    const message = err.validationErrors.map((err) => err.msg).join(", ");
    error = {
      name: err.name,
      message,
      statusCode: 400,
      errors: err.validationErrors,
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    name: err.name || "",
    message: error.message || "Server error",
    ...(error.errors && { errors: error.errors }),
  });
};

export default errorHandler;
