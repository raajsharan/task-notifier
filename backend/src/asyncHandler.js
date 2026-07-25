// Express 4 doesn't forward rejected promises from async handlers to error
// middleware on its own — this wrapper does that so failures always produce
// a response instead of hanging the request.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
