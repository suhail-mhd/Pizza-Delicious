var express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/products-helpers')
const userHelpers = require('../helpers/user-helpers')
const addressHelpers = require('../helpers/address-helpers')
const orderHelpers = require('../helpers/order-helpers')
const couponHelper = require('../helpers/coupon-helpers')
const offerHelper = require('../helpers/offer-helpers')
const banerHelpers = require('../helpers/banner-helpers')
const createReferal = require('referral-code-generator')
const dotenv = require('dotenv');
const async = require('hbs/lib/async');
require("dotenv").config();
const paypal = require("paypal-rest-sdk");
const twilio = require("twilio");





// var messagebird = require('messagebird')('BIok4xyzLn5bMwAoOB6CT54Xn')
const accountSid = process.env.TWILIO_accountSid;
const authToken = process.env.TWILIO_authToken;
const serviceId = process.env.TWILIO_serviceId;
const client = new twilio(accountSid, authToken);

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,

  client_secret: process.env.PAYPAL_CLIENT_SECRET
});



const verifyLogin = (req,res,next) => {
  if(req.session.loggedIn) {
    next()
  }else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async(req, res, next) => {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if(user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let Baner = await banerHelpers.getallbaners();

   productHelpers.getAllProducts().then((products) => {
     res.render('user/homepage',{products, User:user, cartCount, user:true, Baner});
  })
});

// login setup

router.get('/login', (req,res) => {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
  res.render('user/user-login',{Error:req.session.Error, user:true})
  req.session.Error = false;
  }
})


router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if(response.status){
      req.session.user = response.user
      req.session.loggedIn = true
      res.redirect('/')
    }else {
      req.session.Error = 'Invalid user details',
      res.redirect('/login')
    }
  })
})

// login with OTP

router.get("/otp", (req, res) => {
  res.render("user/otp-login", {
   
    error: req.session.verifyErr,
    user:true
  });
  req.session.verifyErr = false;
});



router.post("/otp-login", (req, res) => {
  userHelpers.mobileCheck(req.body.number).then((response) => {
    if (response.status) {
      req.session.user = response.user[0];
      req.session.number = req.body.number;
      client.verify
        .services(serviceId)
        .verifications.create({ to: "+91" + req.body.number, channel: "sms" })
        .then((verification) => console.log(verification.status));
      res.render("user/get-otp", { user:true});
    } else {
      let Moberr = "Please enter registerd Mobile Number";
      res.render("user/otp-login", { Moberr});
    }
  });
});


router.post("/otp-submit", (req, res) => {
  let number = req.session.number;
  client.verify
    .services(serviceId)
    .verificationChecks.create({ to: "+91" + number, code: req.body.otp })
    .then((verification_check) => {
      let loginOtpFinal = verification_check.status;
      if (loginOtpFinal == "approved") {
        req.session.loggedIn = true;
        res.redirect("/");
      } else {
        let otpErr = "Invalid OTP number";
        res.render("user/get-otp", { otpErr });
        otpErr = null;
      }
    });
});

// signup setup

router.get('/signup', (req,res) => {
  let refer=req.query.refer?req.query.refer:null
  res.render('user/user-signup',{user:true, refer, 'referErr':req.session.referErr})
  req.session.signUpErr=false
  req.session.referErr=false
})

router.post('/signup', (req, res) => {
  let password = req.body.password
  let confirmPassword = req.body.confirmpassword

  let refer=createReferal.alphaNumeric('uppercase', 2, 3)
  req.body.refer=refer
  if(req.body.referedBy!=''){
    userHelpers.checkReferal(req.body.referedBy).then((data)=>{
      req.body.referedBy=data[0]._id
      req.body.wallet=100
      userHelpers.doSignup(req.body).then((response)=>{
        req.session.loggedIn=true
        req.session.user=response.user
        res.redirect('/')
      })
    }).catch(()=>{
      req.session.referErr="Sorry No such Code Exists"
      res.redirect('/signup')
    })
  }
  else if (password !== confirmPassword) {
    // res.redirect('/signup?valid=' + 'true')
    let passwordError = 'Password not matching'
    res.render('user/user-signup', { passwordError, user:true })
  }else {
    userHelpers.doSignup(req.body).then((response) => {
      console.log(response);
      req.session.user = response
      req.session.loggedIn = true
      res.redirect('/')
    }).catch((error) => {
      req.session.signUpErr=err
      req.session.EmailError = error.data
      req.session.EmailError = true
      res.redirect('/signup')
    })
  }
})



// user menu

router.get('/user/menu', async (req,res) => {
  let user = req.session.user
  let cartCount = null
  if(user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/menu',{products, User:user, user:true,cartCount});
 })
})

router.get('/user/product-details/:id', async (req,res) => {
  let user = req.session.user

  let id=req.params.id;
  console.log(id);
  let cartCount = null
  if(user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }

  productHelpers.getProductDetails(id).then((proDetails)=>{
    console.log(proDetails);
    res.render('user/product-details',{user:true,proDetails,User:user,cartCount})
  })
})

// cart

