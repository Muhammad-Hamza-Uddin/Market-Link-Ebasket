const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal server error';

  if (error.code === 11000) {
    statusCode = 409;
    message = 'An account with this email already exists';
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join('. ');
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Images must be 3 MB or smaller';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
  }

  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
