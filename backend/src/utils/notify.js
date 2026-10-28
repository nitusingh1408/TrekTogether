import Notification from '../models/Notification.js'
export async function notify(io,{recipient,actor,type,message,targetType='none',targetId,dedupeKey}){
 if(String(recipient)===String(actor))return null
 const notification=await Notification.create({recipient,actor,type,message,targetType,targetId,dedupeKey})
 const item=await notification.populate('actor','name username avatar')
 io?.to(`user:${recipient}`).emit('notification',item)
 return item
}
