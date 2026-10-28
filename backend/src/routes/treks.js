import {Router} from 'express'
import mongoose from 'mongoose'
import Trek from '../models/Trek.js'
import {requireAuth,optionalAuth} from '../middleware/auth.js'
import {notify} from '../utils/notify.js'
const router=Router()
const safeRegex=value=>new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i')
const validId=id=>mongoose.isValidObjectId(id)

router.get('/',optionalAuth,async(req,res,next)=>{try{
 const{q='',difficulty,region,from,to,sort='date',page='1'}=req.query
 const filter={status:'upcoming',startAt:{$gte:new Date()}}
 if(difficulty)filter.difficulty=difficulty
 if(region)filter.region=safeRegex(region)
 if(from||to){const dates={};if(from){const d=new Date(from);if(Number.isNaN(+d))return res.status(400).json({error:'Invalid start date filter.'});dates.$gte=d}if(to){const d=new Date(to);if(Number.isNaN(+d))return res.status(400).json({error:'Invalid end date filter.'});dates.$lte=d}filter.startAt=dates}
 if(q)filter.$or=['title','destination','region'].map(field=>({[field]:safeRegex(q)}))
 const rows=await Trek.find(filter).populate('organizer','name username avatar').sort(sort==='popular'?{participants:-1,startAt:1}:{startAt:1}).skip((Math.max(1,+page)-1)*12).limit(12)
 const viewer=String(req.user?.id||'');const items=rows.map(doc=>{const t=doc.toObject();t.membershipStatus=viewer&&String(t.organizer?._id)===viewer?'organizer':t.participants.some(p=>String(p)===viewer)?'joined':t.joinRequests.some(p=>String(p)===viewer)?'pending':t.waitlist.some(p=>String(p)===viewer)?'waitlisted':null;delete t.joinRequests;delete t.waitlist;return t})
 res.json({items,page:+page})
 }catch(e){next(e)}})

router.post('/',requireAuth,async(req,res,next)=>{try{
 const body={...req.body,organizer:req.user.id};const start=new Date(body.startAt),end=new Date(body.endAt)
 if(Number.isNaN(+start)||start<=new Date()||Number.isNaN(+end)||end<=start)return res.status(400).json({error:'Choose a future start date and an end date after it.'})
 if(body.coverPublicId&&!String(body.coverPublicId).startsWith('trektogether/'+req.user.id+'/'))return res.status(400).json({error:'Choose a cover image uploaded by your account.'});const trek=await Trek.create(body);res.status(201).json({trek})
 }catch(e){next(e)}})

router.get('/:id',optionalAuth,async(req,res,next)=>{try{
 if(!validId(req.params.id))return res.status(404).json({error:'Trek not found.'})
 const trek=await Trek.findById(req.params.id).populate('organizer','name username avatar').populate('participants','name username avatar experience').populate('joinRequests','name username avatar').populate('waitlist','name username avatar')
 if(!trek)return res.status(404).json({error:'Trek not found.'})
 const viewer=String(req.user?.id||'');const result=trek.toObject();result.membershipStatus=viewer&&String(trek.organizer?._id)===viewer?'organizer':trek.participants.some(p=>String(p._id)===viewer)?'joined':trek.joinRequests.some(p=>String(p._id)===viewer)?'pending':trek.waitlist.some(p=>String(p._id)===viewer)?'waitlisted':null
 if(String(trek.organizer?._id)!==viewer){delete result.joinRequests;delete result.waitlist}
 res.json({trek:result})
 }catch(e){next(e)}})

