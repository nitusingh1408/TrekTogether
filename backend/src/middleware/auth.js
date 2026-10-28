import jwt from 'jsonwebtoken'
import User from '../models/User.js'
export async function requireAuth(req,res,next){try{const token=req.cookies?.tt_session;if(!token)return res.status(401).json({error:'Sign in to continue.'});const payload=jwt.verify(token,process.env.JWT_SECRET);const user=await User.findById(payload.sub);if(!user||payload.ver!==(user.sessionVersion||0))return res.status(401).json({error:'Your session has expired.'});req.user=user;next()}catch{return res.status(401).json({error:'Your session has expired.'})}}
export async function issueSession(res,user){const production=process.env.NODE_ENV==='production';const token=jwt.sign({sub:user.id,ver:user.sessionVersion||0},process.env.JWT_SECRET,{expiresIn:'7d'});res.cookie('tt_session',token,{httpOnly:true,secure:production,sameSite:production?'none':'lax',maxAge:7*24*60*60*1000,path:'/'})}
export function clearSession(res){const production=process.env.NODE_ENV==='production';res.clearCookie('tt_session',{httpOnly:true,secure:production,sameSite:production?'none':'lax',path:'/'})}

export async function optionalAuth(req,res,next){try{const token=req.cookies?.tt_session;if(token){const payload=jwt.verify(token,process.env.JWT_SECRET);const user=await User.findById(payload.sub);if(user&&payload.ver===(user.sessionVersion||0))req.user=user}next()}catch{next()}}
