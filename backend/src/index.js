import 'dotenv/config'
import express from 'express'
import http from 'node:http'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import {Server} from 'socket.io'
import jwt from 'jsonwebtoken'
import {connectDB} from './config/db.js'
import {validateEnv} from './utils/validateEnv.js'
import User from './models/User.js'
import authRoutes from './routes/auth.js'
import trekRoutes from './routes/treks.js'
import userRoutes from './routes/users.js'
import postRoutes from './routes/posts.js'
import groupRoutes from './routes/groups.js'
import notificationRoutes from './routes/notifications.js'
import savedRoutes from './routes/saved.js'
import searchRoutes from './routes/search.js'
import uploadRoutes from './routes/uploads.js'
const app=express(),server=http.createServer(app)
if(process.env.NODE_ENV==='production')app.set('trust proxy',1)
const origins=(process.env.CLIENT_ORIGIN||'http://localhost:5173').split(',').map(s=>s.trim())
const corsOptions={origin(origin,cb){if(!origin||origins.includes(origin))return cb(null,true);cb(Object.assign(new Error('Origin is not allowed by CORS'),{status:403}))},credentials:true}
app.use(helmet());app.use(cors(corsOptions));app.use(express.json({limit:'1mb'}));app.use(cookieParser());app.use('/api', (req,res,next)=>{if(['GET','HEAD','OPTIONS'].includes(req.method)||!req.get('origin')||origins.includes(req.get('origin')))return next();return res.status(403).json({error:'Request origin is not allowed.'})})
app.get('/health',(_req,res)=>res.json({status:'ok',service:'trektogether-api'}))
app.use('/api/auth',authRoutes);app.use('/api/treks',trekRoutes);app.use('/api/users',userRoutes);app.use('/api/posts',postRoutes);app.use('/api/groups',groupRoutes);app.use('/api/notifications',notificationRoutes);app.use('/api/saved',savedRoutes);app.use('/api/search',searchRoutes);app.use('/api/uploads',uploadRoutes)
app.use((req,res)=>res.status(404).json({error:`No route for ${req.method} ${req.path}`}))
app.use((err,_req,res,_next)=>{const status=err.status|| (err.name==='ValidationError'||err.name==='CastError'||err.name==='MulterError'?400:err.code===11000?409:500);if(status>=500)console.error(err);res.status(status).json({error:status===500?'Something went wrong. Please try again.':err.message})})
const io=new Server(server,{cors:corsOptions})
io.use(async(socket,next)=>{try{const token=socket.handshake.auth?.token||socket.request.headers.cookie?.split('; ').find(x=>x.startsWith('tt_session='))?.split('=')[1];if(!token)return next(new Error('Authentication required'));const payload=jwt.verify(decodeURIComponent(token),process.env.JWT_SECRET);const user=await User.findById(payload.sub);if(!user||payload.ver!==(user.sessionVersion||0))return next(new Error('Authentication required'));socket.userId=payload.sub;next()}catch{next(new Error('Authentication required'))}})
io.on('connection',socket=>socket.join(`user:${socket.userId}`));app.locals.io=io
try{validateEnv()}catch(err){console.error(err.message);process.exit(1)}
const port=process.env.PORT||8084
connectDB().then(()=>server.listen(port,'0.0.0.0',()=>console.log(`TrekTogether API listening on ${port}`))).catch(err=>{console.error(err.message);process.exit(1)})
