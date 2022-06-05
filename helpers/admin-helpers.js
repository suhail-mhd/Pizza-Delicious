let db = require('../config/connection')
let collection = require('../config/collection')
let bcrypt = require('bcrypt')
const objectId = require('mongodb').ObjectId


module.exports ={
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email })
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })

            } else {
                resolve({ status: false })
            }
        })
    },
   
}