// var toastMixin = Swal.mixin({
//   toast: true,
//   icon: 'success',
//   title: 'General Title',
//   animation: false,
//   position: 'top-right',
//   showConfirmButton: false,
//   timer: 3000,
//   timerProgressBar: true,
//   didOpen: (toast) => {
//     toast.addEventListener('mouseenter', Swal.stopTimer)
//     toast.addEventListener('mouseleave', Swal.resumeTimer)
//   }
// });

function addToCart(proId) {
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
      success:(response) => {
          if(response.status) {
            let count = $('#cart-count').html()
            count = parseInt(count)+1
            $('#cart-count').html(count)
          }
      }
    })

    var toastMixin = Swal.mixin({
      toast: true,
      icon: 'success',
      title: 'General Title',
      animation: false,
      position: 'bottom',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
  });

  toastMixin.fire({
      animation: true,
      title: 'Item added to cart'
  });
  }

  