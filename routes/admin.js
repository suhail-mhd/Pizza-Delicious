var express = require("express");
const { response } = require("../app");
const router = express.Router();
const productHelpers = require("../helpers/products-helpers");
const userHelper = require("../helpers/user-helpers");
const categoryHelper = require("../helpers/category-helpers");
const orderHelper = require("../helpers/order-helpers");
const offerHelper = require("../helpers/offer-helpers");
const couponHelper = require("../helpers/coupon-helpers");
const bannerHelpers = require("../helpers/banner-helpers");

const adminLogin = {
  name: 'Admin',
  emailId: 'admin@gmail.com',
  password: 'admin'
}


const verifyLogin = (req, res, next) => {
  if (req.session.login) {
      next()
  } else {
    res.render('admin/admin-login',{user:true})
  }
}

// admin login setup

router.get('/', (req, res) => {
  if (req.session.login) {
      res.redirect('/admin/adminhome')
  } else {
      res.render('admin/admin-login',{user:true})
  }
})

/*Post admin login */
router.post('/adminlogin', (req, res) => {
  if (adminLogin.emailId == req.body.email && adminLogin.password == req.body.password) {
      req.session.login = true
      req.session.email = req.body.email
      req.session.password = req.session.password
      req.session.name = adminLogin.name
      let data = req.session.name
      res.redirect('/admin/adminhome')
  }
  else {
      var error = 'Invalid username or password..'
      res.render('admin/admin-login', { error })
  }
})

router.get("/adminhome",verifyLogin, async  (req, res) => {
  // if (req.session.login) {
    let totalUsers = await userHelper.getAllUsersCount()
    let users = await userHelper.getAllUsers()
    let profit = await orderHelper.getTotalProfit()
    let totalOrders = await orderHelper.TotalOrderCount()
    let totalProductCount = await productHelpers.getAllProductsCount()
    let products = await productHelpers.getAllProducts()
    let razorPayTotal = await orderHelper.getrazroPayTotal()
    let codTotal = await orderHelper.getCodTotal()
    let paypalTotal = await orderHelper.getPaypalTotal()
    let sales=await productHelpers.getTotalSales()
    let pro= await productHelpers.getTotalPro()
    let totalSales = await productHelpers.getSalesTotal();
    let tot = totalSales.reduce(function (accumulator, item) {
      return accumulator + item.totalAmount;
    }, 0);






    res.render('admin/adminpage', {admin: true, totalUsers, profit, totalOrders, totalProductCount, products, razorPayTotal, codTotal, paypalTotal, users, sales, pro,tot })
// } else {
//   res.render('admin/admin-login',{user:true})
// }
});

router.get("/view-products",verifyLogin, async(req, res) => {
  let ProductOffer=await  offerHelper.GetAllProductOffers()

  productHelpers.getAllProducts().then((products) => {
    res.render("admin/view-products", { products, ProductOffer });
  });
});

router.get("/add-product",verifyLogin, async(req, res) => {
  let listCategory = await categoryHelper.getAllCategory()
  res.render("admin/add-product",{listCategory});
});

router.post("/add-product",verifyLogin, (req, res) => {
  console.log(req.body);
  console.log(req.files.Image);
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image;
    let image2 = req.files.Image2;
    let image3 = req.files.Image3;
    image.mv("./public/add-product/" + id + ".jpg");
    image2.mv("./public/add-product/" + id + "image2.jpg");
    image3.mv("./public/add-product/" + id + "image3.jpg");
    res.render("admin/add-product");
  });
});

// edit and delete setup

router.get("/modify-product",verifyLogin, (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/modify-product", { products, admin: true });
  });
});

router.get("/delete/:id", (req, res) => {
  let proId = req.params.id;
  // console.log(proId);

  // console.log("Enteting delete route");

  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/modify-product");
  });
});

router.get("/edit-product/:id", async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  let listCategory = await categoryHelper.getAllCategory()

  console.log(product);
  res.render("admin/edit-product", { product, listCategory });
});

