import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import cookieParser from 'cookie-parser'
import { usersRouter } from './routes'
import { corsOptions } from './config'
import { verifyCredentials } from './middleware'
import { CLIENT_RENEG_LIMIT } from 'tls'

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express()
const PORT = process.env.PORT || 3500

app.use(passport.initialize());

// app.use(verifyCredentials)
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

// Configure Google OAuth 2.0 strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
  // Here, you would typically check if the user already exists in your database
  // If not, you would create a new user record based on the profile information
  // Then, call the `done` callback with the user object
  return done(null, profile);
}
));

// Routes for initiating authentication
app.get('/auth/google',
passport.authenticate('google', { scope: ['profile', 'email'] }));

// Route for handling authentication callback
app.get('/auth/google/callback', 
passport.authenticate('google', { failureRedirect: '/login' }),
(req, res) => {
  // Successful authentication, redirect to success page or perform further actions
  res.redirect('/');
});

app.use('/api', authRouter)
app.use('/api', usersRouter)

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
