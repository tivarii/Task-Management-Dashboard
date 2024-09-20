// import mongoose from "mongoose";

// type connectionObject = {
//     isConnected? : number;
// }

// const connection : connectionObject = {};

// export async function connectToDatabase(){
//     if(connection.isConnected){
//         console.log("Already connected to the database");
//         return;
//     }

//     try{
//         const db = await mongoose.connect(process.env.DATABASE_URL || "");

//         connection.isConnected = db.connections[0].readyState;
//         console.log("Connected to the database");
//     }
//     catch(err){
//         console.log(err);
//         process.exit(1);
//     }
// }

// // export default connectToDatabase;