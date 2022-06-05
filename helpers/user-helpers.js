let db = require('../config/connection')
let collection = require('../config/collection')
let bcrypt = require('bcrypt')
const { status } = require('express/lib/response')
const { response } = require('../app');
const { promise, reject } = require('bcrypt/promises');
const async = require('hbs/lib/async');
const objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');



var instance = new Razorpay({
  key_id: 'rzp_test_01xxpPseANbvFg',
  key_secret: 'ZTuvlVd8WS0kW6mEbmdFKKnl',
});


module.exports = {
    doSignup: (userData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
          if (userData.wallet) {
            let mainUser=await db.get().collection(collection.USER_COLLECTION).findOne({_id:userData.referedBy})
            if(mainUser.wallet<200){
              await db
              .get()
              .collection(collection.USER_COLLECTION)
              .updateOne({ _id: userData.referedBy }, { $inc: { wallet: 100 } });
            }
          }
          userData.status = true;
          userData.wallet = userData.wallet ? userData.wallet : 0;
          userData.password = await bcrypt.hash(userData.password, 10);
          userData.confirmpassword = await bcrypt.hash(userData.confirmpassword, 10)
          db.get()
            .collection(collection.USER_COLLECTION)
            .insertOne(userData)
            .then(async (data) => {
              let user = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ _id: objectId(data.insertedId) });
              response.user = user;
              response.status = true;
              resolve(response);
            })
            .catch((err) => {
              err = "This user Already Exists";
              reject(err);
            });
        });
    },

    doLogin:(userData) => {
        return new Promise(async(resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status) => {
                    if(status){
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    }else {
                        console.log('login failed');
                        resolve({status:false})
                    }
                })
            }else {
                console.log('login failed');
                resolve({status:false})
            }
        })
    },

    checkReferal: (referal) => {
        return new Promise(async (resolve, reject) => {
          let refer = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .find({ refer: referal })
            .toArray();
          if (refer) {
            resolve(refer);
          } else {
            reject();
          }
        });
      },

    mobileCheck: (number) => {
        return new Promise(async (resolve, reject) => {
          let response = {};
          let user = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .find({ mobno: number })
            .toArray();
          if (user.length != 0) {
            (response.status = true), (response.user = user);
            resolve(response);
          } else {
            (response.status = false), resolve(response);
          }
        });
      },
    getAllUsers:() => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
            console.log(users);
        
        })
    },
    getAllUsersCount: () => {
        return new Promise(async (resolve, reject) => {
            let userCount = await db.get().collection(collection.USER_COLLECTION).estimatedDocumentCount();
            // console.log(userCount, 'sssssssssssss');
            resolve(userCount)
        })
    },
    blockUser:(userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: { block: true }
            }).then((status) => {
                resolve({ blockStatus: true })
            }).catch((response) => {
                console.log(response);
            })
        })
    },
    unBlockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: { block: false }
            }).then((status) => {
                resolve({ blockStatus: true })
            }).catch((response) => {
                console.log(response);
            })
        })
    },
    CheckUserExistsForLoginOTP: (mob) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobno: mob })
            console.log(user);
            resolve(user)
        })
    },
    LoginOtpUser: (mob) => {
        return new Promise(async (resolve, reject) => {
            var user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobno: mob })
            resolve(user)
        })
    },
    addtoCart:(proId,userId) => {
        let proObj = {
            item:objectId(proId),
            quantity:1
        }
        return new Promise( async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if(proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc: {'products.$.quantity':1}
                    }
                    ).then(() => {
                        resolve()
                    })
                }else {
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                        $push:{products:proObj}
                    
                }
                ).then((response) => {
                    resolve()
                })
            }
            }else{
                let cartObj = {
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId) => {
        return new Promise( async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)

        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count);
        details.quantity = parseInt(details.quantity);
        return new Promise((resolve, reject) => {
          if (details.count == -1 && details.quantity == 1) {
            db.get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                { _id: objectId(details.cart) },
                {
                  $pull: { products: { item: objectId(details.product) } },
                }
              )
              .then((response) => {
                resolve({ removeProduct: true });
              });
          } else {
            db.get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                {
                  _id: objectId(details.cart),
                  "products.item": objectId(details.product),
                },
                {
                  $inc: { "products.$.quantity": details.count }
                }
              )
              .then((response) => {
                resolve({ status: true });
              });
          }
        });
      },

    removeCartItem: (proId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, 
            {
                $pull: {
                    products: { item: objectId(proId) }
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getTotalAmount: (userId) => {
        // product.price = parseInt(product.price)

        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }
            ]).toArray()
            console.log(total[0]?.total);
            resolve(total[0]?.total)
        })
    },
    getUserDetials: (userId) => {
        return new Promise(async (resolve, reject) => {
           let userDetils = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            resolve(userDetils)
        })
    },
    updateProfile: (user) => {
        // console.log(user,'qwwqqqqqqqqqqqqq');
        // console.log(userId,'userid');
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(user.id) },
                    {
                        $set: {
                            name: user.firstname,
                            email: user.email,
                            dob: user.dob,
                            mobno: user.mobno,
                            altermobno: user.altermobno
                        }
                    }, { upsert: true }
                ).then((response) => {
                    resolve()
                })
        })
    },
    changePassword: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(data.userID) }).then((user) => {
                console.log(user);
                bcrypt.compare(data.currentpassword, user.password).then(async (status) => {
                    console.log(status, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                    console.log(data.password);
                    console.log(data.confirmpassword);
                    if (status) {

                        newpassword = await bcrypt.hash(data.password, 10)
                        confirmpassword = await bcrypt.hash(data.confirmpassword, 10)
                        await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(data.userID) }, {
                            $set: {
                                password: newpassword,
                                confirmpassword: confirmpassword
                            }
                        })
                        console.log("dgdfdfdffdfdfdf");
                        resolve({ status: true })
                    } else {
                        resolve({ status: false })
                    }
                })
            })
        })
    },
    placeOrder: (order, products, total, userAddress) => {
        return new Promise((resolve, reject) => {
            console.log(order,products,total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: userAddress,
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date(),
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((data) => {

                db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { _id: objectId(order.userId) },
                  {
                    $unset: { couponamount: "" },
                  }
                );
    
              if (order["payment-method"] === "COD") {
                db.get()
                  .collection(collection.CART_COLLECTION)
                  .deleteOne({ user: objectId(order.userId) });
              }
                resolve(data.insertedId)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log(cart);
            resolve(cart.products)
        })
    },
    getUserAddress: (addressId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(addressId) })
            resolve(address)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: 'INR',
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(order);
                    resolve(order)
                }
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'ZTuvlVd8WS0kW6mEbmdFKKnl')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId,userID) => {
        return new Promise((resolve, reject) => {
            // console.log("Paypal");
            // console.log(orderId+" "+userID);
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: 'placed'
                }
            }).then(() => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userID) }).then(() => {
                    resolve()
                })
            })
        })
    },

    cancelPayment : (orderId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: 'Failed'
                }
            }).then(() => {
                resolve(true)
            })
        })
    },

    getCart: (userId) => {
        return new Promise(async (resolve, reject) => {
          let cart = await db
            .get()
            .collection(collection.CART_COLLECTION)
            .findOne({ user: objectId(userId) });
          resolve(cart);
        });
      },

      getUserWallet: (userId) => {
        return new Promise((resolve, reject) => {
            let user = db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                // console.log(user, '11111111111111111111111');
                resolve(user)
            })
        })
    },
    updateCart: (userId, final, discount) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), couponApplied: true },
              {
                $set: {
                  finalPrice: final,
                  discount: discount,
                  couponApplied: false,
                },
              }
            )
            .then(() => {
              resolve();
            })
            .catch(() => {
              reject();
            });
        });
      },
      updateCartWallet:(userId,final)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{$set:{walletFinal:final}}).then(()=>{
            resolve()
          })
        })
      },
}