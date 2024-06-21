import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import cookieParser from 'cookie-parser'
import { gamesRouter, usersRouter } from './routes'
import { corsOptions } from './config'
import { verifyCredentials } from './middleware'

const app = express()
const PORT = process.env.PORT || 3500

app.use(cors(corsOptions))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

app.use(verifyCredentials)

app.use('/api', authRouter)
app.use('/api', usersRouter)
app.use('/api', gamesRouter)

app.get('/', (req, res) => {
  res.send('API is alive!')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
