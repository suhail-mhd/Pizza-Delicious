let db = require('../config/connection')
let collection = require('../config/collection')
const objectId = require('mongodb').ObjectId

module.exports={
    addBaner:(baner,callback)=>{
        db.get().collection(collection.BANER_COLLECTION).insertOne(baner).then((data)=>{
            callback(data.insertedId)
        })

    },
    getallbaners:()=>{
        return new Promise(async(resolve,reject)=>{
            let baner=await db.get().collection(collection.BANER_COLLECTION).find().toArray()
            resolve(baner)
        })

    },
    getBanerDetails:(BanerId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANER_COLLECTION).findOne({_id:objectId(BanerId)}).then((baner)=>{
                resolve(baner)
            })
        })
    },
    updateBaner:(BanerId,BanerDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANER_COLLECTION).updateOne({_id:objectId(BanerId)},{
                $set:{
                    name:BanerDetails.name
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    deleteBaner: (banerId) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.BANER_COLLECTION)
            .deleteOne({ _id: objectId(banerId) })
            .then((response) => {
              resolve(response);
            });
        });
      },
    
}