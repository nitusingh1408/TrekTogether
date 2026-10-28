import {Router} from 'express'
import multer from 'multer'
import cloudinary from '../utils/media.js'
import {requireAuth} from '../middleware/auth.js'
const router=Router();const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024},fileFilter(_req,file,cb){const ok=/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)||/^video\/(mp4|quicktime|webm)$/.test(file.mimetype);cb(ok?null:Object.assign(new Error('Upload a JPG, PNG, WebP, GIF, MP4, MOV, or WebM file.'),{status:400}),ok)}})
router.post('/',requireAuth,upload.single('file'),async(req,res,next)=>{try{if(!req.file)return res.status(400).json({error:'Choose a file to upload.'});if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return res.status(503).json({error:'Media uploads are not configured on this server.'});const resource_type=req.file.mimetype.startsWith('video/')?'video':'image';const result=await new Promise((resolve,reject)=>cloudinary.uploader.upload_stream({folder:'trektogether/'+req.user.id,resource_type},(err,data)=>err?reject(err):resolve(data)).end(req.file.buffer));res.status(201).json({url:result.secure_url,publicId:result.public_id,resourceType:resource_type})}catch(e){next(e)}})
export default router
