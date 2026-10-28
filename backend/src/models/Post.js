import mongoose from 'mongoose'
const mediaSchema=new mongoose.Schema({url:{type:String,required:true},publicId:String,resourceType:{type:String,enum:['image','video'],default:'image'}},{_id:false})
const postSchema=new mongoose.Schema({author:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},caption:{type:String,trim:true,maxLength:2000,default:''},media:[mediaSchema],location:{type:String,default:''},trekName:{type:String,default:''},difficulty:{type:String,enum:['Easy','Moderate','Hard','Expert',''],default:''},hashtags:[String],likes:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}]},{timestamps:true})
postSchema.index({createdAt:-1});postSchema.index({hashtags:1});export default mongoose.model('Post',postSchema)
