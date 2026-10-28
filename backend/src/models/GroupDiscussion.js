import mongoose from 'mongoose'
const schema=new mongoose.Schema({group:{type:mongoose.Schema.Types.ObjectId,ref:'Group',required:true,index:true},author:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},body:{type:String,required:true,trim:true,maxLength:2000}},{timestamps:true});schema.index({createdAt:-1});export default mongoose.model('GroupDiscussion',schema)
