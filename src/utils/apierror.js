class ApiError extends Error {
    constructor(message, statusCode) {
        message = 'an error occurred';
        statusCode = statusCode || 500;
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.isOperational = true; // Indicates that this is an operational error
        this.timestamp = new Date().toISOString(); // Add a timestamp for better debugging
        this.stack = (new Error()).stack; // Capture the stack trace
        this.message = message; // Set the error message
        this.status = statusCode >= 500 ? 'error' : 'fail'; // Set status based on status code
        this.statusCode = statusCode; // Set the status code
        this.isOperational = true; // Operational errors are expected and can be handled gracefully
        this.error = {
            message: this.message,
            statusCode: this.statusCode,
            status: this.status,
            timestamp: this.timestamp,
            stack: this.stack
        };
        Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
        // Log the error details for debugging
        console.error(`Error: ${this.message}, Status Code: ${this.statusCode}, Timestamp
: ${this.timestamp}`);
        if (this.stack) {
            console.error(`Stack Trace: ${this.stack}`);
        }
    }
}

export default ApiError;

export const handleError = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
};