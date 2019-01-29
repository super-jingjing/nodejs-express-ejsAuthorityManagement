const express = require("express");
const session = require("express-session");
//主要用于获取post请求提交的数据
const bodyParse = require("body-parser");
const md5 = require("md5-node");
const app = new express();
//安装mongodb的模块
const MongoClient = require("mongodb").MongoClient;
const dbUrl = "mongodb://127.0.0.1:27017/";
// 设置bodyParser的中间件间件
app.use(bodyParse.urlencoded({extended:false}));
app.use(bodyParse.json());
//配置session中间件
app.use(session({
    secret:"keyboard cat",
    resave:false,
    saveUninitialized:true,
    cookie:{maxAge:1000*60*30},
    rolling:true
}));
// 使用ejs模版引擎
app.set("view engine","ejs");
//配置静态目录
app.use(express.static("public"));
//利用中间件来判断登录状态
app.use(function (req,res,next) {
    const currPath = req.url;
    if(currPath=="/login" || currPath=="/doLogin"){
        next();
    }else{
        if(req.session.userInfo && req.session.userInfo.username && req.session.userInfo.username!=""){
            //ejs中 设置全局数据 所有的页面都可以使用  在ejs中直接<%=userInfo%>
            app.locals["userInfo"] = req.session.userInfo.username;
            //如果已经登录，继续执行
            next();
        }else{
            //如果未登录，重定向回去
            res.redirect("/login");
        }
    }
});
app.get("/",function (req,res) {
    res.render("index");
});
app.get("/login",function (req,res) {
    res.render("login");
});
//ejs中 设置全局数据 所有的页面都可以使用  在ejs中直接<%=userInfo%>
// app.locals["userInfo"] = "";
//登录
app.post("/doLogin",function (req,res) {
    //利用bodyParser 获取表单提交的数据
    const param = req.body;
    const pas = md5(param.password);
    MongoClient.connect(dbUrl,function (err,db) {
        if(err){
            console.log(err);
            return;
        }
        var dbo = db.db("productmanage");
        const list = [];
        const result = dbo.collection("user").find({"username":param.username,"password":pas});
        result.toArray(function (err,data) {
            if(err){
                return;
            }
            if(data&&data.length>0){
                //保存用户信息，用于权限控制;后台一般使用session来保存用户信息
                req.session.userInfo = data[0];
                //跳转到product页面
                res.redirect("/product");
            }else{
                res.send("<script>alert('登录失败');location.href='/login';</script>");
            }
            db.close();
        });
        //另一种循坏取数据的方式，略麻烦
        // result.each(function (error,doc) {
        //     if(error){
        //         console.log(error);
        //         return;
        //     }
        //     if(doc!=null){
        //         list.push(doc);
        //     }else{
        //        console.log(list);
        //        db.close();
        //     }
        // })
    })
});
app.get("/logout",function (req,res) {
    req.session.destroy(function (err) {
        if(err){

        }else{
            res.redirect("/login");
        }
    });
});
app.get("/product",function (req,res) {
    MongoClient.connect(dbUrl,function (err,db) {
        if (err) {
            console.log(err);
            return;
        }
        var dbo = db.db("productmanage");
        const result = dbo.collection("product").find();
        result.toArray(function (error, data) {
            if (err) {
                console.log(error);
                return;
            }
            console.log(data);
            res.render("product",{list:data});
            db.close();
        })
    });
});
app.get("/productadd",function (req,res) {
    res.render("productadd");
});
app.get("/productdelete",function (req,res) {
    res.render("productdelete");
});
app.get("/productEdit",function (req,res) {
    res.render("productEdit");
});
app.listen("3001","127.0.0.1");