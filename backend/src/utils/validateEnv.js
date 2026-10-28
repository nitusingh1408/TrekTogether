export function validateEnv(){
 const required=['MONGODB_URI','JWT_SECRET']
 const missing=required.filter(key=>!process.env[key]&&!(key==='MONGODB_URI'&&process.env.dbURL))
 if(missing.length)throw new Error('Missing required environment variables: '+missing.join(', '))
 if(process.env.NODE_ENV==='production'&&!process.env.CLIENT_ORIGIN)throw new Error('CLIENT_ORIGIN is required in production.')
}
