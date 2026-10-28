import mongoose from 'mongoose'
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},itemType:{type:String,enum:['post','trek'],required:true},item:{type:mongoose.Schema.Types.ObjectId,required:true,refPath:'itemType'}},{timestamps:true});schema.index({user:1,itemType:1,item:1},{unique:true});export default mongoose.model('SavedItem',schema)
