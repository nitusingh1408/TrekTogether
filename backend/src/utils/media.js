import {v2 as cloudinary} from 'cloudinary'
cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET})
export async function removeMediaAssets(assets=[]){if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return;await Promise.allSettled(assets.filter(item=>item?.publicId).map(item=>cloudinary.uploader.destroy(item.publicId,{resource_type:item.resourceType==='video'?'video':'image'})))}
export default cloudinary
