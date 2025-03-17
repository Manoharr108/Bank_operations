const express = require("express");
const bodyParser = require("body-parser");
const db = require("./mysqlDB");
const path = require("path");
const { name } = require("ejs");
const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "./public")));

var cuserID = null;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/html/index.html"));
});
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/html/sign_up.html"));
});
// app.get("/forgotpass",(req,res)=>{
//     res.sendFile(path.join(__dirname,"./views/html/forgot_pass.html"))
// })
// app.get("/User",(req,res)=>{
//     res.sendFile(path.join(__dirname,"./views/html/User.html"))
// })
// app.get("/checkbal",(req,res)=>{
//     res.sendFile(path.join(__dirname,"./views/html/check_balance.html"))
// })
// app.get("/withdraw",(req,res)=>{
//     res.sendFile(path.join(__dirname,"./views/html/withdraw.html"))
// })
// app.get("/deposit",(req,res)=>{
//     res.sendFile(path.join(__dirname,"./views/html/deposit.html"))
// })
// app.get("/transfer",(req,res)=>{
//     res.sendFile(path.join(__dirname,"./views/html/withdraw.html"))
// })
// app.get("/delete",(req,res)=>{
//     res.sendFile(path.join(__dirname,"./views/html/delete_account.html"))
// })

app.post("/register", async (req, res) => {
  const { name, email,number, password, cpassword } = req.body;
  try {
    if(number.length>10 || number.length<10){
      return res.send("Please check your phone number!!")
    }
    if (password !== cpassword) {
      return res.send("password doesn't match!");
    }

    const [result] = await db.query(
      "INSERT INTO customers (cus_name, cus_email,cus_phone, cus_pass) VALUES (?, ?, ?,?)",
      [name, email,number, password]
    );

    
    const [user] = await db.query(
        "select * from customers where cus_email = ?",
        email
    );
    if (user[0].cus_pass === password) {
        cuserID = {
            id: user[0].cus_id,
            name: user[0].cus_name,
            phone: user[0].cus_phone
        };
    }
    await db.query(
      "insert into accounts (acc_no, acc_bal, cus_id) values (?, ?, ?)",
      [cuserID.id + 1, 0.0, cuserID.id]
    );
    // console.log(cuserID.id, cuserID.name)
    return res.render("user", { name: cuserID.name[0].toUpperCase()+cuserID.name.slice(1), message: "Welcome", phone:9845 }); //end

  } catch (err) {
    console.log("failed registering user." + err.message);
    return res.status(500).send("failed");
  }

  
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user] = await db.query(
      "SELECT * FROM customers WHERE cus_email = ?",
      [email]
    );
    if (user.length == 0) {
      return res.send("Invalid email or password!");
    }
    if (user[0].cus_pass == password) {
        cuserID = {
            id: user[0].cus_id,
            name: user[0].cus_name,
            phone: user[0].cus_phone
        };
        // console.log(cuserID)
      return res.render("user", {
        name: user[0].cus_name[0].toUpperCase() + user[0].cus_name.slice(1),
        message: "Welcome back",
        phone: user[0].phone
      });
    }
    
    return res.send("Please check your password!!");
  } catch (err) {
    return console.log(err.message);
  }
});

app.get("/checkbal",async(req,res)=>{
    if(!cuserID){
        return
    }
    // console.log(cuserID)
    const [userbal] =await  db.query("select * from accounts where cus_id = ?",cuserID.id)
    // console.log(userbal[0])
    res.render("check_balance",{
        name:cuserID.name[0].toUpperCase()+cuserID.name.slice(1),
        acc_no:userbal[0].acc_no,
        balance: userbal[0].acc_bal
    })
})

app.get("/withdraw",async(req,res)=>{
    if(!cuserID){
        return
    }
    const [userbal] =await  db.query("select * from accounts where cus_id = ?",cuserID.id)
    res.render("withdraw",{
        name:cuserID.name[0].toUpperCase()+cuserID.name.slice(1),
        acc_no:userbal[0].acc_no
    })
})

app.post("/withdraw",async(req,res)=>{
    let {amount} = req.body;
    amount = Number.parseFloat(amount);
    if(!cuserID){
        return
    }
    const [acc] =await  db.query("select * from accounts where cus_id = ?",cuserID.id);
    // console.log(acc, amount)
    let prevbal = acc[0].acc_bal;
    prevbal = Number.parseFloat(prevbal);
    if(prevbal<amount){
        return res.send("Insufficient balance yeh!!!! " + prevbal)
    }
    let finalamount = prevbal - amount;
    finalamount = Number.parseFloat(finalamount);
    await db.query("UPDATE accounts SET acc_bal = ?  WHERE cus_id = ?",[finalamount ,cuserID.id])
    return res.send("successfully withdrawed yeh!!")
})
app.get("/deposit",(req,res)=>{
    return res.render("deposit");
})
app.post("/deposit",async(req,res)=>{
    try{
        let {amount} = req.body;
        amount = Number.parseFloat(amount);
        // console.log(amount)
        if(!cuserID){
            return
        }
        const [acc] =await  db.query("select * from accounts where cus_id = ?",cuserID.id);
        let prevbal = acc[0].acc_bal;
        prevbal = Number.parseFloat(prevbal);
        let finalamount = prevbal + amount;
        await db.query("UPDATE accounts SET acc_bal = ?  WHERE acc_no = ?",[finalamount ,acc[0].acc_no])
        return res.send("successfully deposited yeh!!")
    }catch(err){
        console.log(err.message);
    }
})
app.get("/transfer",(req,res)=>{
    return res.render('transfer')
})
app.get("/login",(req,res)=>{
  return res.render("user", { name: cuserID.name[0].toUpperCase()+cuserID.name.slice(1), message: "Welcome" })
})

app.post("/transfer",async(req,res)=>{
    let {amount, accno} = req.body;
    try{
        if(!cuserID){
            return;
        }
        const [acc1] =await  db.query("select * from accounts where cus_id = ?",cuserID.id);
        const [acc2] =await  db.query("select * from accounts where acc_no = ?",accno);
        // console.log(acc1[0], acc2[0])
        amount = Number.parseFloat(amount);
        prevbal_1 = acc1[0].acc_bal;
        prevbal_1 = Number.parseFloat(prevbal_1);
        prevbal_2 = acc2[0].acc_bal;
        prevbal_2 = Number.parseFloat(prevbal_2);
        if(amount>prevbal_1){
            return res.send("Insufficient funds to transfer!!")
        }
        await db.query("UPDATE accounts SET acc_bal = ?  WHERE acc_no = ?",[prevbal_1-amount ,acc1[0].acc_no])
        await db.query("UPDATE accounts SET acc_bal = ?  WHERE acc_no = ?",[prevbal_2+amount ,acc2[0].acc_no])
        return res.send("successfully transfered!!")
    }catch(err){
        return console.log(err.message)
    }
})

app.listen(3000, () => {
  console.log("running on port successfully!!");
});