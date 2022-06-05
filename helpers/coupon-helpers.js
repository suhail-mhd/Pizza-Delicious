let db = require('../config/connection')
let collection = require('../config/collection')
const objectId = require('mongodb').ObjectId

module.exports = {
    addCoupon: (couponDetails) => {
      let date = new Date();
      let NewDate = date;
  
      let coupon = {
        couponcode: couponDetails.couponcode,
        discount: parseInt(couponDetails.discount),
        description: couponDetails.description,
        expiry: new Date(couponDetails.expiry),
        createdAt: NewDate,
        // minamount: parseInt(couponDetails.minamount)
      };
      return new Promise(async (resolve, reject) => {
        await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .insertOne(coupon)
          .then((response) => {
            resolve();
          });
      });
    },
  
    displayCoupon: async () => {
      let coupons = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .sort({_id:-1})
        .toArray();
      return coupons;
    },
    getAllCoupons: () => {
      return new Promise(async (resolve, reject) => {
        let coupons = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .find({})
          .toArray();
        resolve(coupons);
      });
    },
    deleteCoupon: (couponId) => {
      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.COUPON_COLLECTION)
          .deleteOne({ _id: objectId(couponId) })
          .then((response) => {
            resolve(response);
          });
      });
    },
  
  
    //  GET DISCOUNT
    checkCoupon: (AppliedCoupon, UserID) => {
      let date = new Date();
      let dateStart = Date.parse(date);
      let Coupon = AppliedCoupon;
      var UseriD = {
        userID: UserID,
      };
      return new Promise(async (resolve, reject) => {
        Couponapplied = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ _id: objectId(UserID) });
  
        if (Couponapplied.couponamount) {
          resolve({ OneCouponUsed: true });
        } else {
          CouponOffer = await db
            .get()
            .collection(collection.COUPON_COLLECTION)
            .findOne({ couponcode: Coupon }, { expiry: Coupon });
          let dateFinal = Date.parse(CouponOffer.expiry);
          if (CouponOffer) {
            if (dateFinal < dateStart) {
              resolve({ timeout: true });
            } else if (CouponOffer.users) {
              var CoupenExist = CouponOffer.users.findIndex(
                (users) => users.userID == UserID
              );
              if (CoupenExist != -1) {
                resolve({ CoupenUsed: true });
              } else if (dateFinal < dateStart) {
                resolve({ timeout: true });
              } else {
                await db
                  .get()
                  .collection(collection.USER_COLLECTION)
                  .updateOne(
                    { _id: objectId(UserID) },
                    { $set: { couponamount: CouponOffer.discount } }
                  );
                await db
                  .get()
                  .collection(collection.COUPON_COLLECTION)
                  .updateOne(
                    { _id: CouponOffer._id },
                    { $push: { users: UseriD } }
                  )
                  .then((response) => {
                    CoupDiscount = CouponOffer.discount;
                    resolve({ Coupon: true, CoupDiscount });
                  });
              }
            } else {
              await db
                .get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { _id: objectId(UserID) },
                  { $set: { couponamount: CouponOffer.discount } }
                );
              await db
                .get()
                .collection(collection.COUPON_COLLECTION)
                .updateOne({ _id: CouponOffer._id }, { $push: { users: UseriD } })
                .then((response) => {
                  CoupDiscount = CouponOffer.discount;
                  resolve({ Coupon: true, CoupDiscount });
                });
            }
          } else {
            resolve({ NoCoupon: true });
          }
        }
      });
    },
  };
