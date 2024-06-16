export const allowedOrigins = ['http://localhost:3000']
export const corsOptions = {
  // eslint-disable-next-line
  origin: (origin: string, callback: any) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}