router.post("/edit-product/:id", (req, res) => {
  let id = req.params.id
  productHelpers.UpdateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin/modify-product");
    if(req.files.Image){
    let image = req.files.Image;
    let image2 = req.files.Image2;
    let image3 = req.files.Image3;
    image.mv("./public/add-product/" + id + ".jpg");
    image2.mv("./public/add-product/" + id + "image2.jpg");
    image3.mv("./public/add-product/" + id + "image3.jpg");
    }
  });
});

// user management

/* get user list*/
router.get('/user-manage',verifyLogin,  (req, res) => {
  userHelper.getAllUsers().then((users) => {
    console.log(users);
      res.render('admin/user-manage', {admin: true, users })
  })
})



/*Get user block */

router.get('/block/:id', (req, res) => {
  console.log(req.params.id);
  userHelper.blockUser(req.params.id).then((response) => {
      res.redirect('/admin/user-manage')
  })
})


/*Get user unblock */

router.get('/unblock/:id', (req, res) => {
  console.log(req.params.id);
  userHelper.unBlockUser(req.params.id).then((response) => {
      res.redirect('/admin/user-manage')
  })
})

// category management

router.get('/category',verifyLogin, (req, res) => {
  categoryHelper.getAllCategory().then((category) => {
      // console.log(category);
      res.render('admin/category', { admin: true, category })
  })
})

router.get('/addcategory',verifyLogin, async (req, res) => {

  let listCategory = await categoryHelper.getAllCategory()

  res.render('admin/add-category', { admin: true, listCategory })
})

/*post add category*/
router.post('/addcategory',verifyLogin, (req, res) => {
  categoryHelper.addCategory(req.body).then((response) => {
      res.redirect('/admin/addcategory')
  })
})

/* get edit category */
router.get('/editcategorey/:id', async (req, res) => {
  let oneCategorey = await categoryHelper.getCategory(req.params.id)
  // console.log(oneCategorey, 'heloooooooooo');
  res.render('admin/edit-category', { admin: true, oneCategorey })
})

/* post edit category*/

router.post('/editcategorey/:id', (req, res) => {
  categoryHelper.updateCategory(req.params.id, req.body).then(() => {
      res.redirect('/admin/category')
  })
})

/*delete category*/

router.get('/deletecategory/:id', (req, res) => {
  let catId = req.params.id
  categoryHelper.deleteCategory(catId).then((response) => {
      res.redirect('/admin/category')
  })
})

router.get("/delete-subcategory",verifyLogin, (req, res) => {
  categoryHelper.deletesubCategory(req.query).then(() => {
      res.redirect("/admin/category");
  });
});

// all orders list

router.get('/orders',verifyLogin, async (req, res) => {
  let user = req.session.user
  let products = await productHelpers.getAllProducts()

  orderHelper.getAllOrders2(user).then((allOrders) => {
    // console.log(allOrders)
        for(let i=0;i<allOrders.length;i++){
          allOrders[i].date=(allOrders[i].date+"").slice(0,24)
        }
        res.render('admin/allOrders', {admin: true, allOrders, products })
  })
  // orderHelper.getAllOrders(user).then((allOrders) => {
  //   console.log(allOrders);
  //       res.render('admin/allOrders', {admin: true, allOrders, products })
  // })
  
})

router.get('/status-change',verifyLogin, (req, res) => {
  let status = req.query.status
  let id = req.query.id
  orderHelper.changeStatus(status, id).then((data) => {
      res.redirect('/admin/orders')
  })
})

// sales report

router.get('/salesreport',verifyLogin, async (req, res) => {
  let salesreport = await orderHelper.getsalesReport()
  // console.log(salesreport,'sasasssasas');
  for(let i=0;i<salesreport.length;i++){
    salesreport[i].date=(salesreport[i].date+"").slice(0,24)
  }
  res.render('admin/salesreport', { admin: true, salesreport })
})

router.post('/salesreport/report',verifyLogin, async (req, res) => {
  // console.log('i reached here')
  let salesReport = await orderHelper.getSalesReport(req.body.from, req.body.to)
  // console.log('salesReport')
  // console.log(salesReport)
  res.json({ report: salesReport })
})

router.post('/salesreport/monthlyreport',verifyLogin, async (req, res) => {

  let singleReport = await orderHelper.getNewSalesReport(req.body.type)
  console.log(singleReport,'sssssssssssssss');
  res.json({ wmyreport: singleReport })
})

