import mongoose from 'mongoose'
export async function connectDB(){
  const uri=process.env.MONGODB_URI || process.env.dbURL
  if(!uri) throw new Error('Set MONGODB_URI (or dbURL) in backend/.env')
  await mongoose.connect(uri)
  console.log('MongoDB connected')
}
