const mongoose = require("mongoose");
const Listing = require("../models/listing.js")
const initData = require("./data.js");
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
};
main().then(()=>{
   console.log("Database is connected!!!");
}).catch((err)=>{
    console.log(err);
});


async function initdb() {
    await Listing.deleteMany({});
  initData.data = initData.data.map((obj)=>({...obj,owner:"6887da3670e375daad65cd49"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};
initdb();