router.patch('/:id',requireAuth,async(req,res,next)=>{try{
 const trek=await Trek.findById(req.params.id);if(!trek)return res.status(404).json({error:'Trek not found.'})
 if(String(trek.organizer)!==String(req.user.id))return res.status(403).json({error:'Only the organizer can edit this trek.'})
 const allowed=['title','description','destination','region','meetingPoint','startAt','endAt','difficulty','distanceKm','elevationGainM','capacity','approvalRequired','coverImage','coverPublicId','cost','equipment','safetyNotes','status']
 const changed=allowed.some(key=>key in req.body&&String(trek[key])!==String(req.body[key]));if(req.body.coverPublicId&&!String(req.body.coverPublicId).startsWith('trektogether/'+req.user.id+'/'))return res.status(400).json({error:'Choose a cover image uploaded by your account.'});for(const key of allowed)if(key in req.body)trek[key]=req.body[key]
 if(trek.startAt<=new Date()||trek.endAt<=trek.startAt)return res.status(400).json({error:'The trek dates are not valid.'})
 if(trek.capacity<trek.participants.length+1)return res.status(400).json({error:'Capacity cannot be lower than the current group size.'})
 await trek.save();if(changed)await Promise.allSettled([...trek.participants,...trek.joinRequests,...trek.waitlist].map(recipient=>notify(req.app.locals.io,{recipient,actor:req.user.id,type:'system',message:`The organizer updated details for ${trek.title}.`,targetType:'trek',targetId:trek.id})));res.json({trek})
 }catch(e){next(e)}})

router.delete('/:id',requireAuth,async(req,res,next)=>{try{
 const trek=await Trek.findById(req.params.id);if(!trek)return res.status(404).json({error:'Trek not found.'})
 if(String(trek.organizer)!==String(req.user.id))return res.status(403).json({error:'Only the organizer can cancel this trek.'})
 const people=[...new Set([...trek.participants,...trek.joinRequests,...trek.waitlist].map(String))];trek.status='cancelled';await trek.save();await Promise.allSettled(people.map(recipient=>notify(req.app.locals.io,{recipient,actor:req.user.id,type:'system',message:`${trek.title} was cancelled by the organizer.`,targetType:'trek',targetId:trek.id})));res.json({ok:true})
 }catch(e){next(e)}})

router.post('/:id/join',requireAuth,async(req,res,next)=>{try{
 const trek=await Trek.findById(req.params.id);if(!trek)return res.status(404).json({error:'Trek not found.'})
 if(String(trek.organizer)===String(req.user.id))return res.status(400).json({error:'Organizers are already part of their trek.'})
 if(trek.status!=='upcoming'||trek.startAt<=new Date())return res.status(400).json({error:'This trek is no longer open for joining.'})
 if(trek.participants.some(id=>String(id)===String(req.user.id)))return res.status(409).json({error:'You have already joined this trek.'})
 if(trek.joinRequests.some(id=>String(id)===String(req.user.id)))return res.status(409).json({error:'Your request is awaiting organizer approval.'})
 if(trek.waitlist.some(id=>String(id)===String(req.user.id)))return res.status(409).json({error:'You are already on the waiting list.'})
 if(trek.participants.length+1>=trek.capacity){await Trek.updateOne({_id:trek.id,participants:{$ne:req.user.id},waitlist:{$ne:req.user.id}},{$addToSet:{waitlist:req.user.id}});return res.status(202).json({status:'waitlisted'})}
 if(trek.approvalRequired){
  await Trek.updateOne({_id:trek.id},{$addToSet:{joinRequests:req.user.id}})
  await notify(req.app.locals.io,{recipient:trek.organizer,actor:req.user.id,type:'trek_join',message:`${req.user.name} requested to join ${trek.title}.`,targetType:'trek',targetId:trek.id}).catch(()=>{})
  return res.status(202).json({status:'pending'})
 }
 const updated=await Trek.findOneAndUpdate({_id:trek.id,status:'upcoming',startAt:{$gt:new Date()},organizer:{$ne:req.user.id},participants:{$ne:req.user.id},waitlist:{$ne:req.user.id},$expr:{$lt:[{$add:[{$size:'$participants'},1]},'$capacity']}},{$addToSet:{participants:req.user.id}},{new:true})
 if(updated){await notify(req.app.locals.io,{recipient:trek.organizer,actor:req.user.id,type:'trek_join',message:`${req.user.name} joined ${trek.title}.`,targetType:'trek',targetId:trek.id,dedupeKey:`trekjoin:${trek.id}:${req.user.id}:${Date.now()}`}).catch(()=>{});return res.json({trek:updated,status:'joined'})}
 const current=await Trek.findById(trek.id).select('status startAt participants')
 if(!current||current.status!=='upcoming'||current.startAt<=new Date())return res.status(400).json({error:'This trek is no longer open for joining.'})
 await Trek.updateOne({_id:trek.id,participants:{$ne:req.user.id},waitlist:{$ne:req.user.id}},{$addToSet:{waitlist:req.user.id}})
 res.status(202).json({status:'waitlisted'})
 }catch(e){next(e)}})

