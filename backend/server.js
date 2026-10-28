
const express = require('express');
const cors = require("cors");
const Expense = require("./models/expense");
require("dotenv").config();
const mongoose = require("mongoose");
const User=require('./models/user');
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
const auth=require("./middleware/auth")
app.use(express.json());

const PORT = process.env.PORT ;

app.get("/about", (req, res) => {
    res.send("This is my Personal Expense Tracker project.");
});

app.post('/expense',auth, async (req, res) => {
    try {
        const { title, amount, category } = req.body;
        const userId=req.userId;
        

        if (!title || amount === undefined || typeof amount !== "number" || amount <= 0 || !category) {
            return res.status(400).json({ message: "Invalid expense data" });
        }

        const expense = await Expense.create({
            title,
            amount,
            category,
            userId

        });

        res.status(201).json({
            message: "Expense created successfully",
            expense
        });
    } catch (err) {
        res.status(500).json({
            message: "Error creating expense",
            error: err.message
        });
    }
});

app.get('/expenses',auth, async (req, res) => {
    try {
        const expenses=await Expense.find({ userId: req.userId })
        

        res.status(200).json({
            message: "Expenses fetched successfully",
            expenses
        });
    } catch (err) {
        res.status(500).json({
            message: "Error fetching expenses",
            error: err.message
        });
    }
});

app.put('/expense/:id', auth ,async (req, res) => {
    try {
        const { title, amount, category } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid expense ID"
            });
        }

        if (!title || amount === undefined || typeof amount !== "number" || amount <= 0 || !category) {
            return res.status(400).json({
                message: "Invalid expense data"
            });
        }

        const expense = await Expense.findOneAndUpdate(
            {
                _id : req.params.id,
                userId:req.userId
            },
            
            { title, amount, category },
            { returnDocument: 'after', runValidators: true }
        );
       

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.status(200).json({
            message: "Expense updated successfully",
            expense
        });
    } catch (err) {
        res.status(500).json({
            message: "Error updating expense",
            error: err.message
        });
    }
});

app.delete('/expense/:id', auth ,async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid expense ID"
            });
        }

        const expense = await Expense.findOneAndDelete({
            _id:req.params.id,
            userId:req.userId
        });

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.status(200).json({
            message: "Expense deleted successfully",
            expense
        });
    } catch (err) {
        res.status(500).json({
            message: "Error deleting expense",
            error: err.message
        });
    }
});
app.get('/expense/:id' ,auth,async (req,res)=>{
    console.log("GET BY ID ROUTE HIT", req.params.id);
    try{
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid expense ID"
            });
        }
        
        const expense= await Expense.findOne({ _id: req.params.id, userId: req.userId })
        
        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }
        res.status(200).json({
            message:"heres your requested record",
            expense
        })
        
    }
    catch(err){
        res.status(500).json({
            message:"error detecting record",
            error:err.message
        })
        

    }
})


app.post('/register',async(req,res)=>{
    try{
        const{name,email,password}=req.body;
        if (!name || !email  || !password) {
            return res.status(400).json({ message: "inputs cannot be empty missing" });
        };
        const existingEmail=await User.findOne({ email })
        if(existingEmail){
            return res.status(409).json({ message: "user already exists" });
        }

        const hashPassword=await bcrypt.hash(password, 12)
        
        const user = await User.create({
            name,
            email,
            password:hashPassword
        });
        return res.status(201).json({
            message:"successffull registration",
            user:{
                id:user._id,
                name:user.name,
                email:user.email

            }
            
        })

    }
    catch (err) {
        res.status(500).json({
            message: "Registration failed",
            error: err.message
        });
    }

})
app.post('/login',async(req,res)=>{
    try{
        const{email,password}=req.body;
        if ( !email  || !password) {
            return res.status(400).json({ message: "inputs cannot be empty missing" });
        };
        const loginEmail=await User.findOne({ email })
        if(!loginEmail){
            return res.status(401).json({ message: "unautherized access" });
        }
       
        const isMatch = await bcrypt.compare(password, loginEmail.password);
    
        if(!isMatch){
            return res.status(401).json({ message: "unautherized access" });
        }
        const token = jwt.sign(
        { userId: loginEmail._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
        return res.status(200).json({
            message:"success",
            token,
            user:{
                id:loginEmail._id,
                email:loginEmail.email,
                name:loginEmail.name
                
                
            }
        })


    }
    
    catch (err) {
    res.status(500).json({
        message: "Login failed"
    });

    }

})

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
    });
