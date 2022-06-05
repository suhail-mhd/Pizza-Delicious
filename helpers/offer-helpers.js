let db = require('../config/connection')
let collection = require('../config/collection')
const objectId = require('mongodb').ObjectId


module.exports = {

   
/////////////// /*product offers*/////////////////
AddProductOffers: (offer) => {
    offer.ProdId = objectId(offer.ProdId);
    offer.discount = parseInt(offer.discount);
    var bodyProdId = offer.ProdId;
    return new Promise(async (resolve, reject) => {
      let ProdOffExixt = await db
        .get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .findOne({ ProdId: bodyProdId });
      if (ProdOffExixt) {
        resolve({ Exist: true });
      } else {
        await db
          .get()
          .collection(collection.PRODUCT_OFFER_COLLECTION)
          .insertOne(offer)
          .then(async (data) => {
            insertproOffer = await db
              .get()
              .collection(collection.PRODUCT_OFFER_COLLECTION)
              .findOne({ _id: data.insertedId });
            prodDis = insertproOffer.discount;
          });
        let ProdId = offer.ProdId;
        OfferProduct = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ _id: objectId(ProdId) });
        let comingPercentage = parseInt(prodDis);
        let activerpercentage = OfferProduct.categotyofferPercentage;
        let bestOff =
          comingPercentage < activerpercentage
            ? activerpercentage
            : comingPercentage;
        if (OfferProduct.categoryoffer) {
          let price = OfferProduct.OldPrice;
          let offerprice = price - (price * bestOff) / 100;
          offerprice = parseInt(offerprice.toFixed(0));
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              {
                _id: objectId(ProdId),
              },
              {
                $set: {
                  OldPrice: price,
                  price: offerprice,
                  offerPercentage: bestOff,
                  bestoffer: bestOff,
                  ProductOffer: true,
                },
              }
            );
        } else {
          let price = OfferProduct.price;
          let offerPrice = price - (price * comingPercentage) / 100;
          offerPrice = parseInt(offerPrice.toFixed(0));
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              {
                _id: objectId(ProdId),
              },
              {
                $set: {
                  OldPrice: price,
                  price: offerPrice,
                  offerPercentage: bestOff,
                  bestoffer: bestOff,
                  ProductOffer: true,
                },
              }
            );
        }
        resolve({ Exist: false });
      }
    });
  },

  GetAllProductOffers: () => {
    return new Promise(async (resolve, reject) => {
      var ProductOffer = await db
        .get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .aggregate([
          {
            $project: {
              _id: "$_id",
              ProdId: "$ProdId",
              discount: "$discount",
              offertype: "$offertype",
              validity: "$validity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "ProdId",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              _id: 1,
              ProdId: 1,
              discount: 1,
              offertype: 1,
              validity: 1,
              productname: "$product.productname",
            },
          },
        ])
        .toArray();
      resolve(ProductOffer);
    });
  },
  RemoveProductOffer: (OfferID, ProdID) => {
    return new Promise(async (resolve, reject) => {
      let items = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(ProdID) },
          },
        ])
        .toArray();
      let productPrice = items[0].OldPrice;
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          {
            _id: objectId(ProdID),
          },
          {
            $set: {
              price: productPrice,
              categoryoffer: false,
              ProductOffer: false,
              bestoffer: null,
              offerPercentage: null,
              OldPrice: null,
            },
          }
        );
      db.get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .deleteOne({ _id: objectId(OfferID) })
        .then(() => {
          resolve();
        });
    });
  },

   /////////////// /*category offers*/////////////////

    getCategoryOffer: () => {
        return new Promise(async (resolve, reject) => {
            let offerList = await db.get().collection(collection.OFFERS_COLLECTION).find().toArray();
            resolve(offerList);
        });
    },
    addCategoryOffer: (offer) => {
        offer.discount=parseInt(offer.discount)

        let offerItem = offer.offerItem;

        return new Promise(async (resolve, reject) => {
            let offerExist = await db.get().collection(collection.OFFERS_COLLECTION).findOne({ offerItem: offerItem })
            console.log(offerExist, 'offferrrrrrrrr exitsttttttttttttt');

            if (offerExist) {
                resolve({ Exist: true })

            } else {
                db.get().collection(collection.OFFERS_COLLECTION).insertOne(offer).then(async (data) => {
                    let activeOffer = await db.get().collection(collection.OFFERS_COLLECTION).findOne({ _id: data.insertedId })

                    console.log(activeOffer, 'activvvvvvvvvvvvvvvvvvvvvvveeeeeeeeeeeeee ffffoeeroferrr');

                    //let Id = activeOffer._id;
                    let discount = activeOffer.discount;

                    discount=parseInt(discount)

                    let category = activeOffer.offerItem;

                    //  let validity = activeOffer.validity;

                    let items = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                        {
                            $match: { $and: [{ category: category }, { offer: false }] },
                        },
                    ]).toArray();

                    console.log(items, 'item 1111111111111111111111111111sssssssssssss');

                    await items.map(async (product) => {
                        let productPrice = product.price;

                        let offerPrice = productPrice - (productPrice * discount) / 100;
                        offerPrice = parseInt(offerPrice.toFixed(2));
                        let proId = product._id + "";

                        await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId)},
                            {
                                $set: {
                                    price: offerPrice,
                                    offer: true,
                                    OldPrice: productPrice,
                                    offerPercentage: parseInt(discount),
                                },
                            }
                        );
                    });

                    let Item2 = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                        {
                            $match: {
                                $and: [{ category: category }, { ProductOffer: true }],
                            },
                        },
                    ]).toArray();

                    console.log(Item2, 'itemmmmm 222222222222222222');
                    
                    console.log(Item2[0],'item 2 1st');

                    if (Item2[0]) {

                        await Item2.map(async (product) => {

                            console.log(product,'map products????????????????????');

                            let ProdName = product.productname;

                            proOFF = await db.get().collection(collection.PRODUCTOFFERS_COLLECTION).aggregate([
                                {
                                    $match: { items: { $regex: ProdName, $options: "i" } },
                                },
                            ]).toArray();

                            console.log(proOFF, 'offfffffffffff');

                            let proOffPercentage = parseInt(proOFF[0].discount);

                            discount = parseInt(discount);

                            let BSToFF = proOffPercentage < discount ? discount : proOffPercentage;
                            let prize = product.OldPrice;
                            let offerrate = prize - (prize * BSToFF) / 100;

                            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id)},
                                {
                                    $set: {
                                        price: offerrate,
                                        offer: true,
                                        OldPrice: prize,
                                        offerPercentage: parseInt(BSToFF),
                                    },
                                }
                            );
                        });
                    } else {
                    }

                    resolve({ Exist: false });
                });
            }
        });
    },
    deleteCategoryOffer: (offId, category) => {

        return new Promise(async (resolve, reject) => {
            let items = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { $and: [{ category: category }, { ProductOffer: false }] },
                },
            ]).toArray();

            console.log(items,'delete items offers where product offer not exist');

            await items.map(async (product) => {
                let productPrice = product.OldPrice;

                let proId = product._id + "";

                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId)},
                    {
                        $set: {
                            price: productPrice,
                            offer: false,
                            offerPercentage:null
                        },
                    }
                );
            });

            let itemforUpdate = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { $and: [{ category: category }, { ProductOffer: true }] },
                },
            ]).toArray();

            console.log(itemforUpdate,'delete category offer product offer exist');

            if (itemforUpdate[0]) {
                await itemforUpdate.map(async (product) => {
                    let proName = product.productname;
                    let Off = await db.get().collection(collection.PRODUCTOFFERS_COLLECTION).aggregate([
                        {
                            $match: { items: { $regex: proName, $options: "i" } },
                        },
                    ]).toArray();

                    let dis = parseInt(Off[0].discount);

                    console.log(dis,'discountttttttttttttt');

                    let prze = product.OldPrice;
                    let offerPrice = prze - (prze * dis) / 100;

                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id)},
                        {
                            $set: {
                                price: offerPrice,
                                offer: true,
                                OldPrice: prze,
                                offerPercentage: dis,
                                ProductOffer: true,
                            },
                        }
                    );
                });
            }

            db.get().collection(collection.OFFERS_COLLECTION).deleteOne({ _id: objectId(offId) }).then(async () => {
                resolve();
            });
        });
    },


}