router.get('/cart', verifyLogin, async(req,res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = 0
if(products.length>0) {
  totalValue = await userHelpers.getTotalAmount(req.session.user._id)
} 

  
    res.render('user/cart', { user: true, User:req.session.user, products,totalValue})
})

router.get('/add-to-cart/:id', (req,res) => {
  console.log('called');
  userHelpers.addtoCart(req.params.id, req.session.user._id).then(() => {
    res.json({status:true})
  })
})

router.post('/change-product-quantity',verifyLogin,(req,res,next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/removeCartItem/:id', (req, res) => {
  
  console.log(req.params.id);
  let userId = req.session.user._id
  // console.log(user);
  userHelpers.removeCartItem(req.params.id, userId).then(() => {
    res.redirect('/cart')
  })
})

// apply coupon

router.get("/applyCoupon", verifyLogin, (req, res) => {
  let userId = req.session.user._id;
  couponHelper.checkCoupon(req.query.coupon, userId).then((response) => {
    res.json(response);
  });
});

// place order

router.get('/place-order',verifyLogin, async (req,res) => {
  let user = req.session.user
  let userId = user._id

  let userDetails = await userHelpers.getUserDetials(userId)

  let address = await addressHelpers.getAlladdress(user)
  let userCart=await userHelpers.getCart(req.session.user._id)


  

  // console.log(userDetails, 'userdetialssssssssssssssss');
  userHelpers.getTotalAmount(req.session.user._id).then((total) => {
    if (userDetails.couponamount) {
      var grandTotal = total - (userDetails.couponamount * total) / 100;
    } else {
      grandTotal = total;
    }
    let discount = (userDetails.couponamount * total) / 100;
    
    let wallet = null
    if (userDetails.wallet != 0) {
      wallet = userDetails.wallet;
    }
    
  
    res.render('user/place-order',{user:true,User:req.session.user, total,address, grandTotal, discount, wallet})
  })

  
})

router.post('/place-order',verifyLogin, async(req,res) => {
  req.body.userId = req.session.user._id

  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  let userAddress = await userHelpers.getUserAddress(req.body.addressid)


  let discount = null;

  let user = await userHelpers.getUserDetials(req.body.userId)
  if (user.couponamount) {
    discount = user.couponamount;
    totalPrice = totalPrice - (discount * totalPrice) / 100;
  }

  if (req.body.checked) {
    let walletAmount = req.body.checked;
    totalPrice = totalPrice - walletAmount;
  }

  // let tot = parseFloat(totalPrice / 75).toFixed(2)
  // console.log(tot);
  req.session.totalAmount = totalPrice
  // let orderId = req.session.orderId;


  userHelpers.placeOrder(req.body,products,totalPrice,userAddress).then((orderId) => {
    req.session.orderId = orderId;

    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['payment-method'] === 'ONLINE') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        response.orderId = orderId;
        res.json(response)
      })
    } else if (req.body['payment-method'] === 'PAYPAL') {

      // let orderId=orderId.toString()
      // req.session.orderId = orderId;

      console.log(orderId,'hiiiiiiii');

      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal",
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/success",
          "cancel_url": "http://localhost:3000/cancel",
        },
        "transactions": [
          {
            "item_list": {
              "items": [
                {
                  "name": orderId,
                  "sku": "001",
                  "price": totalPrice,
                  "currency": "USD",
                  "quantity": 1,
                },
              ],
            },
            "amount": {
              "currency": "USD",
              "total": totalPrice,
            },
            "description": "order for Pizza Delicious",
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        
        console.log('reached here');
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              console.log('paypal,,,,,,,,,,');
              // console.log(payment.links[i]);
              res.json({ paypal: true, val: payment.links[i].href });
            }
          }
        }
      });

    }
  })
  console.log(req.body);
})

router.get("/success", (req, res) => {
  console.log('2');

  let orderId = req.session.orderId;
  console.log(orderId);

  let tot = req.session.totalAmount
  // let tot = req.query.tot;
  console.log(tot);
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [
      {
        "amount": {
          "currency": "USD",
          "total": tot,
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      
      userHelpers.changePaymentStatus(req.session.orderId, req.session.user._id).then(() => {
        res.redirect('/order-success')
      })
    }
  });
});

router.get('/cancel', (req, res) => {
  redirect('/')
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  let userId = req.session.user._id;

  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]'], userId).then(() => {
      console.log('payment successfull');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: 'error occurred' })
  })
})

router.post('/cancel-payment',(req,res)=>{
  const {id} = req.body;
  console.log(req.body);
  userHelpers.cancelPayment(id).then((response)=>{
    if(response){
      res.status(200).send({status:true})
    }
  })
})

// delivery address

router.get('/view-address', verifyLogin, async (req, res) => {
  let user = req.session.user
  // console.log(user);
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  await addressHelpers.getAlladdress(user).then((address) => {
    console.log(address);
    res.render('user/view-address', { user: true, User:user, address, cartCount })
  })

})

router.get('/add-address', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  console.log(user);
  res.render('user/add-address', { user: true, user, cartCount })
})

