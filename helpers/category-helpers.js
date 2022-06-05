let db = require('../config/connection')
let collection = require('../config/collection')
const objectId = require('mongodb').ObjectId

module.exports = {
    addCategory: (categorey) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categorey).then((data) => {
                console.log(data);
                resolve(data.insertedId)
            })

        })
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let categorey = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            // console.log(categorey, 'dasdadaddasca');
            resolve(categorey)

        })
    },
    getCategory: (categoreyId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(categoreyId) }).then((oneCategorey) => {
                resolve(oneCategorey)
            })
        })
    },

    updateCategory: (categoreyId, categorey) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoreyId) }, {
                $set: { catname: categorey.catname }
            }).then((response)=>{
                resolve()
            })
        })
    },
    deleteCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catId)}).then((response)=>{
                resolve(response)
            })
        })
    }

}