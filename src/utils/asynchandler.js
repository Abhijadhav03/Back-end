// const ansychandler = (fn) => () => {
//     return fn()
//         .then((result) => {
//             return result;
//         })
//         .catch((error) => {
//             console.error('Error occurred:', error);
//             throw error; // Re-throw the error for further handling
//         });
// };

// export default ansychandler;

// const asynchandler1 = (fn) => async (req, res, next) => {
//     try {
//         return await fn(req, res, next)
//             .then((result) => {
//                 return result;
//             })
//             .catch((error) => {
//                 res.status(500).json({ error: 'Internal Server Error' });
//                 // Log the error for debugging purposes 
//                 // You can also use a logging library like Winston or Morgan for better logging
//                 console.error('Error occurred:', error);
//                 next(error); // Pass the error to the next middleware
//             });
//     } catch (error) {
//         console.error('Error occurred:', error);
//         next(error); // Pass the error to the next middleware
//     }

    const asyncHandler =(requesthandler) => async(req, res, next) => {
        Promise.resolve(requesthandler(req, res, next))
            .then((result) => {
                return result;
            })
            .catch((error) => {
                res.status(500).json({ error: 'Internal Server Error' });
                // Log the error for debugging purposes 
                // You can also use a logging library like Winston or Morgan for better logging
                console.error('Error occurred:', error);
                next(error); // Pass the error to the next middleware
            });
    }

//     const asyncHandler = (handler) => async (req, res, next) => {
//     Promise.resolve(handler(req, res, next)).catch(next);
// };

export default asyncHandler;
