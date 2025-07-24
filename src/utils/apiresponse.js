class ApiResponse {
    constructor(status, message, data = "success") {
        this.status = status;
        this.message = message;
        this.data = data;
        this.statusCode = status === "success" ? 200 : 400; // Default to 200 for success, 400 for error
        this.timestamp = new Date().toISOString(); // Add a timestamp for better debugging
        this.error = null; // Initialize error as null
        if (status !== "success") {
            this.error = {
                message: message,
                statusCode: this.statusCode,
                status: status,
                timestamp: this.timestamp
            };
        }
    }
}

export default ApiResponse;
export const successResponse = (res, message, data) => {
    const response = new ApiResponse("success", message, data);
    return res.status(200).json(response);
};
