import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {io} from 'socket.io-client'

const base=(process.env.TEST_API_URL||'http://localhost:8084').replace(/\/$/,'')
const origin=process.env.TEST_CLIENT_ORIGIN||'http://localhost:5173'
const password='TrekTestPass123'
const runId=randomUUID().slice(0,8)
const users=[]
let checks=0
async function request(path,{client,data,method,expect}={}){
 const headers={'Content-Type':'application/json','Origin':origin}
 if(client?.cookie)headers.Cookie=client.cookie
 const response=await fetch(base+path,{method:method|| (data?'POST':'GET'),headers,body:data===undefined?undefined:JSON.stringify(data)})
 const body=await response.json().catch(()=>({}))
 if(expect!==undefined)assert.equal(response.status,expect,method+' '+path+': '+JSON.stringify(body))
 checks++
 return {status:response.status,body,response}
}
async function register(label){
 const username=label+runId
 const result=await request('/api/auth/register',{data:{name:'Test '+label,username,email:username+'@example.test',password},expect:201})
 const cookie=result.response.headers.getSetCookie?.()[0]?.split(';')[0]
 assert.ok(cookie,'registration must set an HTTP-only session cookie')
 const client={cookie,user:result.body.user}
 users.push(client)
 return client
}
async function run(){
 assert.equal((await request('/health')).body.status,'ok')
 const unauth=await request('/api/treks',{expect:200})
 assert.ok(Array.isArray(unauth.body.items))
 const a=await register('trail')
 const b=await register('hiker')
 const c=await register('walker')
 await request('/api/auth/me',{client:a,expect:200})
 await request('/api/auth/me',{expect:401})
 await request('/api/auth/login',{data:{identity:a.user.email,password:'wrong-password'},expect:401})
 const login=await request('/api/auth/login',{data:{identity:c.user.username,password},expect:200});const loggedIn={cookie:login.response.headers.getSetCookie?.()[0]?.split(';')[0],user:login.body.user};assert.ok(loggedIn.cookie);await request('/api/auth/logout',{client:loggedIn,data:{},expect:200});await request('/api/auth/me',{client:loggedIn,expect:401});const renewed=await request('/api/auth/login',{data:{identity:c.user.email,password},expect:200});c.cookie=renewed.response.headers.getSetCookie?.()[0]?.split(';')[0]
 await request('/api/auth/register',{data:{name:'Duplicate',username:a.user.username,email:'duplicate'+runId+'@example.test',password},expect:409})
 const socket=io(base,{extraHeaders:{Cookie:a.cookie},transports:['websocket']});await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);setTimeout(()=>reject(new Error('Socket connection timed out')),5000)});const live=new Promise((resolve,reject)=>{socket.once('notification',resolve);setTimeout(()=>reject(new Error('Live notification timed out')),5000)});await request('/api/users/'+a.user.id+'/follow',{client:b,data:{},expect:200});const pushed=await live;assert.equal(pushed.type,'follow');socket.disconnect();
 await request('/api/users/'+b.user.id+'/follow',{client:a,data:{},expect:200})
 const profile=await request('/api/users/'+b.user.username,{expect:200})
 assert.equal(profile.body.user.followers,1)

 const createdPost=await request('/api/posts',{client:a,data:{caption:'Sunrise above the clouds #weekend',location:'North Ridge'},expect:201})
 const postId=createdPost.body.post._id
 await request('/api/posts/'+postId+'/like',{client:b,data:{},expect:200})
 await request('/api/posts/'+postId+'/like',{client:b,data:{},expect:200})
 const comment=await request('/api/posts/'+postId+'/comments',{client:b,data:{body:'What a view!'},expect:201})
 const commentId=comment.body.comment._id
 await request('/api/posts/comments/'+commentId,{client:b,data:{body:'What a lovely view!'},method:'PATCH',expect:200})
 await request('/api/posts/comments/'+commentId,{client:b,method:'DELETE',expect:200})
 await request('/api/posts/'+postId+'/save',{client:b,data:{},expect:200})
 await request('/api/posts/'+postId+'/report',{client:b,data:{reason:'Test report from the integration check.'},expect:201})
 assert.equal((await request('/api/saved',{client:b,expect:200})).body.items.length,1)

 const start=new Date(Date.now()+10*86400000).toISOString()
 const end=new Date(Date.now()+11*86400000).toISOString()
 const createdTrek=await request('/api/treks',{client:a,data:{title:'Test Ridge '+runId,description:'A test trek',destination:'North Ridge',region:'Test Range',meetingPoint:'Trailhead',startAt:start,endAt:end,difficulty:'Easy',capacity:2},expect:201})
 const trekId=createdTrek.body.trek._id
 await request('/api/treks/'+trekId+'/join',{client:b,data:{},expect:200})
 await request('/api/treks/'+trekId+'/join',{client:b,data:{},expect:409})
 const full=await request('/api/treks/'+trekId,{expect:200})
 await request('/api/treks/'+trekId+'/join',{client:c,data:{},expect:202})
 const waiting=await request('/api/treks/'+trekId,{client:a,expect:200});assert.equal(waiting.body.trek.waitlist.length,1)
 await request('/api/treks/'+trekId+'/join',{client:b,method:'DELETE',expect:200})
 const promoted=await request('/api/treks/'+trekId,{client:a,expect:200});assert.equal(promoted.body.trek.participants.length,1);assert.equal(String(promoted.body.trek.participants[0]._id),String(c.user.id))
 assert.equal(full.body.trek.participants.length,1)
 await request('/api/treks/'+trekId,{client:b,data:{title:'Not yours'},method:'PATCH',expect:403})
 const approvalTrek=await request('/api/treks',{client:a,data:{title:'Approval Ridge '+runId,description:'An organizer-reviewed trek',destination:'North Ridge',region:'Test Range',startAt:start,endAt:end,difficulty:'Moderate',capacity:4,approvalRequired:true},expect:201})
 const approvalId=approvalTrek.body.trek._id
 await request('/api/treks/'+approvalId+'/join',{client:c,data:{},expect:202})
 await request('/api/treks/'+approvalId+'/requests/'+c.user.id+'/decision',{client:a,data:{decision:'approve'},expect:200})
 assert.equal((await request('/api/treks/'+approvalId,{client:c,expect:200})).body.trek.membershipStatus,'joined')

 const group=await request('/api/groups',{client:a,data:{name:'Test Trail Friends '+runId,description:'Integration group',region:'Test Range',joinPolicy:'approval'},expect:201})
 const groupId=group.body.group._id
 await request('/api/groups/'+groupId+'/join',{client:b,data:{},expect:201})
 const pending=await request('/api/groups/'+groupId,{client:a,expect:200})
 const pendingMember=pending.body.group.members.find(m=>String(m.user?._id||m.user)===String(b.user.id))
 assert.equal(pendingMember.status,'pending')
 await request('/api/groups/'+groupId+'/requests/'+b.user.id+'/decision',{client:a,data:{decision:'approve'},method:'POST',expect:200})
 await request('/api/groups/'+groupId+'/discussions',{client:b,data:{body:'See you on the trail.'},expect:201})
 await request('/api/groups/'+groupId+'/invitations',{client:a,data:{userId:c.user.id},expect:201})
 const invitations=await request('/api/groups/invitations/me',{client:c,expect:200});assert.equal(invitations.body.items.length,1)
 await request('/api/groups/invitations/'+invitations.body.items[0]._id+'/decision',{client:c,data:{decision:'accept'},expect:200})
 const notifications=await request('/api/notifications',{client:b,expect:200})
 assert.ok(notifications.body.items.length>=1)
 await request('/api/notifications/read-all',{client:b,data:{},method:'PATCH',expect:200})
 await request('/api/search?q=North',{expect:200})
 await request('/api/users/me',{client:a,data:{bio:'Updated in integration test',region:'Test Range'},method:'PATCH',expect:200})
 const badFile=new FormData();badFile.append('file',new Blob(['no'],{type:'text/plain'}),'bad.txt');const badUpload=await fetch(base+'/api/uploads',{method:'POST',headers:{Origin:origin,Cookie:a.cookie},body:badFile});assert.equal(badUpload.status,400);checks++
 await request('/api/treks/'+trekId+'/join',{client:a,data:{},expect:400})
 console.log('API integration checks passed: '+checks)
}
try{await run()}finally{
 for(const client of users)try{await request('/api/auth/account',{client,data:{password,confirmation:'DELETE'},method:'DELETE',expect:200})}catch(error){console.error('Test cleanup warning:',error.message)}
}