router.post('/add-address', verifyLogin, (req, res) => {
  console.log(req.body);
  addressHelpers.addAddress(req.body).then((response) => {
    console.log(response);
    res.redirect('/place-order')
  })
})

router.get('/edit-address/:id', verifyLogin, async (req, res) => {
  let user = req.session.user

  await addressHelpers.getOneAddress(req.params.id).then((addressDetails) => {
    res.render('user/edit-address', { user: true, User:user, addressDetails })
  })
})

/*post edit address */
router.post('/edit-address', verifyLogin, (req, res) => {
  console.log(req.body);
  addressHelpers.updateAddress(req.body).then(() => {
    res.redirect('/view-address')
  })
})

router.get('/delete-address/:id', verifyLogin, (req, res) => {

  addressHelpers.deleteAddress(req.params.id).then(() => {
    res.redirect('/view-address')
  })
})

// user profile

router.get('/profile', verifyLogin, async (req, res) => {
  let user = req.session.user
  var userid = user._id
  // console.log(user, 'fdfdffdffdf');
  let cartCount = null
  if (req.session.user) {
    user = await userHelpers.getUserDetials(userid)
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('user/user-profile', { user: true, User:user, cartCount })
})

router.get('/edit-profile/:id', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let userDetails = await userHelpers.getUserDetials(req.params.id)
  console.log(userDetails, 'userdetilas');
  res.render('user/edit-profile', { user: true, User:user, cartCount, userDetails })
})

router.post('/edit-profile', verifyLogin, (req, res) => {
  // let userId = req.session.userLoggedIn._id
  // console.log(userId);
  console.log(req.body, 'sadfgbhnmj,kl');
  userHelpers.updateProfile(req.body).then(() => {
    res.redirect('/profile')
  })
})

router.get('/change-password', verifyLogin, (req, res) => {
  let user = req.session.user
  if (req.query.valid) {
    var passwordError = req.query.valid
  }
  res.render('user/change-password', { user: true, User:user, passwordError })
})

router.post('/change-password', (req, res) => {
  userHelpers.changePassword(req.body).then((response) => {
    if (response.status) {
      req.session.user = null
      req.session.loggedIn = false
      res.redirect('/')
    }
    else {
      var string = encodeURIComponent('Enter the correct password');
      res.redirect('/change-password?valid=' + string)
    }
  })
})

// order success

router.get('/order-success', (req, res) => {
  let user = req.session.user
  // console.log(req.body);
  res.render('user/order-success', { User:user, user: true })
})

// cancel order

router.get('/cancel-order', (req, res) => {
  console.log(req.query.id);
  console.log(req.query.status);

  orderHelpers.changeStatus(req.query.status, req.query.id).then((response) => {
    res.redirect('/order-status')
  })
})

// show order

router.get('/order-status', verifyLogin, async (req, res) => {

  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  await orderHelpers.getUserAllOrders(user).then((userAllOrders) => {
    for(let i=0;i<userAllOrders.length;i++){
      userAllOrders[i].date=(userAllOrders[i].date+"").slice(0,24)
    }
    res.render('user/order-status', { user: true, User:user, userAllOrders, cartCount })
  })
})

router.get('/order-details/:id', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  // console.log(req.params.id);
  await orderHelpers.getOrderDetails(req.params.id).then((orderDetails) => {
    address = orderDetails[0].deliveryDetails
    orderId = orderDetails[0]._id;
    orderStatus = orderDetails[0].status;
    cancelStatus = orderDetails[0].cancelStatus;
    deliveryStatus = orderDetails[0].deliveryStatus
    shippedStatus = orderDetails[0].shippedStatus
    if (orderStatus == 'placed') {
      orderStatus = true
    }

    res.render('user/one-order-details', { user: true, User:user, orderDetails, address, cartCount, orderId, orderStatus, cancelStatus, deliveryStatus, shippedStatus })
  })
})

// coupon offers

router.get('/coupons-offers', verifyLogin, async (req, res) => {
  let user = req.session.user
  let coupons = await couponHelper.getAllCoupons()
  let productoffer = await offerHelper.GetAllProductOffers()
  let categoryoffer = await offerHelper.getCategoryOffer()

  // console.log(coupons, '111111111111');
  res.render('user/coupon-offers', { user: true, User:user, coupons, productoffer, categoryoffer })
})

// wallet

router.get('/wallet', verifyLogin, async (req, res) => {
  let user = req.session.user
  let userId = user._id;
  let refer=user.refer
  let wallet=user.wallet
  let referalLink='https://pizzadelicious.in/signup?refer='+refer


  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(userId)
  }
  // let userDetails = await userHelpers.getUserWallet(userId)

  // let wallet = null;

  // if (userDetails.wallet) {
  //   wallet = userDetails.wallet
  // }
  res.render('user/wallet', { user: true, User:user, cartCount, wallet,referalLink })

})

// logout setup

router.get('/logout', (req, res) => {
  req.session.user = null;
  req.session.loggedIn = false;
  res.redirect('/login')
})




module.exports = router;
