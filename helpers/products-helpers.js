let db = require('../config/connection')
let collection = require('../config/collection')
const objectId = require('mongodb').ObjectId

module.exports = {
    addProduct:(product,cb) => {
        product.price = parseInt(product.price)
        product.offer = false;
        product.ProductOffer = false;
        // product.quantity = parseInt(product.quantity)
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            cb(data.insertedId)
        })
    },
    getAllProducts:() => {
        return new Promise(async(resolve,reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(proId)}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    UpdateProduct:(proId,proDetails)=>{
        proDetails.price = parseInt(proDetails.price)
        proDetails.quantity = parseInt(proDetails.quantity)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    productname: proDetails.productname,
                    category: proDetails.category,
                    quantity: proDetails.quantity,
                    price: proDetails.price,
                    Image:proDetails.Image,
                    description: proDetails.description
                }
            }).then((response)=>{
                resolve()
            })
        })
},
getAllProductsCount: () => {
    return new Promise(async (resolve, reject) => {
        let totalProduct = await db.get().collection(collection.PRODUCT_COLLECTION).find().count()
        // console.log(totalProduct);
        resolve(totalProduct)
    })
},
getTotalSales:()=>{
    return new Promise(async(resolve,reject)=>{
      let cod=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{paymentMethod:'COD'}
        },
        { 
          $project :{count: {$size:{ "$ifNull":["$products",[]]}}}
        },
        {
          $group : {_id:"", total:{$sum:"$count"}}
        },
        {
          $set:{status:'COD'}
        }
      ]).toArray()

      let razor=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{paymentMethod:'Razorpay'}
        },
        { 
          $project :{count: {$size:{ "$ifNull":["$products",[]]}}}
        },
        {
          $group : {_id:"", total:{$sum:"$count"}}
        },
        {
          $set:{status:'Razorpay'}
        }
      ]).toArray()

      let paypal=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{paymentMethod:'Paypal'}
        },
        { 
          $project :{count: {$size:{ "$ifNull":["$products",[]]}}}
        },
        {
          $group : {_id:"", total:{$sum:"$count"}}
        },
        {
          $set:{status:'Paypal'}
        }
      ]).toArray()
      resolve([cod[0],razor[0],paypal[0]])
    })
  },
  getTotalPro:()=>{
    return new Promise(async(resolve,reject)=>{
      let pro =await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
        {
          $project:{productname:1,quantity:1, _id:0}
        }
      ]).toArray()
      resolve(pro)
    
    })
  },
  getSalesTotal: () => {
    return new Promise(async (resolve, reject) => {
      let totalProfit = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .toArray();
      resolve(totalProfit);
    });
  }
}