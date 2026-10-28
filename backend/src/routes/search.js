import {Router} from 'express'
import User from '../models/User.js'
import Post from '../models/Post.js'
import Trek from '../models/Trek.js'
import Group from '../models/Group.js'
const router=Router();router.get('/',async(req,res,next)=>{try{const q=String(req.query.q||'').trim();if(!q)return res.json({users:[],posts:[],treks:[],groups:[]});const rx=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');const[users,posts,treks,groups]=await Promise.all([User.find({$or:[{name:rx},{username:rx},{region:rx}]}).select('name username avatar region').limit(8),Post.find({$or:[{caption:rx},{location:rx},{trekName:rx},{hashtags:rx}]}).populate('author','name username avatar').sort({createdAt:-1}).limit(8),Trek.find({$or:[{title:rx},{destination:rx},{region:rx}],status:'upcoming'}).populate('organizer','name username avatar').sort({startAt:1}).limit(8),Group.find({$or:[{name:rx},{description:rx},{region:rx}]}).limit(8)]);res.json({users,posts,treks,groups})}catch(e){next(e)}});export default router
