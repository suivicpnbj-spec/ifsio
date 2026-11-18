
$(document).ready(function(){    

    $('#form-calculator-padme').on('submit', function(e){
        e.preventDefault();
        let data = $(this).serializeArray(),
        montant = $('#simulateur_montant').val(),
        taux = $('#simulateur_interet').val() / 100,
        duree = $('#simulateur_dure_remboursement').val();

        let result = montant / ((1 - (Math.pow((1+taux), - duree )))/taux);
        
        $("#simulateur_result").html(result.toLocaleString());
        $('#mes').modal('show')

    });

    $("#mes_close").on('click', () => $("#mes").modal('hide'));

    $(".simulateur_champs").on('keyup', function(e){
        if($(this).val() == '') $("#simulateur_result").val(null)
    })

    
});

        