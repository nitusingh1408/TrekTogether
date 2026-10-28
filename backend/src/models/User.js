import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
const userSchema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxLength:80},username:{type:String,required:true,trim:true,lowercase:true,minLength:3,maxLength:24,match:/^[a-z0-9_.]+$/},email:{type:String,required:true,trim:true,lowercase:true,unique:true,match:/^[^\s@]+@[^\s@]+\.[^\s@]+$/},password:{type:String,required:true,minLength:8,select:false},bio:{type:String,maxLength:300,default:''},region:{type:String,default:''},experience:{type:String,enum:['Beginner','Intermediate','Advanced'],default:'Beginner'},preferredDifficulty:[{type:String,enum:['Easy','Moderate','Hard','Expert']}],favoriteDestinations:[String],avatar:{type:String,default:''},avatarPublicId:{type:String,default:''},coverImage:{type:String,default:''},followers:{type:Number,default:0},following:{type:Number,default:0},sessionVersion:{type:Number,default:0}
},{timestamps:true})
userSchema.index({username:1},{unique:true})
userSchema.pre('save',async function(){if(this.isModified('password'))this.password=await bcrypt.hash(this.password,12)})
userSchema.methods.comparePassword=function(value){return bcrypt.compare(value,this.password)}
export default mongoose.model('User',userSchema)
