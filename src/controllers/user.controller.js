import asyncHandler from '../utils/asynchandler.js';

const registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Here you would typically add logic to save the user to a database
  // For demonstration purposes, we'll just return a success message
    // if (!username || !password) {
    //   return res.status(400).json({ error: 'Username and password are required.' });
    // }

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      username,
      // Password should never be returned in a real application
    },
  });
}
);

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Here you would typically add logic to authenticate the user
  // For demonstration purposes, we'll just return a success message
//   if (!username || !password) {
//     return res.status(400).json({ error: 'Username and password are required.' });
//   }

  res.status(200).json({
    message: 'User logged in successfully',
    user: {
      username,
      // Password should never be returned in a real application
    },
  });
});
export { registerUser, loginUser };
