import mongoose from 'mongoose'
const schema=new mongoose.Schema({post:{type:mongoose.Schema.Types.ObjectId,ref:'Post',required:true,index:true},author:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},body:{type:String,required:true,trim:true,maxLength:1000}},{timestamps:true});export default mongoose.model('Comment',schema)
