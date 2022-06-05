

    var today = new Date();
    let tom = String(today.getDate() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    tommor = yyyy + '-' + mm + '-' + tom;
    $('#exp_date1').attr('max', today);
    $('#exp_date2').attr('max', tommor);
    document.getElementById('exp_date1').onchange = e => {
        value = e.target.value
        $('#exp_date2').attr('min', value);
    }

    let table;

    $("#salesDate-form").submit((e) => {
        e.preventDefault()
        $.ajax({
            url: "/admin/salesreport/report",
            method: "post",
            data: $("#salesDate-form").serialize(),
            success: (response) => {
                if (response.report) {
                    table.destroy();
                    document.getElementById('examplebody').innerHTML = ' '

                    for (let i = 0; i < response.report.length; i++) {
                        newelement = `<tr>
                            <td>${i + 1}</td>
                        <td> ${response.report[i]._id} </td>
                         <td> ${response.report[i].userId} </td>
                          <td><span class="badge rounded-pill alert-success"> ${response.report[i].paymentMethod}</span> </td>
                           <td> ${response.report[i].totalAmount} </td>
                            <td> ${response.report[i].date} </td>
                        </tr>`

                        document.getElementById('examplebody').innerHTML += newelement
                    }
                    table = $('#example').DataTable({
                        "footerCallback": function (row, data, start, end, display) {
                            var api = this.api(), data;

                            // Remove the formatting to get integer data for summation
                            var intVal = function (i) {
                                return typeof i === 'string' ?
                                    i.replace(/[\$,]/g, '') * 1 :
                                    typeof i === 'number' ?
                                        i : 0;
                            };

                            // Total over all pages
                            total = api
                                .column(4)
                                .data()
                                .reduce(function (a, b) {
                                    return intVal(a) + intVal(b);
                                }, 0);
                            // Update footer
                            $(api.column(4).footer()).html(
                                ' ( $' + total + ' total)'
                            );
                        },
                        dom: 'Bfrtip',
                        buttons: [
                            'excel', 'pdf', 'print'
                        ],
                        drawCallback: function () {
                            var hasRows = this.api().rows({ filter: 'applied' }).data().length > 0;
                            $('.buttons-excel')[0].style.visibility = hasRows ? 'visible' : 'hidden'
                            $('.buttons-pdf')[0].style.visibility = hasRows ? 'visible' : 'hidden'
                            $('.buttons-print')[0].style.visibility = hasRows ? 'visible' : 'hidden'
                        }


                    });

                }

            }
        })
    })

    function getNewSale() {
        let stat = document.getElementById('status_sales').value
        $.ajax({
            url: '/admin/salesreport/monthlyreport',
            data: {
                type: stat
            },
            method: 'post',
            success: (response) => {
                if (response.wmyreport) {
                    table.destroy()
                    document.getElementById('examplebody').innerHTML = ' '
                    for (let i = 0; i < response.wmyreport.length; i++) {
                        newelement = `<tr>
                            <td>${i + 1}</td>
                        <td> ${response.wmyreport[i]._id} </td>
                         <td> ${response.wmyreport[i].userId} </td>
                          <td><span class="badge rounded-pill alert-success"> ${response.wmyreport[i].paymentMethod}</span> </td>
                           <td> ${response.wmyreport[i].totalAmount} </td>
                            <td> ${response.wmyreport[i].date} </td>
                        </tr>`
                        document.getElementById('examplebody').innerHTML += newelement
                    }
                    table = $('#example').DataTable({
                        "footerCallback": function (row, data, start, end, display) {
                            var api = this.api(), data;

                            // Remove the formatting to get integer data for summation
                            var intVal = function (i) {
                                return typeof i === 'string' ?
                                    i.replace(/[\$,]/g, '') * 1 :
                                    typeof i === 'number' ?
                                        i : 0;
                            };

                            // Total over all pages
                            total = api
                                .column(4)
                                .data()
                                .reduce(function (a, b) {
                                    return intVal(a) + intVal(b);
                                }, 0);


                            // Update footer
                            $(api.column(4).footer()).html(
                                ' ( $' + total + ' total)'
                            );
                        },
                        dom: 'Bfrtip',
                        buttons: [
                            'excel', 'pdf', 'print'
                        ],
                        drawCallback: function () {
                            var hasRows = this.api().rows({ filter: 'applied' }).data().length > 0;
                            $('.buttons-excel')[0].style.visibility = hasRows ? 'visible' : 'hidden'
                            $('.buttons-pdf')[0].style.visibility = hasRows ? 'visible' : 'hidden'
                            $('.buttons-print')[0].style.visibility = hasRows ? 'visible' : 'hidden'
                        }
                    });

                }
            }
        })
    }


    $(document).ready(function () {
        table = $('#example').DataTable({
            "footerCallback": function (row, data, start, end, display) {
                var api = this.api(), data;

                // Remove the formatting to get integer data for summation
                var intVal = function (i) {
                    return typeof i === 'string' ?
                        i.replace(/[\$,]/g, '') * 1 :
                        typeof i === 'number' ?
                            i : 0;
                };

                // Total over all pages
                total = api
                    .column(4)
                    .data()
                    .reduce(function (a, b) {
                        return intVal(a) + intVal(b);
                    }, 0);


                // Update footer
                $(api.column(4).footer()).html(
                    ' ( $' + total + ' total)'
                );
            },
            dom: 'Bfrtip',
            buttons: [
                'excel', 'pdf', 'print'
            ],
            drawCallback: function () {
                var hasRows = this.api().rows({ filter: 'applied' }).data().length > 0;
                $('.buttons-excel')[0].style.visibility = hasRows ? 'visible' : 'hidden'
                $('.buttons-pdf')[0].style.visibility = hasRows ? 'visible' : 'hidden'
                $('.buttons-print')[0].style.visibility = hasRows ? 'visible' : 'hidden'
            }
        });
    });