const express = require('express');
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const encryptLib = require('../modules/encryption');
const pool = require('../modules/pool');
const userStrategy = require('../strategies/user.strategy');

const router = express.Router();

// Handles Ajax request for user information if user is authenticated
router.get('/', rejectUnauthenticated, (req, res) => {
  // Send back user object from the session (previously queried from the database)
  res.send(req.user);
});

// Handles POST request with new user data
router.post('/register', (req, res, next) => {
  const { username, password, first_name, last_name, birthday } = req.body;

  // Encrypt the password
  const encryptedPassword = encryptLib.encryptPassword(password);
  console.log(username, first_name, last_name, birthday, encryptedPassword);

  // SQL query to insert new user with additional fields
  const queryText = `
    INSERT INTO "user" (username, password, first_name, last_name, birthday)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `;

  // Execute the query
  pool
    .query(queryText, [username, encryptedPassword, first_name, last_name, birthday])
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log('User registration failed: ', err);
      res.sendStatus(500);
    });
});

// Handles login form authenticate/login POST
// userStrategy.authenticate('local') is middleware that we run on this route
// this middleware will run our POST if successful
// this middleware will send a 404 if not successful
router.post('/login', userStrategy.authenticate('local'), (req, res) => {
  res.sendStatus(200);
});

// clear all server session information about this user
router.post('/logout', (req, res, next) => {
  // Use passport's built-in method to log out the user
  req.logout((err) => {
    if (err) { return next(err); }
    res.sendStatus(200);
  });
});

module.exports = router;