// product offer

router.get('/add-product-offer/:id',(req,res)=>{
  let ProdId=req.params.id
      res.render('admin/add-productoffer',{admin:true,ProdId})
  })

  router.post('/add-product-offer',(req,res)=>{
   
    offerHelper.AddProductOffers(req.body).then((response)=>{
        res.redirect('/admin/view-products')
    })
   
})

router.get('/product-offer',verifyLogin,async(req,res)=>{

  let ProductOffer=await  offerHelper.GetAllProductOffers()
    res.render('admin/productOffer',{admin:true,ProductOffer})

})

router.post('/RemoveProductOffer',(req,res)=>{
  OfferID=req.body.OfferID
  ProdID=req.body.ProdID
offerHelper.RemoveProductOffer(OfferID,ProdID).then((response)=>{
    res.json({status:true})
})
})


// category offer

router.get("/category-offer",verifyLogin, async (req, res) => {
  let offerview = await offerHelper.getCategoryOffer()
  res.render('admin/categoryOffer', { admin: true, offerview })
})

router.get('/addCategoryOffer',verifyLogin, async (req, res) => {

  let categories = await categoryHelper.getAllCategory()
  console.log(categories, '1111111111111');

  res.render('admin/add-categoryoffer', { admin: true,categories })
})

router.post('/addCategoryOffer',verifyLogin, async (req, res) => {

  console.log(req.body);

  let viewPro = await offerHelper.addCategoryOffer(req.body)
  res.json(viewPro)

  // res.redirect('/admin/category-offer')

});

router.post('/deleteOffer', async (req, res) => {

  console.log(req.body);

  let response = await offerHelper.deleteCategoryOffer(req.body.catOfferId, req.body.offerItem)
  res.json({ status: true })

})

// coupons

router.get("/coupons",verifyLogin, async (req, res) => {
  let coupons = await couponHelper.displayCoupon();
  for(let i=0;i<coupons.length;i++){
    coupons[i].expiry=(coupons[i].expiry+"").slice(0,24)
  }
  res.render("admin/coupons", { admin: true, coupons });
});

router.get("/add-coupons",verifyLogin, function (req, res) {
  res.render("admin/add-coupon", { admin: true });
});

router.post("/add-coupons",verifyLogin, (req, res) => {
  couponHelper.addCoupon(req.body).then((response) => {
    res.redirect("/admin/coupons");
  });
});

router.get("/delete-coupon/:id", (req, res) => {
  let couponId = req.params.id;
  couponHelper.deleteCoupon(couponId).then((response) => {
    res.redirect("/admin/coupons");
  });
});

// banner management

router.get("/baners",verifyLogin, function (req, res) {
  bannerHelpers.getallbaners().then((baner) => {
    res.render("admin/banners", { admin: true, baner });
  });
});

router.get("/add-baner",verifyLogin, function (req, res) {
  res.render("admin/add-banner", { admin: true });
});

router.post("/add-baner",verifyLogin, (req, res) => {
  bannerHelpers.addBaner(req.body, (id) => {
    let image = req.files.image;
    image.mv("./public/baner-images/" + id + ".jpg");

    res.render("admin/add-banner", { admin: true });
  });
});

router.get("/edit-baner/:id", async (req, res) => {
  let Baner = await bannerHelpers.getBanerDetails(req.params.id);
  res.render("admin/edit-banner", { Baner, admin: true });
});

router.get("/delete-baner/:id", (req, res) => {
  let banerId = req.params.id;
  bannerHelpers.deleteBaner(banerId).then((response) => {
    res.redirect("/admin/baners");
  });
});

// POST edit baner
router.post("/edit-baner/:id", (req, res) => {
  let id = req.params.id;
  bannerHelpers.updateBaner(req.params.id, req.body).then(() => {
    res.redirect("/admin/baners");
    if (req.files.image) {
      let image = req.files.image;
      image.mv("./public/baner-images/" + id + ".jpg");
    }
  });
});

// signout setup

router.get('/signout', (req, res) => {
  req.session.admin=null
  res.redirect('/admin')
})


module.exports = router;