router.delete('/:id/join',requireAuth,async(req,res,next)=>{try{
 const trek=await Trek.findById(req.params.id);if(!trek)return res.status(404).json({error:'Trek not found.'})
 if(String(trek.organizer)===String(req.user.id))return res.status(400).json({error:'The organizer cannot leave their own trek.'})
 const wasParticipant=trek.participants.some(id=>String(id)===String(req.user.id))
 const wasWaiting=trek.waitlist.some(id=>String(id)===String(req.user.id))
 const wasRequested=trek.joinRequests.some(id=>String(id)===String(req.user.id))
 if(!wasParticipant&&!wasWaiting&&!wasRequested)return res.status(404).json({error:'You are not part of this trek.'})
 trek.participants=trek.participants.filter(id=>String(id)!==String(req.user.id));trek.waitlist=trek.waitlist.filter(id=>String(id)!==String(req.user.id));trek.joinRequests=trek.joinRequests.filter(id=>String(id)!==String(req.user.id));await trek.save()
 if(wasParticipant&&trek.waitlist.length&&trek.status==='upcoming'){
  const next=trek.waitlist[0]
  const promoted=await Trek.findOneAndUpdate({_id:trek.id,'waitlist.0':next,$expr:{$lt:[{$add:[{$size:'$participants'},1]},'$capacity']}},{$pull:{waitlist:next},$addToSet:{participants:next}},{new:true})
  if(promoted)await notify(req.app.locals.io,{recipient:next,actor:trek.organizer,type:'system',message:`A place opened up and you joined ${trek.title}.`,targetType:'trek',targetId:trek.id}).catch(()=>{})
 }
 res.json({ok:true})
 }catch(e){next(e)}})

router.post('/:id/requests/:userId/decision',requireAuth,async(req,res,next)=>{try{
 const trek=await Trek.findById(req.params.id);if(!trek)return res.status(404).json({error:'Trek not found.'})
 if(String(trek.organizer)!==String(req.user.id))return res.status(403).json({error:'Only the organizer can decide join requests.'})
 if(!trek.joinRequests.some(id=>String(id)===req.params.userId))return res.status(404).json({error:'Join request not found.'})
 if(req.body.decision==='approve'){
  const updated=await Trek.findOneAndUpdate({_id:trek.id,joinRequests:req.params.userId,participants:{$ne:req.params.userId},$expr:{$lt:[{$add:[{$size:'$participants'},1]},'$capacity']}},{$addToSet:{participants:req.params.userId},$pull:{joinRequests:req.params.userId}},{new:true})
  if(!updated)return res.status(409).json({error:'The trek has filled up.'})
  await notify(req.app.locals.io,{recipient:req.params.userId,actor:req.user.id,type:'system',message:`Your request to join ${trek.title} was approved.`,targetType:'trek',targetId:trek.id}).catch(()=>{})
  return res.json({status:'approved'})
 }
 if(req.body.decision==='reject'){trek.joinRequests=trek.joinRequests.filter(id=>String(id)!==req.params.userId);await trek.save();return res.json({status:'rejected'})}
 res.status(400).json({error:'Choose approve or reject.'})
 }catch(e){next(e)}})

router.get('/:id/participants',optionalAuth,async(req,res,next)=>{try{
 const trek=await Trek.findById(req.params.id).select('organizer participants joinRequests waitlist').populate('organizer','name username avatar experience').populate('participants','name username avatar experience').populate('joinRequests','name username avatar experience').populate('waitlist','name username avatar experience')
 if(!trek)return res.status(404).json({error:'Trek not found.'})
 const isOrganizer=String(trek.organizer?._id)===String(req.user?.id)
 res.json({items:[trek.organizer,...trek.participants],requests:isOrganizer?trek.joinRequests:undefined,waitlist:isOrganizer?trek.waitlist:undefined})
 }catch(e){next(e)}})
export default router
