import {Router} from 'express'
import Saved from '../models/SavedItem.js'
import Post from '../models/Post.js'
import Trek from '../models/Trek.js'
import {requireAuth} from '../middleware/auth.js'
const router=Router();router.use(requireAuth)
router.get('/',async(req,res,next)=>{try{const saved=await Saved.find({user:req.user.id}).sort({createdAt:-1}).limit(100);const items=await Promise.all(saved.map(async row=>({_id:row._id,id:row.id,itemType:row.itemType,item:row.itemType==='post'?await Post.findById(row.item).populate('author','name username avatar'):await Trek.findById(row.item).populate('organizer','name username avatar')})));res.json({items:items.filter(x=>x.item)})}catch(e){next(e)}})
router.post('/:type/:id',async(req,res,next)=>{try{if(!['post','trek'].includes(req.params.type))return res.status(400).json({error:'Unsupported saved item.'});const Model=req.params.type==='post'?Post:Trek;if(!await Model.exists({_id:req.params.id}))return res.status(404).json({error:'Item not found.'});await Saved.updateOne({user:req.user.id,itemType:req.params.type,item:req.params.id},{$setOnInsert:{user:req.user.id,itemType:req.params.type,item:req.params.id}},{upsert:true});res.json({saved:true})}catch(e){next(e)}})
router.delete('/:type/:id',async(req,res,next)=>{try{await Saved.deleteOne({user:req.user.id,itemType:req.params.type,item:req.params.id});res.json({saved:false})}catch(e){next(e)}})
export default router
