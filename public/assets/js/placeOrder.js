$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            // alert(response)
            if (response.codSuccess) {
                location.href = '/order-success'
            } else if(response.paypal) {
                location.href= response.val
            }
            else{
                razorpayPayment(response)
            }
        }
    })

})

function razorpayPayment(order) {

    var options = {
        "key": "rzp_test_01xxpPseANbvFg", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Pizza Delicious",
        "description": "Test Transaction",
        "image": "/assets/images/favicon.png",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature)

            verifyPayment(response, order)
        },
        "prefill": {
            "name": "Mohamed Suhail",
            "email": "suhailmhd070@gmail.com",
            "contact": "9526103163"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#FAC564"
        },
        modal:{
            escape:false,
            ondismiss : function(){
                $.ajax({
                    url: '/cancel-payment',
                    data: {
                        id:order.orderId
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.status) {
                            
                        }
                    }
                })
            }
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.href = '/order-success'
            } else {
                alert('payment failed')
            }
        }
    })
}