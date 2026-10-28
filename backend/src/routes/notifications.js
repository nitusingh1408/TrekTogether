import {Router} from 'express'
import Notification from '../models/Notification.js'
import {requireAuth} from '../middleware/auth.js'
const router=Router();router.use(requireAuth)
router.get('/',async(req,res,next)=>{try{const page=Math.max(1,+req.query.page||1);const[items,unread]=await Promise.all([Notification.find({recipient:req.user.id}).populate('actor','name username avatar').sort({createdAt:-1}).skip((page-1)*25).limit(25),Notification.countDocuments({recipient:req.user.id,readAt:null})]);res.json({items,unread,page})}catch(e){next(e)}})
router.patch('/:id/read',async(req,res,next)=>{try{const n=await Notification.findOneAndUpdate({_id:req.params.id,recipient:req.user.id},{$set:{readAt:new Date()}},{new:true});if(!n)return res.status(404).json({error:'Notification not found.'});res.json({notification:n})}catch(e){next(e)}})
router.patch('/read-all',async(req,res,next)=>{try{await Notification.updateMany({recipient:req.user.id,readAt:null},{$set:{readAt:new Date()}});res.json({ok:true})}catch(e){next(e)}})
export default router
