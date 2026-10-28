import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import Post from '../src/models/Post.js'
import Trek from '../src/models/Trek.js'
import Group from '../src/models/Group.js'

if(process.env.NODE_ENV!=='development')throw new Error('Set NODE_ENV=development to seed non-production demo data.')
if(!process.env.SEED_PASSWORD||process.env.SEED_PASSWORD.length<12)throw new Error('Set SEED_PASSWORD to a development-only password with at least 12 characters.')
const uri=process.env.MONGODB_URI||process.env.dbURL
if(!uri)throw new Error('Set MONGODB_URI before seeding demo data.')
const hikers=[
 {name:'Aarav Mehta',username:'aarav.trails',email:'aarav.demo@trektogether.local',region:'Himachal Pradesh',experience:'Advanced',bio:'Early starts, long ridgelines, and a thermos of chai.'},
 {name:'Nisha Rao',username:'nisha.outside',email:'nisha.demo@trektogether.local',region:'Western Ghats',experience:'Intermediate',bio:'Finding new forest trails and good people to walk them with.'},
 {name:'Kabir Sethi',username:'kabir.walks',email:'kabir.demo@trektogether.local',region:'Uttarakhand',experience:'Beginner',bio:'Learning the trails one weekend at a time.'},
 {name:'Maya Iyer',username:'maya.miles',email:'maya.demo@trektogether.local',region:'Karnataka',experience:'Intermediate',bio:'Slow mornings, green valleys, and trail photography.'},
]
const photos=['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85','https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=85','https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85']
await mongoose.connect(uri)
try{
 const users=[]
 for(const info of hikers){let user=await User.findOne({username:info.username});if(!user)user=await User.create({...info,password:process.env.SEED_PASSWORD});users.push(user)}
 for(let i=0;i<3;i++){const exists=await Post.exists({author:users[i]._id,caption:{$regex:'TrekTogether demo'}});if(!exists)await Post.create({author:users[i]._id,caption:['TrekTogether demo: the first light found us halfway up the ridge. #sunrise #weekend','TrekTogether demo: a quiet forest morning, with no hurry to get anywhere. #forest #slowdays','TrekTogether demo: new trail, new friends, and one more reason to come back. #community #hiking'][i],location:hikers[i].region,trekName:['Triund','Kudremukh','Deoriatal'][i],media:[{url:photos[i],resourceType:'image'}],hashtags:['hiking','community']})}
 const now=Date.now(),trekSpecs=[['Triund ridge weekend','Dharamkot','Himachal Pradesh','Moderate',12,8],['Mullayanagiri sunrise walk','Chikkamagaluru','Karnataka','Easy',18,10],['Deoriatal forest loop','Ukhimath','Uttarakhand','Easy',27,8]]
 for(let i=0;i<trekSpecs.length;i++){const[t,destination,region,difficulty,days,capacity]=trekSpecs[i];if(!await Trek.exists({title:'TrekTogether demo · '+t,organizer:users[i]._id}))await Trek.create({title:'TrekTogether demo · '+t,description:'A friendly, community-led day out. Bring water, comfortable layers, and a little curiosity.',destination,region,meetingPoint:'Shared with confirmed hikers',startAt:new Date(now+days*86400000),endAt:new Date(now+(days+1)*86400000),difficulty,capacity,organizer:users[i]._id,coverImage:photos[i],distanceKm:8+i*2,elevationGainM:500+i*250,safetyNotes:'Check local route conditions, permits, and weather before travel.'})}
 const groupSpecs=[['Weekend Trail Friends','Hikes for every pace, with time for tea afterward.','Himachal Pradesh'],['Forest Walk Collective','Explore shaded trails and learn to leave no trace.','Western Ghats'],['First Summit Club','Beginner-friendly hikes and a supportive crew.','Uttarakhand']]
 for(let i=0;i<groupSpecs.length;i++){const[name,description,region]=groupSpecs[i];if(!await Group.exists({name:'TrekTogether demo · '+name}))await Group.create({name:'TrekTogether demo · '+name,description,region,owner:users[i]._id,members:[{user:users[i]._id,role:'owner',status:'active'},{user:users[(i+1)%users.length]._id,role:'member',status:'active'}],joinPolicy:i===2?'approval':'open',interests:['hiking','community']})}
 console.log('Demo profiles, trail posts, upcoming treks, and groups are ready.')
}finally{await mongoose.disconnect()}
