const jwt=require('jsonwebtoken');
const auth=(req,res,next)=>{
    console.log("AUTH MIDDLEWARE RUNNING");
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({
            message:"No token provided"
            
        })
    }
    if(!authHeader.startsWith("Bearer "))
        {
        return res.status(401).json({
            message:"Invalid authorization format"

        })
        
    }
    
    const token=authHeader.split(" ")[1];
    try{
        if (!token) {
        return res.status(401).json({
            message: "Token is missing"
        });
}
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        req.userId = decoded.userId;
        next();
        
        
    }
    catch(err){
        return res.status(401).json({
            message:"access denied"
        })



    }
}

module.exports=auth;